import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlocos } from "@/hooks/useBlocos";
import { Search } from "lucide-react";

export default function Blocos() {
  const [parqueFiltro, setParqueFiltro] = useState("");
  const [busca, setBusca] = useState("");

  const { data: blocos, isLoading } = useBlocos(parqueFiltro || undefined);

  const blocosFiltrados = blocos?.filter((bloco) => {
    const searchLower = busca.toLowerCase();
    return (
      bloco.id_mm.toLowerCase().includes(searchLower) ||
      bloco.parque.toLowerCase().includes(searchLower) ||
      bloco.variedade?.toLowerCase().includes(searchLower) ||
      false
    );
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatNumber = (value: number | null, decimals: number = 2) => {
    if (!value) return "—";
    return new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
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
        <h1 className="text-2xl font-bold">Blocos</h1>
        <p className="text-muted-foreground">Gestão de blocos de pedra</p>
      </div>

      {/* FILTROS */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por ID, parque ou variedade..."
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
                <SelectItem value="">Todos os parques</SelectItem>
                <SelectItem value="MM">MM</SelectItem>
                <SelectItem value="MOL">MOL</SelectItem>
                <SelectItem value="Olival do Pires">Olival do Pires</SelectItem>
                <SelectItem value="Plurirochas">Plurirochas</SelectItem>
                <SelectItem value="Estremoz">Estremoz</SelectItem>
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
              <TableHead>Parque</TableHead>
              <TableHead>Variedade</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Toneladas</TableHead>
              <TableHead className="text-right">Preço/ton</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocosFiltrados?.map((bloco) => (
              <TableRow key={bloco.id}>
                <TableCell className="font-medium">{bloco.id_mm}</TableCell>
                <TableCell>
                  <Badge variant="outline">{bloco.parque}</Badge>
                </TableCell>
                <TableCell>{bloco.variedade || "—"}</TableCell>
                <TableCell>{bloco.bloco_origem || "—"}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(bloco.quantidade_tons)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(bloco.preco_unitario)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(bloco.valor_inventario)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* RODAPÉ COM TOTAIS */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-muted-foreground">
              Total de blocos: <strong>{blocosFiltrados?.length || 0}</strong>
            </span>
            <span className="text-muted-foreground">
              Total:{" "}
              <strong>
                {formatNumber(
                  blocosFiltrados?.reduce((sum, b) => sum + b.quantidade_tons, 0) || 0
                )}{" "}
                tons
              </strong>
            </span>
            <span className="text-muted-foreground">
              Valor:{" "}
              <strong>
                {formatCurrency(
                  blocosFiltrados?.reduce((sum, b) => sum + (b.valor_inventario || 0), 0) || 0
                )}
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
