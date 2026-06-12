import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useLadrilho } from "@/hooks/useLadrilho";
import { useSupabaseEmpresa } from "@/hooks/useSupabaseEmpresa";
import { useEmpresa } from "@/context/EmpresaContext";
import { usePermissoes } from "@/hooks/usePermissoes";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { exportLadrilhos } from "@/utils/exportExcel";
import { Search } from "lucide-react";
import { PARQUES_OPTIONS } from "@/lib/parques";
import InventarioDetailModal from "@/components/inventario/InventarioDetailModal";
import { useAppT } from "@/hooks/useAppT";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function Ladrilho() {
  const t = useAppT();
  const [parqueFiltro, setParqueFiltro] = useState("__all__");
  const [busca, setBusca] = useState("");
  const { data: ladrilhos, isLoading } = useLadrilho(parqueFiltro === "__all__" ? undefined : parqueFiltro);
  const supabase = useSupabaseEmpresa();
  const { empresaConfig } = useEmpresa();
  const { podeVerValores } = usePermissoes();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
          <h1 className="text-2xl font-bold">{t('inventory.tiles.title')}</h1>
          <p className="text-muted-foreground">{t('inventory.tiles.subtitle')}</p>
        </div>
        {podeVerValores && (
          <ExportExcelButton onExport={() => exportLadrilhos(supabase, { empresaNome: empresaConfig!.nome, corHeader: empresaConfig!.cor })} />
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('inventory.tiles.searchPlaceholder')} value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
            </div>
            <Select value={parqueFiltro} onValueChange={setParqueFiltro}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={t('inventory.filterByYard')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('inventory.allYards')}</SelectItem>
                {PARQUES_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('inventory.col.idMm')}</TableHead>
              <TableHead>{t('inventory.col.type')}</TableHead>
              <TableHead>{t('inventory.col.variety')}</TableHead>
              <TableHead>{t('inventory.col.finish')}</TableHead>
              <TableHead className="text-right">{t('inventory.col.length')}</TableHead>
              <TableHead className="text-right">{t('inventory.col.width')}</TableHead>
              <TableHead className="text-right">{t('inventory.col.thickness')}</TableHead>
              <TableHead className="text-right">{t('inventory.col.pieces')}</TableHead>
              <TableHead className="text-right">{t('inventory.col.area')}</TableHead>
              {podeVerValores && <TableHead>{t('inventory.col.note')}</TableHead>}
              {podeVerValores && <TableHead className="text-right">{t('inventory.col.value')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ladrilhosFiltrados?.map((ladrilho) => (
              <TableRow key={ladrilho.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(ladrilho.id)}>
                <TableCell className="font-medium">{ladrilho.id_mm || "—"}</TableCell>
                <TableCell>{ladrilho.tipo || "—"}</TableCell>
                <TableCell>{ladrilho.variedade || "—"}</TableCell>
                <TableCell>{ladrilho.acabamento || "—"}</TableCell>
                <TableCell className="text-right">{formatNumber(ladrilho.comprimento, 0) || '—'}</TableCell>
                <TableCell className="text-right">{formatNumber(ladrilho.largura, 0) || '—'}</TableCell>
                <TableCell className="text-right">{formatNumber(ladrilho.espessura, 1) || '—'}</TableCell>
                <TableCell className="text-right">{ladrilho.num_pecas || "—"}</TableCell>
                <TableCell className="text-right">{formatNumber(ladrilho.quantidade_m2) || '—'}</TableCell>
                {podeVerValores && <TableCell className="max-w-[150px] truncate">{ladrilho.nota || "—"}</TableCell>}
                {podeVerValores && <TableCell className="text-right font-medium">{formatCurrency(ladrilho.valor_inventario) || '—'}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-muted-foreground">
              {t('inventory.tiles.totalRecords')}: <strong>{ladrilhosFiltrados?.length || 0}</strong>
            </span>
            <span className="text-muted-foreground">
              {t('inventory.tiles.totalPieces')}: <strong>{formatNumber(ladrilhosFiltrados?.reduce((sum, l) => sum + (l.num_pecas || 0), 0) || 0, 0) || '0'}</strong>
            </span>
            <span className="text-muted-foreground">
              {t('inventory.total')}: <strong>{formatNumber(ladrilhosFiltrados?.reduce((sum, l) => sum + l.quantidade_m2, 0) || 0) || '0'} m²</strong>
            </span>
            {podeVerValores && (
              <span className="text-muted-foreground">
                {t('inventory.value')}: <strong>{formatCurrency(ladrilhosFiltrados?.reduce((sum, l) => sum + (l.valor_inventario || 0), 0) || 0) || '—'}</strong>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedId && (
        <InventarioDetailModal
          open={!!selectedId}
          onOpenChange={(v) => { if (!v) setSelectedId(null); }}
          forma="ladrilho"
          itemId={selectedId}
        />
      )}
    </div>
  );
}
