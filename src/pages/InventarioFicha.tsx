import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, QrCode, ZoomIn } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import { useAuth } from '@/hooks/useAuth';
import { usePermissoes } from '@/hooks/usePermissoes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FotoLightbox } from '@/components/produtos/FotoLightbox';
import InventarioEditModal from '@/components/inventario/InventarioEditModal';
import type { Bloco, Chapa, Ladrilho } from '@/types/inventario';
import type { FormaInventario } from '@/hooks/useStockUnificado';

const FORMA_LABELS: Record<string, string> = {
  bloco: 'Bloco',
  chapa: 'Chapa',
  ladrilho: 'Ladrilho',
};

const FORMA_COLORS: Record<string, string> = {
  bloco: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  chapa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ladrilho: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

const formatCurrency = (value: number | null) => {
  if (!value) return '—';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatNumber = (value: number | null, decimals = 2) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
};

export default function InventarioFicha() {
  const { forma, id } = useParams<{ forma: string; id: string }>();
  const navigate = useNavigate();
  const supabase = useSupabaseEmpresa();
  const { empresaConfig } = useEmpresa();
  const { isSuperadmin, isAdmin } = useAuth();
  const canEdit = isSuperadmin || isAdmin;

  const tableName = forma === 'bloco' ? 'blocos' : forma === 'chapa' ? 'chapas' : 'ladrilho';

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventario-ficha', forma, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!forma && !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">A carregar ficha...</p>
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
              <h1 className="text-xl font-bold mb-2">Item não encontrado</h1>
              <p className="text-muted-foreground">
                {(error as Error)?.message || 'Não foi possível carregar os dados.'}
              </p>
            </div>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  : (data as Ladrilho).variedade || 'Ladrilho'}
              </h1>
              <Badge className={FORMA_COLORS[forma || '']}>
                {FORMA_LABELS[forma || '']}
              </Badge>
            </div>
            <p className="text-muted-foreground">{empresaConfig?.nome}</p>
          </div>
        </div>
        {canEdit && data && forma && (
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
            <CardTitle className="text-base">Dados do Item</CardTitle>
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
              Identificação & Fotos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">Forma</span>
              <p className="font-medium">{FORMA_LABELS[forma || '']}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">ID interno</span>
              <p className="font-mono text-sm">{id}</p>
            </div>
            
            {/* Display photos */}
            <PhotoGallery forma={forma as string} data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PhotoGallery({ forma, data }: { forma: string; data: unknown }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const photos: { label: string; url: string }[] = [];
  let idLabel = '';

  if (forma === 'bloco') {
    const d = data as Bloco;
    idLabel = d.id_mm;
    if (d.foto1_url) photos.push({ label: 'Foto 1', url: d.foto1_url });
    if (d.foto2_url) photos.push({ label: 'Foto 2', url: d.foto2_url });
  } else if (forma === 'chapa') {
    const d = data as Chapa;
    idLabel = d.id_mm;
    for (let i = 1; i <= 4; i++) {
      const primeira = d[`parga${i}_foto_primeira` as keyof Chapa] as string | null;
      const ultima = d[`parga${i}_foto_ultima` as keyof Chapa] as string | null;
      if (primeira) photos.push({ label: `Parga ${i} - Primeira`, url: primeira });
      if (ultima) photos.push({ label: `Parga ${i} - Última`, url: ultima });
    }
  } else if (forma === 'ladrilho') {
    const d = data as Ladrilho;
    idLabel = d.variedade || 'Ladrilho';
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
        idmm={idLabel}
        tipoPedra={FORMA_LABELS[forma] || forma}
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

function BlocoDetails({ data }: { data: Bloco }) {
  const { podeVerValores } = usePermissoes();
  return (
    <>
      <DetailRow label="ID MM" value={data.id_mm} />
      <DetailRow label="Parque" value={data.parque} />
      <DetailRow label="Variedade" value={data.variedade} />
      <DetailRow label="Origem" value={data.bloco_origem} />
      <Separator />
      <DetailRow label="Toneladas" value={formatNumber(data.quantidade_tons)} />
      {podeVerValores && <DetailRow label="Preço/ton" value={formatCurrency(data.preco_unitario)} />}
      {podeVerValores && <DetailRow label="Valor de Inventário" value={formatCurrency(data.valor_inventario)} />}
      {(data.comprimento || data.largura || data.altura) && (
        <>
          <Separator />
          <div className="grid grid-cols-3 gap-4">
            <DetailRow label="Comprimento" value={data.comprimento ? `${data.comprimento}` : null} />
            <DetailRow label="Largura" value={data.largura ? `${data.largura}` : null} />
            <DetailRow label="Altura" value={data.altura ? `${data.altura}` : null} />
          </div>
        </>
      )}
    </>
  );
}

function ChapaDetails({ data }: { data: Chapa }) {
  const { podeVerValores } = usePermissoes();
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
    </>
  );
}

function LadrilhoDetails({ data }: { data: Ladrilho }) {
  return (
    <>
      <DetailRow label="Variedade" value={data.variedade} />
      <DetailRow label="Dimensões" value={data.dimensoes} />
      <DetailRow label="Butch No" value={data.butch_no} />
      <Separator />
      <DetailRow label="Peças" value={data.num_pecas} />
      <DetailRow label="Área (m²)" value={formatNumber(data.quantidade_m2)} />
      <DetailRow label="Peso (kg)" value={formatNumber(data.peso, 0)} />
      <DetailRow label="Preço/m²" value={formatCurrency(data.preco_unitario)} />
      <DetailRow label="Valor de Inventário" value={formatCurrency(data.valor_inventario)} />
    </>
  );
}
