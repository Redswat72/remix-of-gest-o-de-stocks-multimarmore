import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ZoomIn } from 'lucide-react';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import { usePermissoes } from '@/hooks/usePermissoes';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { FotoLightbox } from '@/components/produtos/FotoLightbox';
import InventarioEditModal from '@/components/inventario/InventarioEditModal';
import { toast } from 'sonner';
import type { Bloco, Chapa, Ladrilho, Banda } from '@/types/inventario';

type FormaType = 'bloco' | 'chapa' | 'ladrilho' | 'banda';

const FORMA_LABELS: Record<string, string> = {
  bloco: 'Bloco',
  chapa: 'Chapa',
  ladrilho: 'Ladrilho',
  banda: 'Banda',
};

const FORMA_COLORS: Record<string, string> = {
  bloco: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  chapa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ladrilho: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  banda: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const formatCurrency = (value: number | null) => {
  if (!value) return '—';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatNumber = (value: number | null, decimals = 2) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
};

interface InventarioDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forma: FormaType;
  itemId: string;
}

export default function InventarioDetailModal({ open, onOpenChange, forma, itemId }: InventarioDetailModalProps) {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();
  const { podeVerValores } = usePermissoes();
  const { isSuperadmin, isAdmin } = useAuth();
  const canEdit = isSuperadmin || isAdmin;
  const queryClient = useQueryClient();

  const tableName = forma === 'bloco' ? 'blocos' : forma === 'chapa' ? 'chapas' : forma === 'banda' ? 'produtos' : 'ladrilho';

  const { data, isLoading } = useQuery({
    queryKey: ['inventario-detail-modal', forma, itemId, empresa],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', itemId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!itemId,
  });

  const [observacoes, setObservacoes] = useState<string>('');
  const [obsLoaded, setObsLoaded] = useState(false);

  // Sync observacoes when data loads
  if (data && !obsLoaded) {
    const obs = forma === 'ladrilho' ? (data as Ladrilho).nota : (data as any).observacoes ?? '';
    setObservacoes(obs || '');
    setObsLoaded(true);
  }

  // Reset on close
  const handleOpenChange = (v: boolean) => {
    if (!v) setObsLoaded(false);
    onOpenChange(v);
  };

  const obsField = forma === 'ladrilho' ? 'nota' : 'observacoes';
  const updateTable = forma === 'bloco' && empresa === 'magratex' ? 'inventario' : tableName;

  const obsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from(updateTable)
        .update({ [obsField]: observacoes || null })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Observações guardadas com sucesso');
      queryClient.invalidateQueries({ queryKey: ['inventario-detail-modal', forma, itemId] });
    },
    onError: (err: Error) => {
      toast.error('Erro ao guardar observações: ' + err.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className={FORMA_COLORS[forma]}>{FORMA_LABELS[forma]}</Badge>
            <span>
              {data ? (forma === 'bloco' ? (data as Bloco).id_mm : forma === 'chapa' ? (data as Chapa).id_mm : forma === 'banda' ? (data as any).idmm : (data as Ladrilho).variedade || 'Ladrilho') : 'A carregar...'}
            </span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Details */}
              <div className="space-y-3">
                {forma === 'bloco' && <BlocoFields data={data as Bloco} podeVerValores={podeVerValores} />}
                {forma === 'chapa' && <ChapaFields data={data as Chapa} podeVerValores={podeVerValores} />}
                {forma === 'ladrilho' && <LadrilhoFields data={data as Ladrilho} podeVerValores={podeVerValores} />}
                {forma === 'banda' && <BandaFields data={data as Banda} podeVerValores={podeVerValores} />}
              </div>

              {/* Photos */}
              <div className="space-y-3">
                <PhotoSection forma={forma} data={data} />
              </div>
            </div>

            {/* Observações - not for bandas since produtos table uses observacoes field already */}
            {forma !== 'banda' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label htmlFor="obs-textarea" className="text-base font-semibold">Observações</Label>
                  <Textarea
                    id="obs-textarea"
                    rows={4}
                    placeholder="Sem observações..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                  <Button
                    onClick={() => obsMutation.mutate()}
                    disabled={obsMutation.isPending}
                    size="sm"
                  >
                    {obsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Guardar Observações
                  </Button>
                </div>
              </>
            )}

            {/* Edit button + Close */}
            <div className="flex justify-between pt-2">
              {canEdit && forma !== 'banda' && (
                <InventarioEditModal
                  forma={forma as 'bloco' | 'chapa' | 'ladrilho'}
                  data={data as Bloco | Chapa | Ladrilho}
                  itemId={itemId}
                />
              )}
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="ml-auto">
                Fechar
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="font-medium">{value ?? '—'}</p>
    </div>
  );
}

function BlocoFields({ data, podeVerValores }: { data: Bloco; podeVerValores: boolean }) {
  return (
    <>
      <DetailRow label="ID MM" value={data.id_mm} />
      <DetailRow label="Parque" value={data.parque} />
      <DetailRow label="Variedade" value={data.variedade} />
      <DetailRow label="Origem" value={data.bloco_origem} />
      <DetailRow label="Fornecedor" value={data.fornecedor} />
      <Separator />
      <DetailRow label="Toneladas" value={formatNumber(data.quantidade_tons)} />
      {data.comprimento && <DetailRow label="Comprimento" value={`${data.comprimento}`} />}
      {data.largura && <DetailRow label="Largura" value={`${data.largura}`} />}
      {data.altura && <DetailRow label="Altura" value={`${data.altura}`} />}
      {podeVerValores && <DetailRow label="Preço/ton" value={formatCurrency(data.preco_unitario)} />}
      {podeVerValores && <DetailRow label="Valor de Inventário" value={formatCurrency(data.valor_inventario)} />}
    </>
  );
}

function ChapaFields({ data, podeVerValores }: { data: Chapa; podeVerValores: boolean }) {
  return (
    <>
      <DetailRow label="ID MM" value={data.id_mm} />
      <DetailRow label="Bundle/Parga" value={data.bundle_id} />
      <DetailRow label="Parque" value={data.parque} />
      <DetailRow label="Variedade" value={data.variedade} />
      <DetailRow label="Acabamento" value={data.acabamento} />
      <Separator />
      <DetailRow label="Nº Chapas" value={data.num_chapas} />
      <DetailRow label="Área (m²)" value={formatNumber(data.quantidade_m2)} />
      {podeVerValores && <DetailRow label="Preço/m²" value={formatCurrency(data.preco_unitario)} />}
      {podeVerValores && <DetailRow label="Valor de Inventário" value={formatCurrency(data.valor_inventario)} />}
      {/* Pargas */}
      {[1, 2, 3, 4].map(i => {
        const nome = data[`parga${i}_nome` as keyof Chapa] as string | null;
        const qtd = data[`parga${i}_quantidade` as keyof Chapa] as number | null;
        if (!nome && !qtd) return null;
        return (
          <div key={i}>
            <Separator className="my-2" />
            <DetailRow label={`Parga ${i}`} value={nome} />
            <DetailRow label={`Qtd Parga ${i}`} value={qtd} />
          </div>
        );
      })}
    </>
  );
}

function LadrilhoFields({ data, podeVerValores }: { data: Ladrilho; podeVerValores: boolean }) {
  return (
    <>
      <DetailRow label="ID MM" value={data.id_mm} />
      <DetailRow label="Tipo" value={data.tipo} />
      <DetailRow label="Variedade" value={data.variedade} />
      <DetailRow label="Acabamento" value={data.acabamento} />
      <DetailRow label="Dimensões" value={data.dimensoes} />
      <DetailRow label="Butch No" value={data.butch_no} />
      <Separator />
      <DetailRow label="Peças" value={data.num_pecas} />
      <DetailRow label="Área (m²)" value={formatNumber(data.quantidade_m2)} />
      <DetailRow label="Peso (kg)" value={formatNumber(data.peso, 0)} />
      {podeVerValores && <DetailRow label="Preço/m²" value={formatCurrency(data.preco_unitario)} />}
      {podeVerValores && <DetailRow label="Valor de Inventário" value={formatCurrency(data.valor_inventario)} />}
    </>
  );
}

function BandaFields({ data, podeVerValores }: { data: Banda; podeVerValores: boolean }) {
  return (
    <>
      <DetailRow label="ID" value={data.idmm} />
      <DetailRow label="Parque" value={data.parque} />
      <DetailRow label="Variedade" value={data.variedade} />
      <Separator />
      {data.largura && <DetailRow label="Largura" value={`${data.largura} cm`} />}
      {data.altura && <DetailRow label="Altura" value={`${data.altura} cm`} />}
      <DetailRow label="Área (m²)" value={formatNumber(data.quantidade_m2)} />
      {podeVerValores && <DetailRow label="Preço/m²" value={formatCurrency(data.preco_unitario)} />}
      {podeVerValores && <DetailRow label="Valor de Inventário" value={formatCurrency(data.valor_inventario)} />}
    </>
  );
}

function PhotoSection({ forma, data }: { forma: string; data: unknown }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const photos: { label: string; url: string }[] = [];

  if (forma === 'bloco') {
    const d = data as Bloco;
    if (d.foto1_url) photos.push({ label: 'Foto 1', url: d.foto1_url });
    if (d.foto2_url) photos.push({ label: 'Foto 2', url: d.foto2_url });
    if ((d as any).foto3_url) photos.push({ label: 'Foto 3', url: (d as any).foto3_url });
    if ((d as any).foto4_url) photos.push({ label: 'Foto 4', url: (d as any).foto4_url });
  } else if (forma === 'chapa') {
    const d = data as Chapa;
    for (let i = 1; i <= 4; i++) {
      const primeira = d[`parga${i}_foto_primeira` as keyof Chapa] as string | null;
      const ultima = d[`parga${i}_foto_ultima` as keyof Chapa] as string | null;
      if (primeira) photos.push({ label: `Parga ${i} - Primeira`, url: primeira });
      if (ultima) photos.push({ label: `Parga ${i} - Última`, url: ultima });
    }
  } else if (forma === 'ladrilho') {
    const d = data as Ladrilho;
    if (d.foto_amostra_url) photos.push({ label: 'Foto Amostra', url: d.foto_amostra_url });
  }

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem fotografias</p>;
  }

  const fotosList = photos.map(p => ({ url: p.url, label: p.label, isHd: false }));

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {photos.map((p, i) => (
          <div
            key={i}
            className="relative space-y-1 cursor-pointer group"
            onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
          >
            <span className="text-xs text-muted-foreground">{p.label}</span>
            <div className="relative overflow-hidden rounded-md border">
              <img src={p.url} alt={p.label} className="w-full h-24 object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <FotoLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        fotos={fotosList}
        initialIndex={lightboxIndex}
        idmm={forma === 'bloco' ? (data as Bloco).id_mm : forma === 'chapa' ? (data as Chapa).id_mm : 'item'}
        tipoPedra={FORMA_LABELS[forma] || forma}
      />
    </>
  );
}
