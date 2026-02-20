import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useLadrilho } from "@/hooks/useLadrilho";
import { useSupabaseEmpresa } from "@/hooks/useSupabaseEmpresa";
import { useEmpresa } from "@/context/EmpresaContext";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { exportLadrilhos } from "@/utils/exportExcel";
import { Search } from "lucide-react";

export default function Ladrilho() {
  const [busca, setBusca] = useState("");
  const { data: ladrilhos, isLoading } = useLadrilho();
  const supabase = useSupabaseEmpresa();
  const { empresaConfig } = useEmpresa();

  const ladrilhosFiltrados = ladrilhos?.filter((ladrilho) => {
    const searchLower = busca.toLowerCase();
    return (
      ladrilho.parque.toLowerCase().includes(searchLower) ||
      ladrilho.variedade?.toLowerCase().includes(searchLower) ||
      ladrilho.dimensoes?.toLowerCase().includes(searchLower) ||
      ladrilho.butch_no?.toLowerCase().includes(searchLower) ||
      false
    );
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatNumber = (value: number | null, decimals: number = 2) => {
    if (!value) return "—";
    return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ladrilho</h1>
          <p className="text-muted-foreground">Gestão de ladrilho</p>
        </div>
        <ExportExcelButton onExport={() => exportLadrilhos(supabase, { empresaNome: empresaConfig!.nome, corHeader: empresaConfig!.cor })} />
      </div>

      {/* FILTROS */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por variedade, dimensões ou butch..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* TABELA */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variedade</TableHead>
              <TableHead>Dimensões</TableHead>
              <TableHead>Butch No</TableHead>
              <TableHead className="text-right">Peças</TableHead>
              <TableHead className="text-right">m²</TableHead>
              <TableHead className="text-right">Peso (kg)</TableHead>
              <TableHead className="text-right">Preço/m²</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ladrilhosFiltrados?.map((ladrilho) => (
              <TableRow key={ladrilho.id}>
                <TableCell className="font-medium">{ladrilho.variedade || "—"}</TableCell>
                <TableCell>{ladrilho.dimensoes || "—"}</TableCell>
                <TableCell>{ladrilho.butch_no || "—"}</TableCell>
                <TableCell className="text-right">{ladrilho.num_pecas || "—"}</TableCell>
                <TableCell className="text-right">{formatNumber(ladrilho.quantidade_m2)}</TableCell>
                <TableCell className="text-right">{formatNumber(ladrilho.peso, 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(ladrilho.preco_unitario)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(ladrilho.valor_inventario)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* RODAPÉ */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-muted-foreground">
              Total de registos: <strong>{ladrilhosFiltrados?.length || 0}</strong>
            </span>
            <span className="text-muted-foreground">
              Total peças:{" "}
              <strong>
                {formatNumber(ladrilhosFiltrados?.reduce((sum, l) => sum + (l.num_pecas || 0), 0) || 0, 0)}
              </strong>
            </span>
            <span className="text-muted-foreground">
              Total:{" "}
              <strong>
                {formatNumber(ladrilhosFiltrados?.reduce((sum, l) => sum + l.quantidade_m2, 0) || 0)} m²
              </strong>
            </span>
            <span className="text-muted-foreground">
              Valor:{" "}
              <strong>
                {formatCurrency(ladrilhosFiltrados?.reduce((sum, l) => sum + (l.valor_inventario || 0), 0) || 0)}
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
