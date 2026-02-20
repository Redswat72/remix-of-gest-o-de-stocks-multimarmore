import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useChapas } from "@/hooks/useChapas";
import { Search } from "lucide-react";

export default function Chapas() {
  const [parqueFiltro, setParqueFiltro] = useState("__all__");
  const [busca, setBusca] = useState("");

  const { data: chapas, isLoading } = useChapas(parqueFiltro === "__all__" ? undefined : parqueFiltro);

  const chapasFiltradas = chapas?.filter((chapa) => {
    const searchLower = busca.toLowerCase();
    return (
      chapa.id_mm.toLowerCase().includes(searchLower) ||
      chapa.parque.toLowerCase().includes(searchLower) ||
      chapa.bundle_id?.toLowerCase().includes(searchLower) ||
      chapa.variedade?.toLowerCase().includes(searchLower) ||
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
      <div>
        <h1 className="text-2xl font-bold">Chapas</h1>
        <p className="text-muted-foreground">Gestão de chapas de pedra</p>
      </div>

      {/* FILTROS */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por ID, bundle, parque ou variedade..."
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
                <SelectItem value="MM Orlando Grey">MM Orlando Grey</SelectItem>
                <SelectItem value="Plurirochas">Plurirochas</SelectItem>
                <SelectItem value="MTX">MTX</SelectItem>
                <SelectItem value="MTX Calcário">MTX Calcário</SelectItem>
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
              <TableHead>Bundle/Parga</TableHead>
              <TableHead>Parque</TableHead>
              <TableHead>Variedade</TableHead>
              <TableHead className="text-right">Chapas</TableHead>
              <TableHead className="text-right">m²</TableHead>
              <TableHead className="text-right">Preço/m²</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chapasFiltradas?.map((chapa) => (
              <TableRow key={chapa.id}>
                <TableCell className="font-medium">{chapa.id_mm}</TableCell>
                <TableCell>{chapa.bundle_id || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{chapa.parque}</Badge>
                </TableCell>
                <TableCell>{chapa.variedade || "—"}</TableCell>
                <TableCell className="text-right">{chapa.num_chapas || "—"}</TableCell>
                <TableCell className="text-right">{formatNumber(chapa.quantidade_m2)}</TableCell>
                <TableCell className="text-right">{formatCurrency(chapa.preco_unitario)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(chapa.valor_inventario)}</TableCell>
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
              Total de chapas: <strong>{chapasFiltradas?.length || 0}</strong>
            </span>
            <span className="text-muted-foreground">
              Total:{" "}
              <strong>
                {formatNumber(chapasFiltradas?.reduce((sum, c) => sum + c.quantidade_m2, 0) || 0)} m²
              </strong>
            </span>
            <span className="text-muted-foreground">
              Valor:{" "}
              <strong>
                {formatCurrency(chapasFiltradas?.reduce((sum, c) => sum + (c.valor_inventario || 0), 0) || 0)}
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
