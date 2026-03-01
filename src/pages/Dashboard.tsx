import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBlocos, useResumoBlocos } from "@/hooks/useBlocos";
import { useChapas, useResumoChapas } from "@/hooks/useChapas";
import { useLadrilho, useResumoLadrilho } from "@/hooks/useLadrilho";
import { useResumoBandas } from "@/hooks/useBandas";
import { Package, Grid3x3, Square, Layers } from "lucide-react";
import { useEmpresa } from "@/context/EmpresaContext";
import { Skeleton } from "@/components/ui/skeleton";
import { PARQUES, type ParqueCode } from "@/lib/parques";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard() {
  const { empresaConfig } = useEmpresa();
  const { data: resumoBlocos, isLoading: loadingBlocos } = useResumoBlocos();
  const { data: resumoChapas, isLoading: loadingChapas } = useResumoChapas();
  const { data: resumoLadrilho, isLoading: loadingLadrilho } = useResumoLadrilho();
  const { data: resumoBandas, isLoading: loadingBandas } = useResumoBandas();

  const { data: allBlocos } = useBlocos();
  const { data: allChapas } = useChapas();
  const { data: allLadrilhos } = useLadrilho();

  const isLoading = loadingBlocos || loadingChapas || loadingLadrilho || loadingBandas;

  const totalRegistos =
    (resumoBlocos?.total_blocos || 0) +
    (resumoChapas?.total_chapas || 0) +
    (resumoLadrilho?.total_registos || 0);

  const valorTotal =
    (resumoBlocos?.valor_total || 0) +
    (resumoChapas?.valor_total || 0) +
    (resumoLadrilho?.valor_total || 0) +
    (resumoBandas?.valor_total || 0);

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

  // Aggregate by parque
  const parqueBreakdown = useMemo(() => {
    const map: Record<string, { blocos_tons: number; chapas_m2: number; ladrilho_m2: number; valor: number; blocos_count: number; chapas_count: number; ladrilho_count: number }> = {};

    const ensure = (p: string) => {
      if (!map[p]) map[p] = { blocos_tons: 0, chapas_m2: 0, ladrilho_m2: 0, valor: 0, blocos_count: 0, chapas_count: 0, ladrilho_count: 0 };
    };

    allBlocos?.forEach((b) => {
      ensure(b.parque);
      map[b.parque].blocos_tons += b.quantidade_tons || 0;
      map[b.parque].blocos_count += 1;
      map[b.parque].valor += b.valor_inventario || 0;
    });

    allChapas?.forEach((c) => {
      ensure(c.parque);
      map[c.parque].chapas_m2 += c.quantidade_m2 || 0;
      map[c.parque].chapas_count += 1;
      map[c.parque].valor += c.valor_inventario || 0;
    });

    allLadrilhos?.forEach((l) => {
      ensure(l.parque);
      map[l.parque].ladrilho_m2 += l.quantidade_m2 || 0;
      map[l.parque].ladrilho_count += 1;
      map[l.parque].valor += l.valor_inventario || 0;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([parque, data]) => ({
        parque,
        nome: PARQUES[parque as ParqueCode] || parque,
        ...data,
      }));
  }, [allBlocos, allChapas, allLadrilhos]);

  const chartData = parqueBreakdown.map((p) => ({
    parque: p.parque,
    nome: p.nome,
    valor: Math.round(p.valor),
  }));

  const corPrimaria = empresaConfig?.cor || '#3b82f6';

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
          <p className="text-sm text-muted-foreground mt-1">
            {formatNumber(totalRegistos)} registos — {formatNumber(resumoBlocos?.total_blocos || 0)} blocos · {formatNumber(resumoChapas?.total_chapas || 0)} chapas · {formatNumber(resumoLadrilho?.total_registos || 0)} ladrilhos
          </p>
        </CardContent>
      </Card>

      {/* CARDS DE RESUMO */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        {/* BANDAS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bandas</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resumoBandas?.total_bandas || 0}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(resumoBandas?.total_m2 || 0, 2)} m²
            </p>
            <p className="text-sm font-medium text-primary mt-1">
              {formatCurrency(resumoBandas?.valor_total || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DISTRIBUIÇÃO POR PARQUE - TABELA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição por Parque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parque</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Blocos (tons)</TableHead>
                  <TableHead className="text-right">Chapas (m²)</TableHead>
                  <TableHead className="text-right">Ladrilho (m²)</TableHead>
                  <TableHead className="text-right">Valor Total (€)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parqueBreakdown.map((row) => (
                  <TableRow key={row.parque}>
                    <TableCell className="font-medium">{row.parque}</TableCell>
                    <TableCell>{row.nome}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.blocos_tons, 2)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.chapas_m2, 2)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.ladrilho_m2, 2)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.valor)}</TableCell>
                  </TableRow>
                ))}
                {/* TOTAL */}
                <TableRow className="border-t-2 font-bold">
                  <TableCell colSpan={2}>TOTAL</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(parqueBreakdown.reduce((s, r) => s + r.blocos_tons, 0), 2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(parqueBreakdown.reduce((s, r) => s + r.chapas_m2, 0), 2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(parqueBreakdown.reduce((s, r) => s + r.ladrilho_m2, 0), 2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(parqueBreakdown.reduce((s, r) => s + r.valor, 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* GRÁFICO - VALOR POR PARQUE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Valor por Parque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="parque" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v: number) => `${(v / 1000).toLocaleString('pt-PT')}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value),
                    'Valor',
                  ]}
                  labelFormatter={(label: string) => {
                    const found = chartData.find((d) => d.parque === label);
                    return found ? `${label} — ${found.nome}` : label;
                  }}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={corPrimaria} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
