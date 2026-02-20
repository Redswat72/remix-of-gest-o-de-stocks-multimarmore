import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResumoBlocos } from "@/hooks/useBlocos";
import { useResumoChapas } from "@/hooks/useChapas";
import { useResumoLadrilho } from "@/hooks/useLadrilho";
import { Package, Grid3x3, Square } from "lucide-react";
import { useEmpresa } from "@/context/EmpresaContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { empresaConfig } = useEmpresa();
  const { data: resumoBlocos, isLoading: loadingBlocos } = useResumoBlocos();
  const { data: resumoChapas, isLoading: loadingChapas } = useResumoChapas();
  const { data: resumoLadrilho, isLoading: loadingLadrilho } = useResumoLadrilho();

  const isLoading = loadingBlocos || loadingChapas || loadingLadrilho;

  const valorTotal =
    (resumoBlocos?.valor_total || 0) +
    (resumoChapas?.valor_total || 0) +
    (resumoLadrilho?.valor_total || 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard - {empresaConfig?.nome}</h1>
        <p className="text-muted-foreground">Visão geral do inventário</p>
      </div>

      {/* VALOR TOTAL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Valor Total do Inventário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(valorTotal)}</p>
        </CardContent>
      </Card>

      {/* CARDS DE RESUMO */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* BLOCOS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resumoBlocos?.total_blocos || 0}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(resumoBlocos?.total_tons || 0, 2)} toneladas
            </p>
            <p className="text-sm font-medium text-primary mt-1">
              {formatCurrency(resumoBlocos?.valor_total || 0)}
            </p>
          </CardContent>
        </Card>

        {/* CHAPAS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapas</CardTitle>
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resumoChapas?.total_chapas || 0}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(resumoChapas?.total_m2 || 0, 2)} m²
            </p>
            <p className="text-sm font-medium text-primary mt-1">
              {formatCurrency(resumoChapas?.valor_total || 0)}
            </p>
          </CardContent>
        </Card>

        {/* LADRILHO */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ladrilho</CardTitle>
            <Square className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resumoLadrilho?.total_registos || 0}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(resumoLadrilho?.total_m2 || 0, 2)} m² • {formatNumber(resumoLadrilho?.total_pecas || 0)} peças
            </p>
            <p className="text-sm font-medium text-primary mt-1">
              {formatCurrency(resumoLadrilho?.valor_total || 0)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
