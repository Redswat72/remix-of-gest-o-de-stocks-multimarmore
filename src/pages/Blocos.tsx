import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlocos } from "@/hooks/useBlocos";
import { useSupabaseEmpresa } from "@/hooks/useSupabaseEmpresa";
import { useEmpresa } from "@/context/EmpresaContext";
import { usePermissoes } from "@/hooks/usePermissoes";
import { useAuth } from "@/hooks/useAuth";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { exportBlocos } from "@/utils/exportExcel";
import { Search, Scissors, Ruler } from "lucide-react";
import { PARQUES_OPTIONS } from "@/lib/parques";
import InventarioDetailModal from "@/components/inventario/InventarioDetailModal";
import MedicaoPendenteModal from "@/components/inventario/MedicaoPendenteModal";

export default function Blocos() {
  const navigate = useNavigate();
  const [parqueFiltro, setParqueFiltro] = useState("__all__");
  const [busca, setBusca] = useState("");
  const supabase = useSupabaseEmpresa();
  const { empresaConfig } = useEmpresa();
  const { podeVerValores } = usePermissoes();
  const { isAdmin, isSuperadmin } = useAuth();
  const canProduce = isAdmin || isSuperadmin;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [medicaoBloco, setMedicaoBloco] = useState<{ id: string; id_mm: string } | null>(null);

  const { data: blocos, isLoading } = useBlocos(parqueFiltro === "__all__" ? undefined : parqueFiltro);

  // Filter only active blocos (ativo !== false)
  const blocosAtivos = blocos?.filter(b => (b as any).ativo !== false);

  const blocosFiltrados = blocosAtivos?.filter((bloco) => {
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
          <h1 className="text-2xl font-bold">Blocos</h1>
          <p className="text-muted-foreground">Gestão de blocos de pedra</p>
        </div>
        {podeVerValores && (
          <ExportExcelButton onExport={() => exportBlocos(supabase, { empresaNome: empresaConfig!.nome, corHeader: empresaConfig!.cor })} />
        )}
      </div>

      {/* FILTROS */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar por ID, parque ou variedade..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
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
              <TableHead>Parque</TableHead>
              <TableHead>Variedade</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Toneladas</TableHead>
              {podeVerValores && <TableHead className="text-right">Preço/ton</TableHead>}
              {podeVerValores && <TableHead className="text-right">Valor</TableHead>}
              <TableHead>Estado</TableHead>
              {canProduce && <TableHead className="text-center">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocosFiltrados?.map((bloco) => {
              const isMedicaoPendente = (bloco as any).medicao_pendente === true;
              const isCorteParcial = (bloco as any).corte_parcial === true;

              return (
                <TableRow key={bloco.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium" onClick={() => setSelectedId(bloco.id)}>{bloco.id_mm}</TableCell>
                  <TableCell onClick={() => setSelectedId(bloco.id)}><Badge variant="outline">{bloco.parque}</Badge></TableCell>
                  <TableCell onClick={() => setSelectedId(bloco.id)}>{bloco.variedade || "—"}</TableCell>
                  <TableCell onClick={() => setSelectedId(bloco.id)}>{bloco.bloco_origem || "—"}</TableCell>
                  <TableCell className="text-right" onClick={() => setSelectedId(bloco.id)}>{formatNumber(bloco.quantidade_tons)}</TableCell>
                  {podeVerValores && <TableCell className="text-right" onClick={() => setSelectedId(bloco.id)}>{formatCurrency(bloco.preco_unitario)}</TableCell>}
                  {podeVerValores && <TableCell className="text-right font-medium" onClick={() => setSelectedId(bloco.id)}>{formatCurrency(bloco.valor_inventario)}</TableCell>}
                  <TableCell>
                    {isMedicaoPendente && (
                      <Badge
                        className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 cursor-pointer hover:bg-orange-200"
                        onClick={() => setMedicaoBloco({ id: bloco.id, id_mm: bloco.id_mm })}
                      >
                        <Ruler className="h-3 w-3 mr-1" />
                        Medição Pendente
                      </Badge>
                    )}
                    {isCorteParcial && !isMedicaoPendente && (
                      <Badge variant="secondary">Corte Parcial</Badge>
                    )}
                  </TableCell>
                  {canProduce && (
                    <TableCell className="text-center">
                      {!isMedicaoPendente && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/producao?bloco=${bloco.id_mm}`);
                          }}
                        >
                          <Scissors className="h-3.5 w-3.5 mr-1" />
                          Produzir Chapa
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
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
              Total: <strong>{formatNumber(blocosFiltrados?.reduce((sum, b) => sum + b.quantidade_tons, 0) || 0)} tons</strong>
            </span>
            {podeVerValores && (
              <span className="text-muted-foreground">
                Valor: <strong>{formatCurrency(blocosFiltrados?.reduce((sum, b) => sum + (b.valor_inventario || 0), 0) || 0)}</strong>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedId && (
        <InventarioDetailModal
          open={!!selectedId}
          onOpenChange={(v) => { if (!v) setSelectedId(null); }}
          forma="bloco"
          itemId={selectedId}
        />
      )}

      {medicaoBloco && (
        <MedicaoPendenteModal
          open={!!medicaoBloco}
          onOpenChange={(v) => { if (!v) setMedicaoBloco(null); }}
          blocoId={medicaoBloco.id}
          idMm={medicaoBloco.id_mm}
        />
      )}
    </div>
  );
}