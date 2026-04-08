import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, MapPin, Scissors } from 'lucide-react';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from 'sonner';
import type { Bloco } from '@/types/inventario';

const LINHAS_OPTIONS = Array.from({ length: 20 }, (_, i) => `L${i + 1}`);

interface PargaData {
  quantidade: number | null;
  comprimento: number | null;
  altura: number | null;
  espessura: number | null;
  foto_primeira: string | null;
  foto_ultima: string | null;
}

const emptyParga = (): PargaData => ({
  quantidade: null,
  comprimento: null,
  altura: null,
  espessura: null,
  foto_primeira: null,
  foto_ultima: null,
});

export default function Producao() {
  const [searchParams] = useSearchParams();
  const supabase = useSupabaseEmpresa();
  const { empresa, empresaConfig } = useEmpresa();
  const queryClient = useQueryClient();
  const { uploadImage, isUploading } = useImageUpload();

  const [idMm, setIdMm] = useState(searchParams.get('bloco') || '');
  const [bloco, setBloco] = useState<Bloco | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Form fields
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [linha, setLinha] = useState('');
  const [tipoCorte, setTipoCorte] = useState<'total' | 'parcial' | ''>('');
  const [pargas, setPargas] = useState<PargaData[]>([emptyParga(), emptyParga(), emptyParga(), emptyParga()]);

  // Search bloco by ID MM
  const searchBloco = async () => {
    if (!idMm.trim()) return;
    setIsSearching(true);
    setNotFound(false);
    setBloco(null);

    try {
      const { data: result, error } = await supabase
        .from('blocos')
        .select('*')
        .eq('id_mm', idMm.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;
      if (!result) {
        setNotFound(true);
        return;
      }
      setBloco(result as Bloco);
    } catch (err) {
      toast.error('Erro ao pesquisar bloco');
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search on mount if bloco param exists
  useEffect(() => {
    if (searchParams.get('bloco')) {
      searchBloco();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get GPS location
  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        toast.success('Localização obtida');
      },
      () => toast.error('Não foi possível obter localização')
    );
  };

  const updateParga = (index: number, field: keyof PargaData, value: unknown) => {
    setPargas(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handlePhotoUpload = async (pargaIndex: number, slot: 'foto_primeira' | 'foto_ultima', file: File) => {
    const result = await uploadImage(file, {
      bucket: 'produtos',
      naming: { type: 'produto', idmm: `prod_${idMm}_p${pargaIndex + 1}`, slot: slot === 'foto_primeira' ? 'F1' : 'F2' },
      imageMode: 'operacional',
    });
    if (result) {
      updateParga(pargaIndex, slot, result.url);
      toast.success('Foto carregada');
    }
  };

  // Save production
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!bloco) throw new Error('Bloco não selecionado');
      if (!tipoCorte) throw new Error('Selecione o tipo de corte');

      const prefix = empresaConfig?.idPrefix || 'IDMM';
      const timestamp = Date.now().toString(36).toUpperCase();
      const chapaIdMm = `${prefix}-CH-${bloco.id_mm}-${timestamp}`;

      // 1. Create chapa record
      const chapaData: Record<string, unknown> = {
        id_mm: chapaIdMm,
        parque: bloco.parque,
        variedade: bloco.variedade,
        entrada_stock: data,
        linha: linha || null,
        quantidade_m2: 0, // Will be calculated based on pargas
        observacoes: `Produção a partir do bloco ${bloco.id_mm}`,
      };

      // Add parga data
      for (let i = 0; i < 4; i++) {
        const p = pargas[i];
        const idx = i + 1;
        if (p.quantidade) {
          chapaData[`parga${idx}_nome`] = `Parga ${idx}`;
          chapaData[`parga${idx}_quantidade`] = p.quantidade;
          chapaData[`parga${idx}_comprimento`] = p.comprimento;
          chapaData[`parga${idx}_altura`] = p.altura;
          chapaData[`parga${idx}_espessura`] = p.espessura;
          chapaData[`parga${idx}_foto_primeira`] = p.foto_primeira;
          chapaData[`parga${idx}_foto_ultima`] = p.foto_ultima;
        }
      }

      // Calculate total chapas for num_chapas
      const totalChapas = pargas.reduce((sum, p) => sum + (p.quantidade || 0), 0);
      chapaData.num_chapas = totalChapas;

      const { error: chapaError } = await supabase
        .from('chapas')
        .insert(chapaData);
      if (chapaError) throw chapaError;

      // 2. Update bloco based on tipo de corte
      if (tipoCorte === 'total') {
        // Corte total: bloco sai do stock
        const { error: blocoError } = await supabase
          .from('blocos')
          .update({ ativo: false })
          .eq('id', bloco.id);
        if (blocoError) throw blocoError;
      } else {
        // Corte parcial: medição pendente
        const { error: blocoError } = await supabase
          .from('blocos')
          .update({
            corte_parcial: true,
            medicao_pendente: true,
            comprimento: null,
            largura: null,
            altura: null,
            quantidade_tons: 0,
          })
          .eq('id', bloco.id);
        if (blocoError) throw blocoError;
      }

      return { chapaIdMm, tipoCorte };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['blocos'] });
      queryClient.invalidateQueries({ queryKey: ['chapas'] });
      queryClient.invalidateQueries({ queryKey: ['stock-unificado'] });
      toast.success(
        `Produção guardada! Chapa ${result.chapaIdMm} criada. ${
          result.tipoCorte === 'total' ? 'Bloco removido do stock.' : 'Bloco marcado para medição.'
        }`
      );
      // Reset form
      setBloco(null);
      setIdMm('');
      setTipoCorte('');
      setPargas([emptyParga(), emptyParga(), emptyParga(), emptyParga()]);
    },
    onError: (err: Error) => {
      toast.error('Erro ao guardar produção: ' + err.message);
    },
  });

  const hasAnyParga = pargas.some(p => p.quantidade && p.quantidade > 0);
  const canSave = bloco && tipoCorte && hasAnyParga && !saveMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scissors className="h-6 w-6" />
          Nova Produção
        </h1>
        <p className="text-muted-foreground">Produzir chapas a partir de um bloco</p>
      </div>

      {/* Search Bloco */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bloco de Origem</CardTitle>
          <CardDescription>Introduza o ID MM do bloco para pré-preencher os dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: IDMM0001"
              value={idMm}
              onChange={e => setIdMm(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && searchBloco()}
              className="max-w-xs"
            />
            <Button onClick={searchBloco} disabled={isSearching || !idMm.trim()}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">Pesquisar</span>
            </Button>
          </div>

          {notFound && (
            <p className="text-sm text-destructive mt-2">Bloco não encontrado com o ID "{idMm}"</p>
          )}

          {bloco && (
            <div className="mt-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-sm">{bloco.id_mm}</Badge>
                <Badge>{bloco.parque}</Badge>
                {bloco.variedade && <span className="text-sm text-muted-foreground">{bloco.variedade}</span>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Comprimento</span>
                  <p className="font-medium">{bloco.comprimento ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Largura</span>
                  <p className="font-medium">{bloco.largura ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Altura</span>
                  <p className="font-medium">{bloco.altura ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Peso (ton)</span>
                  <p className="font-medium">{bloco.quantidade_tons ?? '—'}</p>
                </div>
              </div>
              {(bloco.foto1_url || bloco.foto2_url) && (
                <div className="flex gap-2 mt-3">
                  {bloco.foto1_url && <img src={bloco.foto1_url} alt="Foto 1" className="h-20 w-20 object-cover rounded border" />}
                  {bloco.foto2_url && <img src={bloco.foto2_url} alt="Foto 2" className="h-20 w-20 object-cover rounded border" />}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {bloco && (
        <>
          {/* Additional fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados da Produção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Data</Label>
                  <Input type="date" value={data} onChange={e => setData(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Nº de Linha</Label>
                  <Select value={linha} onValueChange={setLinha}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar linha" />
                    </SelectTrigger>
                    <SelectContent>
                      {LINHAS_OPTIONS.map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Localização GPS</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Lat" value={latitude} onChange={e => setLatitude(e.target.value)} className="flex-1" />
                    <Input placeholder="Lng" value={longitude} onChange={e => setLongitude(e.target.value)} className="flex-1" />
                    <Button variant="outline" size="icon" onClick={getLocation} title="Obter localização">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pargas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pargas (Secções de Corte)</CardTitle>
              <CardDescription>Configure até 4 pargas com as chapas resultantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {pargas.map((parga, idx) => (
                <div key={idx}>
                  {idx > 0 && <Separator className="mb-4" />}
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="secondary">Parga {idx + 1}</Badge>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Qtd. Chapas</Label>
                      <Input
                        type="number"
                        min={0}
                        value={parga.quantidade ?? ''}
                        onChange={e => updateParga(idx, 'quantidade', e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Comprimento</Label>
                      <Input
                        type="number"
                        min={0}
                        value={parga.comprimento ?? ''}
                        onChange={e => updateParga(idx, 'comprimento', e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Altura</Label>
                      <Input
                        type="number"
                        min={0}
                        value={parga.altura ?? ''}
                        onChange={e => updateParga(idx, 'altura', e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Espessura</Label>
                      <Input
                        type="number"
                        min={0}
                        value={parga.espessura ?? ''}
                        onChange={e => updateParga(idx, 'espessura', e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Foto Primeira</Label>
                      {parga.foto_primeira ? (
                        <div className="relative">
                          <img src={parga.foto_primeira} alt="Primeira" className="h-24 w-full object-cover rounded border" />
                          <button onClick={() => updateParga(idx, 'foto_primeira', null)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 text-xs">✕</button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center h-24 border-2 border-dashed rounded cursor-pointer hover:border-primary text-muted-foreground text-xs">
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Carregar foto'}
                          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(idx, 'foto_primeira', f); e.target.value = ''; }} />
                        </label>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Foto Última</Label>
                      {parga.foto_ultima ? (
                        <div className="relative">
                          <img src={parga.foto_ultima} alt="Última" className="h-24 w-full object-cover rounded border" />
                          <button onClick={() => updateParga(idx, 'foto_ultima', null)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 text-xs">✕</button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center h-24 border-2 border-dashed rounded cursor-pointer hover:border-primary text-muted-foreground text-xs">
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Carregar foto'}
                          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(idx, 'foto_ultima', f); e.target.value = ''; }} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tipo de Corte */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipo de Corte</CardTitle>
              <CardDescription>Selecione se o bloco foi totalmente ou parcialmente cortado</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={tipoCorte} onValueChange={v => setTipoCorte(v as 'total' | 'parcial')}>
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="total" id="corte-total" className="mt-1" />
                  <div>
                    <Label htmlFor="corte-total" className="font-medium cursor-pointer">Corte Total</Label>
                    <p className="text-sm text-muted-foreground">O bloco é totalmente consumido e sai do stock.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="parcial" id="corte-parcial" className="mt-1" />
                  <div>
                    <Label htmlFor="corte-parcial" className="font-medium cursor-pointer">Corte Parcial</Label>
                    <p className="text-sm text-muted-foreground">O bloco permanece no stock mas as medidas ficam pendentes de atualização.</p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex justify-end">
            <Button size="lg" onClick={() => saveMutation.mutate()} disabled={!canSave}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar Produção
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
