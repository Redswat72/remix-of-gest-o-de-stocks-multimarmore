import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, QrCode } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Identificação
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
            <div>
              <span className="text-sm text-muted-foreground">URL da ficha</span>
              <p className="font-mono text-xs break-all text-muted-foreground">
                {window.location.origin}/inventario/{forma}/{id}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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
  return (
    <>
      <DetailRow label="ID MM" value={data.id_mm} />
      <DetailRow label="Parque" value={data.parque} />
      <DetailRow label="Variedade" value={data.variedade} />
      <DetailRow label="Origem" value={data.bloco_origem} />
      <Separator />
      <DetailRow label="Toneladas" value={formatNumber(data.quantidade_tons)} />
      <DetailRow label="Preço/ton" value={formatCurrency(data.preco_unitario)} />
      <DetailRow label="Valor de Inventário" value={formatCurrency(data.valor_inventario)} />
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
      <DetailRow label="Preço/m²" value={formatCurrency(data.preco_unitario)} />
      <DetailRow label="Valor de Inventário" value={formatCurrency(data.valor_inventario)} />
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
