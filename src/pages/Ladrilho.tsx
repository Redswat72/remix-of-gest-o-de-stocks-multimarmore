import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLadrilho } from "@/hooks/useLadrilho";
import { useSupabaseEmpresa } from "@/hooks/useSupabaseEmpresa";
import { useEmpresa } from "@/context/EmpresaContext";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { exportLadrilhos } from "@/utils/exportExcel";
import { Search } from "lucide-react";
import { PARQUES_OPTIONS } from "@/lib/parques";

export default function Ladrilho() {
  const [parqueFiltro, setParqueFiltro] = useState("__all__");
  const [busca, setBusca] = useState("");
  const { data: ladrilhos, isLoading } = useLadrilho(parqueFiltro === "__all__" ? undefined : parqueFiltro);
  const supabase = useSupabaseEmpresa();
  const { empresaConfig } = useEmpresa();

  const ladrilhosFiltrados = ladrilhos?.filter((ladrilho) => {
    const searchLower = busca.toLowerCase();
    return (
      ladrilho.parque.toLowerCase().includes(searchLower) ||
      ladrilho.variedade?.toLowerCase().includes(searchLower) ||
      ladrilho.dimensoes?.toLowerCase().includes(searchLower) ||
      ladrilho.butch_no?.toLowerCase().includes(searchLower) ||
      ladrilho.id_mm?.toLowerCase().includes(searchLower) ||
      ladrilho.tipo?.toLowerCase().includes(searchLower) ||
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por ID, variedade, tipo, dimensões ou butch..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={parqueFiltro} onValueChange={setParqueFiltro}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por parque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os parques</SelectItem>
                {PARQUES_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* TABELA */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID MM</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Variedade</TableHead>
              <TableHead>Acabamento</TableHead>
              <TableHead className="text-right">Comp</TableHead>
              <TableHead className="text-right">Larg</TableHead>
              <TableHead className="text-right">Esp (cm)</TableHead>
              <TableHead className="text-right">Peças</TableHead>
              <TableHead className="text-right">m²</TableHead>
              <TableHead>Nota</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ladrilhosFiltrados?.map((ladrilho) => (
              <TableRow key={ladrilho.id}>
                <TableCell className="font-medium">{ladrilho.id_mm || "—"}</TableCell>
                <TableCell>{ladrilho.tipo || "—"}</TableCell>
                <TableCell>{ladrilho.variedade || "—"}</TableCell>
                <TableCell>{ladrilho.acabamento || "—"}</TableCell>
                <TableCell className="text-right">{formatNumber(ladrilho.comprimento, 0)}</TableCell>
                <TableCell className="text-right">{formatNumber(ladrilho.largura, 0)}</TableCell>
                <TableCell className="text-right">{formatNumber(ladrilho.espessura, 1)}</TableCell>
                <TableCell className="text-right">{ladrilho.num_pecas || "—"}</TableCell>
                <TableCell className="text-right">{formatNumber(ladrilho.quantidade_m2)}</TableCell>
                <TableCell className="max-w-[150px] truncate">{ladrilho.nota || "—"}</TableCell>
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
