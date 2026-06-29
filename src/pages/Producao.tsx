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
import { Loader2, Search, MapPin, Scissors, Camera, Upload } from 'lucide-react';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAuth } from '@/hooks/useAuth';
import { useAppT } from '@/hooks/useAppT';
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
  const { user } = useAuth();
  const t = useAppT();

  const [idMm, setIdMm] = useState(searchParams.get('id_mm') || searchParams.get('bloco') || '');
  const [bloco, setBloco] = useState<Bloco | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [linha, setLinha] = useState(searchParams.get('linha') || '');
  const [tipoCorte, setTipoCorte] = useState<'total' | 'parcial' | ''>('');
  const [pargas, setPargas] = useState<PargaData[]>([emptyParga(), emptyParga(), emptyParga(), emptyParga()]);

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
      toast.error(t('production.erroPesquisar'));
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('bloco') || searchParams.get('id_mm')) {
      searchBloco();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t('production.gpsNaoSuportado'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        toast.success(t('production.gpsObtido'));
      },
      () => toast.error(t('production.gpsErro'))
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
      toast.success(t('production.fotoCarregada'));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!bloco) throw new Error(t('production.blocoNaoSelecionado'));
      if (!tipoCorte) throw new Error(t('production.selecioneTipoCorte'));

      // BUG 2 fix: id_mm da chapa = id_mm do bloco (sem prefixos nem timestamps)
      const chapaIdMm = bloco.id_mm;

      // Verifica se já existe chapa com este id_mm (evita duplicados)
      const { data: existingChapa, error: existsErr } = await supabase
        .from('chapas')
        .select('id')
        .eq('id_mm', chapaIdMm)
        .maybeSingle();
      if (existsErr) throw existsErr;
      if (existingChapa) {
        throw new Error(`Já existe uma chapa com id_mm "${chapaIdMm}". Não foi criado registo duplicado.`);
      }

      // Normaliza pargas (espessura default = 2 cm)
      const pargasNorm = pargas.map(p => ({
        ...p,
        espessura: p.espessura ?? 2,
      }));

      // Calcula área total (m²) = Σ (qtd × C × A) / 10000
      const areaTotal = pargasNorm.reduce((sum, p) => {
        if (!p.quantidade || !p.comprimento || !p.altura) return sum;
        return sum + (p.quantidade * p.comprimento * p.altura) / 10000;
      }, 0);
      const areaRounded = Math.round(areaTotal * 100) / 100;

      // Preço unitário herdado do bloco; valor_inventario = área × preço
      const precoUnit = bloco.preco_unitario ?? null;
      const valorInv = precoUnit != null ? Math.round(areaRounded * precoUnit * 100) / 100 : null;
      const totalChapas = pargasNorm.reduce((sum, p) => sum + (p.quantidade || 0), 0);

      const chapaData: Record<string, unknown> = {
        id_mm: chapaIdMm,
        parque: bloco.parque,
        variedade: bloco.variedade,
        entrada_stock: data,
        linha: linha || null,
        quantidade_m2: areaRounded,
        num_chapas: totalChapas,
        preco_unitario: precoUnit,
        valor_inventario: valorInv,
        observacoes: `Produção a partir do bloco ${bloco.id_mm}`,
      };

      for (let i = 0; i < 4; i++) {
        const p = pargasNorm[i];
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

      // 1) Inserir chapa
      const { data: chapaInserted, error: chapaError } = await supabase
        .from('chapas')
        .insert(chapaData)
        .select('id')
        .single();
      if (chapaError) throw chapaError;
      const chapaId = (chapaInserted as { id: string }).id;

      // 2) Atualizar bloco (consumir / corte parcial). Se falhar → rollback chapa.
      const blocoUpdate = tipoCorte === 'total'
        ? { ativo: false, valor_inventario: 0, quantidade_kg: 0 }
        : { corte_parcial: true, medicao_pendente: true, comprimento: null, largura: null, altura: null, quantidade_kg: null };

      const { error: blocoError } = await supabase
        .from('blocos')
        .update(blocoUpdate)
        .eq('id', bloco.id);
      if (blocoError) {
        await supabase.from('chapas').delete().eq('id', chapaId);
        throw blocoError;
      }

      // 3) Registar movimento de produção. Se falhar → rollback chapa + bloco.
      const { error: movError } = await supabase.from('movimentos').insert({
        tipo: 'producao',
        id_mm: chapaIdMm,
        tipo_produto: 'chapa',
        quantidade: totalChapas,
        data_movimento: data,
        operador_id: user?.id ?? null,
        observacoes: `Produção do bloco ${bloco.id_mm} (corte ${tipoCorte}) → ${totalChapas} chapas / ${areaRounded} m²`,
      } as Record<string, unknown>);
      if (movError) {
        // Best-effort rollback
        await supabase.from('chapas').delete().eq('id', chapaId);
        if (tipoCorte === 'total') {
          await supabase.from('blocos').update({ ativo: true, valor_inventario: bloco.valor_inventario, quantidade_kg: bloco.quantidade_kg }).eq('id', bloco.id);
        }
        throw movError;
      }

      return { chapaIdMm, tipoCorte };
    },
    onSuccess: (result) => {
      // Invalidar TODAS as queries que listam inventário (chaves corretas do useStockUnificado)
      queryClient.invalidateQueries({ queryKey: ['blocos-unificado'] });
      queryClient.invalidateQueries({ queryKey: ['chapas-unificado'] });
      queryClient.invalidateQueries({ queryKey: ['ladrilho-unificado'] });
      queryClient.invalidateQueries({ queryKey: ['stock-unificado'] });
      queryClient.invalidateQueries({ queryKey: ['blocos'] });
      queryClient.invalidateQueries({ queryKey: ['chapas'] });
      queryClient.invalidateQueries({ queryKey: ['movimentos'] });
      toast.success(
        result.tipoCorte === 'total'
          ? t('production.guardadoTotal', { id: result.chapaIdMm })
          : t('production.guardadoParcial', { id: result.chapaIdMm })
      );
      setBloco(null);
      setIdMm('');
      setTipoCorte('');
      setPargas([emptyParga(), emptyParga(), emptyParga(), emptyParga()]);
    },
    onError: (err: Error) => {
      toast.error(t('production.erroGuardar', { msg: err.message }));
    },
  });

  const hasAnyParga = pargas.some(p => p.quantidade && p.quantidade > 0);
  const canSave = bloco && tipoCorte && hasAnyParga && !saveMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scissors className="h-6 w-6" />
          {t('production.pageTitle')}
        </h1>
        <p className="text-muted-foreground">{t('production.pageSubtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('production.blocoOrigem.title')}</CardTitle>
          <CardDescription>{t('production.blocoOrigem.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder={t('production.blocoOrigem.placeholder')}
              value={idMm}
              onChange={e => setIdMm(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && searchBloco()}
              className="max-w-xs"
            />
            <Button onClick={searchBloco} disabled={isSearching || !idMm.trim()}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">{t('production.pesquisar')}</span>
            </Button>
          </div>

          {notFound && (
            <p className="text-sm text-destructive mt-2">{t('production.notFound', { id: idMm })}</p>
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
                  <span className="text-muted-foreground">{t('production.comprimento')}</span>
                  <p className="font-medium">{bloco.comprimento ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('production.largura')}</span>
                  <p className="font-medium">{bloco.largura ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('production.altura')}</span>
                  <p className="font-medium">{bloco.altura ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('production.pesoKg')}</span>
                  <p className="font-medium">{bloco.quantidade_kg != null ? `${bloco.quantidade_kg} kg` : '—'}</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('production.dadosProducao')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>{t('production.data')}</Label>
                  <Input type="date" value={data} onChange={e => setData(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t('production.numLinha')}</Label>
                  <Select value={linha} onValueChange={setLinha}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('production.linhaPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {LINHAS_OPTIONS.map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{t('production.gps')}</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Lat" value={latitude} onChange={e => setLatitude(e.target.value)} className="flex-1" />
                    <Input placeholder="Lng" value={longitude} onChange={e => setLongitude(e.target.value)} className="flex-1" />
                    <Button variant="outline" size="icon" onClick={getLocation} title={t('production.gpsTitle')}>
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('production.pargas.title')}</CardTitle>
              <CardDescription>{t('production.pargas.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {pargas.map((parga, idx) => (
                <div key={idx}>
                  {idx > 0 && <Separator className="mb-4" />}
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="secondary">{t('production.parga', { n: idx + 1 })}</Badge>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('production.qtdChapas')}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={parga.quantidade ?? ''}
                        onChange={e => updateParga(idx, 'quantidade', e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('production.comprimento')}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={parga.comprimento ?? ''}
                        onChange={e => updateParga(idx, 'comprimento', e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('production.altura')}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={parga.altura ?? ''}
                        onChange={e => updateParga(idx, 'altura', e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('production.espessura')}</Label>
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
                      <Label className="text-xs">{t('production.fotoPrimeira')}</Label>
                      {parga.foto_primeira ? (
                        <div className="relative">
                          <img src={parga.foto_primeira} alt="Primeira" className="h-24 w-full object-cover rounded border" />
                          <button onClick={() => updateParga(idx, 'foto_primeira', null)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 text-xs">✕</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1 h-24">
                          <label className="flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer hover:border-primary text-muted-foreground text-xs gap-1">
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Camera className="h-4 w-4" /><span>{t('production.camera')}</span></>}
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(idx, 'foto_primeira', f); e.target.value = ''; }} />
                          </label>
                          <label className="flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer hover:border-primary text-muted-foreground text-xs gap-1">
                            <Upload className="h-4 w-4" /><span>{t('production.galeria')}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(idx, 'foto_primeira', f); e.target.value = ''; }} />
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('production.fotoUltima')}</Label>
                      {parga.foto_ultima ? (
                        <div className="relative">
                          <img src={parga.foto_ultima} alt="Última" className="h-24 w-full object-cover rounded border" />
                          <button onClick={() => updateParga(idx, 'foto_ultima', null)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 text-xs">✕</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1 h-24">
                          <label className="flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer hover:border-primary text-muted-foreground text-xs gap-1">
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Camera className="h-4 w-4" /><span>{t('production.camera')}</span></>}
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(idx, 'foto_ultima', f); e.target.value = ''; }} />
                          </label>
                          <label className="flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer hover:border-primary text-muted-foreground text-xs gap-1">
                            <Upload className="h-4 w-4" /><span>{t('production.galeria')}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(idx, 'foto_ultima', f); e.target.value = ''; }} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('production.tipoCorte.title')}</CardTitle>
              <CardDescription>{t('production.tipoCorte.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={tipoCorte} onValueChange={v => setTipoCorte(v as 'total' | 'parcial')}>
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="total" id="corte-total" className="mt-1" />
                  <div>
                    <Label htmlFor="corte-total" className="font-medium cursor-pointer">{t('production.corteTotal.label')}</Label>
                    <p className="text-sm text-muted-foreground">{t('production.corteTotal.desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="parcial" id="corte-parcial" className="mt-1" />
                  <div>
                    <Label htmlFor="corte-parcial" className="font-medium cursor-pointer">{t('production.corteParcial.label')}</Label>
                    <p className="text-sm text-muted-foreground">{t('production.corteParcial.desc')}</p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={() => saveMutation.mutate()} disabled={!canSave}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('production.guardarProducao')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
