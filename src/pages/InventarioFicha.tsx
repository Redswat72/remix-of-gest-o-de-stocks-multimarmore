import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, QrCode, ZoomIn } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import { useAuth } from '@/hooks/useAuth';
import { usePermissoes } from '@/hooks/usePermissoes';
import { useAppT } from '@/hooks/useAppT';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FotoLightbox } from '@/components/produtos/FotoLightbox';
import InventarioEditModal from '@/components/inventario/InventarioEditModal';
import { toast } from 'sonner';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { Bloco, Chapa, Ladrilho } from '@/types/inventario';
import type { FormaInventario } from '@/hooks/useStockUnificado';

const FORMA_COLORS: Record<string, string> = {
  bloco: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  chapa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ladrilho: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

export default function InventarioFicha() {
  const t = useAppT();
  const params = useParams<{ forma: string; id?: string; idMm?: string }>();
  const { forma } = params;
  const lookupByIdMm = !!params.idMm;
  const navigate = useNavigate();
  const supabase = useSupabaseEmpresa();
  const { empresaConfig, empresa } = useEmpresa();
  const { isSuperadmin, isAdmin, hasRole } = useAuth();
  const isOperador = hasRole('operador');
  const canEdit = isSuperadmin || isAdmin || (isOperador && forma === 'bloco');
  const queryClient = useQueryClient();

  const tableName = forma === 'bloco' ? 'blocos' : forma === 'chapa' ? 'chapas' : 'ladrilho';

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventario-ficha', forma, params.id ?? `idmm:${params.idMm}`, empresa],
    queryFn: async () => {
      if (lookupByIdMm) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id_mm', params.idMm!)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Registo não encontrado');
        return data;
      }
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', params.id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!forma && (!!params.id || !!params.idMm),
  });

  const id = (data as { id?: string } | undefined)?.id ?? params.id;
  const isInactive = (data as { ativo?: boolean | null } | undefined)?.ativo === false;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('inventory.detail.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <div>
              <h1 className="text-xl font-bold mb-2">{t('inventory.detail.notFound')}</h1>
              <p className="text-muted-foreground">
                {(error as Error)?.message || t('inventory.detail.notFoundDesc')}
              </p>
            </div>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('actions.back')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formaLabel = forma ? t(`enums.tipoProduto.${forma}`) : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">
                {forma === 'bloco' ? (data as Bloco).id_mm
                  : forma === 'chapa' ? (data as Chapa).id_mm
                  : (data as Ladrilho).variedade || formaLabel}
              </h1>
              <Badge className={FORMA_COLORS[forma || '']}>
                {formaLabel}
              </Badge>
              {isInactive && (
                <Badge variant="destructive">Fora de stock (histórico)</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{empresaConfig?.nome}</p>
          </div>
        </div>
        {canEdit && data && forma && !isInactive && (
          <InventarioEditModal
            forma={forma as 'bloco' | 'chapa' | 'ladrilho'}
            data={data as Bloco | Chapa | Ladrilho}
            itemId={id!}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados Principais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('inventory.detail.itemData')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {forma === 'bloco' && <BlocoDetails data={data as Bloco} />}
            {forma === 'chapa' && <ChapaDetails data={data as Chapa} />}
            {forma === 'ladrilho' && <LadrilhoDetails data={data as Ladrilho} />}
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {t('inventory.detail.idAndPhotos')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">{t('inventory.detail.form')}</span>
              <p className="font-medium">{formaLabel}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{forma === 'bloco' ? 'ID MM' : t('inventory.detail.idInternal')}</span>
              <p className="font-mono text-sm">{forma === 'bloco' ? (data as Bloco).id_mm : id}</p>
            </div>

            {/* Display photos */}
            <PhotoGallery forma={forma as string} data={data} />
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      <ObservacoesSection forma={forma!} itemId={id!} data={data} empresa={empresa} supabase={supabase} queryClient={queryClient} />
    </div>
  );
}

function ObservacoesSection({ forma, itemId, data, empresa, supabase, queryClient }: {
  forma: string; itemId: string; data: any; empresa: string | null; supabase: any; queryClient: any;
}) {
  const t = useAppT();
  const obsField = forma === 'ladrilho' ? 'nota' : 'observacoes';
  const initialObs = data?.[obsField] || '';
  const [observacoes, setObservacoes] = useState<string>(initialObs);

  const tableName = forma === 'bloco' ? 'blocos' : forma === 'chapa' ? 'chapas' : 'ladrilho';
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
      toast.success(t('inventory.detail.obsSavedOk'));
      queryClient.invalidateQueries({ queryKey: ['inventario-ficha', forma, itemId] });
    },
    onError: (err: Error) => {
      toast.error(t('inventory.detail.obsErrorPrefix') + err.message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('inventory.detail.observations')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={4}
          placeholder={t('inventory.detail.noObservations')}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
        <Button
          onClick={() => obsMutation.mutate()}
          disabled={obsMutation.isPending}
          size="sm"
        >
          {obsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {t('inventory.detail.saveObs')}
        </Button>
      </CardContent>
    </Card>
  );
}

function PhotoGallery({ forma, data }: { forma: string; data: unknown }) {
  const t = useAppT();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const photos: { label: string; url: string }[] = [];
  let idLabel = '';

  if (forma === 'bloco') {
    const d = data as Bloco;
    idLabel = d.id_mm;
    if (d.foto1_url) photos.push({ label: t('movements.fotoN', { n: 1 }), url: d.foto1_url });
    if (d.foto2_url) photos.push({ label: t('movements.fotoN', { n: 2 }), url: d.foto2_url });
  } else if (forma === 'chapa') {
    const d = data as Chapa;
    idLabel = d.id_mm;
    for (let i = 1; i <= 4; i++) {
      const primeira = d[`parga${i}_foto_primeira` as keyof Chapa] as string | null;
      const ultima = d[`parga${i}_foto_ultima` as keyof Chapa] as string | null;
      if (primeira) photos.push({ label: t('inventory.detail.pargaFirst', { n: i }), url: primeira });
      if (ultima) photos.push({ label: t('inventory.detail.pargaLast', { n: i }), url: ultima });
    }
  } else if (forma === 'ladrilho') {
    const d = data as Ladrilho;
    idLabel = d.variedade || t('enums.tipoProduto.ladrilho');
    if (d.foto_amostra_url) photos.push({ label: t('inventory.detail.photoSample'), url: d.foto_amostra_url });
  }

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('inventory.detail.noPhotos')}</p>;
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
        idmm={idLabel}
        tipoPedra={t(`enums.tipoProduto.${forma}`)}
      />
    </>
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

function anoEntrada(entrada_stock: string | null | undefined): string | null {
  if (!entrada_stock) return null;
  const y = String(entrada_stock).slice(0, 4);
  return /^\d{4}$/.test(y) ? y : null;
}


function BlocoDetails({ data }: { data: Bloco }) {
  const t = useAppT();
  const { podeVerValores } = usePermissoes();
  return (
    <>
      <DetailRow label="ID MM" value={data.id_mm} />
      <DetailRow label={t('inventory.detail.yard')} value={data.parque} />
      <DetailRow label={t('inventory.detail.variety')} value={data.variedade} />
      <DetailRow label={t('inventory.detail.origin')} value={data.bloco_origem} />
      <DetailRow label={t('inventory.detail.supplier')} value={data.fornecedor} />
      <Separator />
      <DetailRow label={t('inventory.detail.weight')} value={data.quantidade_kg != null ? `${formatNumber(data.quantidade_kg)} kg` : null} />
      {podeVerValores && <DetailRow label={t('inventory.detail.pricePerKg')} value={formatCurrency(data.preco_unitario) || '—'} />}
      {podeVerValores && <DetailRow label={t('inventory.detail.inventoryValue')} value={formatCurrency(data.valor_inventario) || '—'} />}
      {(data.comprimento || data.largura || data.altura) && (
        <>
          <Separator />
          <div className="grid grid-cols-3 gap-4">
            <DetailRow label={t('inventory.detail.length')} value={data.comprimento ? `${data.comprimento}` : null} />
            <DetailRow label={t('inventory.detail.width')} value={data.largura ? `${data.largura}` : null} />
            <DetailRow label={t('inventory.detail.height')} value={data.altura ? `${data.altura}` : null} />
          </div>
        </>
      )}
    </>
  );
}

function formatPargaDim(data: Chapa) {
  const pargas: { idx: number; comprimento: number | null; altura: number | null; espessura: number | null; quantidade: number | null }[] = [
    { idx: 1, comprimento: data.parga1_comprimento, altura: data.parga1_altura, espessura: data.parga1_espessura, quantidade: data.parga1_quantidade },
    { idx: 2, comprimento: data.parga2_comprimento, altura: data.parga2_altura, espessura: data.parga2_espessura, quantidade: data.parga2_quantidade },
    { idx: 3, comprimento: data.parga3_comprimento, altura: data.parga3_altura, espessura: data.parga3_espessura, quantidade: data.parga3_quantidade },
    { idx: 4, comprimento: data.parga4_comprimento, altura: data.parga4_altura, espessura: data.parga4_espessura, quantidade: data.parga4_quantidade },
  ];

  const validas = pargas.filter(p => p.comprimento != null && p.altura != null);
  if (validas.length === 0) return null;

  const formatOne = (p: typeof validas[0]) => {
    const dim = p.espessura != null
      ? `${p.comprimento} × ${p.altura} × ${p.espessura} cm`
      : `${p.comprimento} × ${p.altura} cm`;
    const qty = p.quantidade != null ? ` (${p.quantidade} chapas)` : '';
    return `${dim}${qty}`;
  };

  if (validas.length === 1) {
    return `Dimensões: ${formatOne(validas[0])}`;
  }

  return validas.map(p => `Parga ${p.idx}: ${formatOne(p)}`).join(' / ');
}

function ChapaDetails({ data }: { data: Chapa }) {
  const t = useAppT();
  const { podeVerValores } = usePermissoes();
  const dimensoesPargas = formatPargaDim(data);
  return (
    <>
      <DetailRow label="ID MM" value={data.id_mm} />
      <DetailRow label={t('inventory.detail.bundleParga')} value={data.bundle_id} />
      <DetailRow label={t('inventory.detail.yard')} value={data.parque} />
      <DetailRow label={t('inventory.detail.variety')} value={data.variedade} />
      <DetailRow label={t('inventory.detail.finish')} value={data.acabamento} />
      <DetailRow label={t('inventory.detail.supplier')} value={data.fornecedor} />
      <Separator />
      <DetailRow label={t('inventory.detail.numSlabs')} value={data.num_chapas} />
      <DetailRow label={t('inventory.detail.area')} value={formatNumber(data.quantidade_m2) || '—'} />
      {dimensoesPargas && <DetailRow label={t('inventory.detail.dimensions')} value={dimensoesPargas} />}
      {podeVerValores && <DetailRow label={t('inventory.detail.pricePerM2')} value={formatCurrency(data.preco_unitario) || '—'} />}
      {podeVerValores && <DetailRow label={t('inventory.detail.inventoryValue')} value={formatCurrency(data.valor_inventario) || '—'} />}
    </>
  );
}

function LadrilhoDetails({ data }: { data: Ladrilho }) {
  const t = useAppT();
  const { podeVerValores } = usePermissoes();
  return (
    <>
      <DetailRow label={t('inventory.detail.variety')} value={data.variedade} />
      <DetailRow label={t('inventory.detail.dimensions')} value={data.dimensoes} />
      <DetailRow label={t('inventory.detail.butchNo')} value={data.butch_no} />
      <DetailRow label={t('inventory.detail.supplier')} value={(data as any).fornecedor} />
      <Separator />
      <DetailRow label={t('inventory.detail.pieces')} value={data.num_pecas} />
      <DetailRow label={t('inventory.detail.area')} value={formatNumber(data.quantidade_m2) || '—'} />
      <DetailRow label={t('inventory.detail.weightKg')} value={data.peso != null ? formatNumber(data.peso, 0) : null} />
      {podeVerValores && <DetailRow label={t('inventory.detail.pricePerM2')} value={formatCurrency(data.preco_unitario) || '—'} />}
      {podeVerValores && <DetailRow label={t('inventory.detail.inventoryValue')} value={formatCurrency(data.valor_inventario) || '—'} />}
    </>
  );
}
