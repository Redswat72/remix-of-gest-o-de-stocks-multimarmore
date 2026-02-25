import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBandas } from "@/hooks/useBandas";
import { Search } from "lucide-react";

export default function Bandas() {
  const [parqueFiltro, setParqueFiltro] = useState<string>("");
  const [busca, setBusca] = useState("");
  const { data: bandas, isLoading } = useBandas(parqueFiltro || undefined);

  const bandasFiltradas = bandas?.filter((banda) => {
    const searchLower = busca.toLowerCase();
    return (
      banda.idmm?.toLowerCase().includes(searchLower) ||
      banda.variedade?.toLowerCase().includes(searchLower) ||
      false
    );
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatNumber = (value: number | null, decimals: number = 2) => {
    if (!value) return "—";
    return new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bandas</h1>
        <p className="text-muted-foreground">Gestão de bandas de pedra</p>
      </div>

      {/* FILTROS */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por ID, variedade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={parqueFiltro} onValueChange={setParqueFiltro}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os parques" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os parques</SelectItem>
              <SelectItem value="MM">MM</SelectItem>
              <SelectItem value="MOL">MOL</SelectItem>
              <SelectItem value="MTX">MTX</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* TABELA */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Parque</TableHead>
              <TableHead>Variedade</TableHead>
              <TableHead>Dimensões</TableHead>
              <TableHead className="text-right">m²</TableHead>
              <TableHead className="text-right">Preço/m²</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bandasFiltradas?.map((banda) => (
              <TableRow key={banda.id}>
                <TableCell className="font-medium">{banda.idmm}</TableCell>
                <TableCell>
                  <Badge variant="outline">{banda.parque}</Badge>
                </TableCell>
                <TableCell>{banda.variedade || "—"}</TableCell>
                <TableCell>
                  {banda.largura && banda.altura
                    ? `${banda.largura} × ${banda.altura} cm`
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(banda.quantidade_m2)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(banda.preco_unitario)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(banda.valor_inventario)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* RODAPÉ */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="text-muted-foreground">
            Total de bandas: <strong className="text-foreground">{bandasFiltradas?.length || 0}</strong>
          </span>
          <span className="text-muted-foreground">
            Total:{" "}
            <strong className="text-foreground">
              {formatNumber(bandasFiltradas?.reduce((sum, b) => sum + (b.quantidade_m2 || 0), 0) || 0)} m²
            </strong>
          </span>
          <span className="text-muted-foreground">
            Valor:{" "}
            <strong className="text-foreground">
              {formatCurrency(bandasFiltradas?.reduce((sum, b) => sum + (b.valor_inventario || 0), 0) || 0)}
            </strong>
          </span>
        </div>
      </Card>
    </div>
  );
}
