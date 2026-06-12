import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useChapas } from "@/hooks/useChapas";
import { useSupabaseEmpresa } from "@/hooks/useSupabaseEmpresa";
import { useEmpresa } from "@/context/EmpresaContext";
import { usePermissoes } from "@/hooks/usePermissoes";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { exportChapas } from "@/utils/exportExcel";
import { Search } from "lucide-react";
import { PARQUES_OPTIONS } from "@/lib/parques";
import InventarioDetailModal from "@/components/inventario/InventarioDetailModal";
import { useAppT } from "@/hooks/useAppT";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function Chapas() {
  const t = useAppT();
  const [parqueFiltro, setParqueFiltro] = useState("__all__");
  const [busca, setBusca] = useState("");
  const supabase = useSupabaseEmpresa();
  const { empresaConfig } = useEmpresa();
  const { podeVerValores } = usePermissoes();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: chapas, isLoading } = useChapas(parqueFiltro === "__all__" ? undefined : parqueFiltro);

  const chapasFiltradas = chapas?.filter((chapa) => {
    const searchLower = busca.toLowerCase();
    return (
      chapa.id_mm.toLowerCase().includes(searchLower) ||
      chapa.parque.toLowerCase().includes(searchLower) ||
      chapa.bundle_id?.toLowerCase().includes(searchLower) ||
      chapa.variedade?.toLowerCase().includes(searchLower) ||
      chapa.acabamento?.toLowerCase().includes(searchLower) ||
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
          <h1 className="text-2xl font-bold">{t('inventory.slabs.title')}</h1>
          <p className="text-muted-foreground">{t('inventory.slabs.subtitle')}</p>
        </div>
        {podeVerValores && (
          <ExportExcelButton onExport={() => exportChapas(supabase, { empresaNome: empresaConfig!.nome, corHeader: empresaConfig!.cor })} />
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('inventory.slabs.searchPlaceholder')} value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
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
              <TableHead>{t('inventory.col.bundleParga')}</TableHead>
              <TableHead>{t('inventory.col.yard')}</TableHead>
              <TableHead>{t('inventory.col.variety')}</TableHead>
              <TableHead>{t('inventory.col.finish')}</TableHead>
              <TableHead className="text-right">{t('inventory.col.numSlabs')}</TableHead>
              <TableHead className="text-right">{t('inventory.col.area')}</TableHead>
              {podeVerValores && <TableHead className="text-right">{t('inventory.col.pricePerM2')}</TableHead>}
              {podeVerValores && <TableHead className="text-right">{t('inventory.col.value')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {chapasFiltradas?.map((chapa) => (
              <TableRow key={chapa.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(chapa.id)}>
                <TableCell className="font-medium">{chapa.id_mm}</TableCell>
                <TableCell>{chapa.bundle_id || "—"}</TableCell>
                <TableCell><Badge variant="outline">{chapa.parque}</Badge></TableCell>
                <TableCell>{chapa.variedade || "—"}</TableCell>
                <TableCell>{chapa.acabamento || "—"}</TableCell>
                <TableCell className="text-right">{chapa.num_chapas || "—"}</TableCell>
                <TableCell className="text-right">{formatNumber(chapa.quantidade_m2) || '—'}</TableCell>
                {podeVerValores && <TableCell className="text-right">{formatCurrency(chapa.preco_unitario) || '—'}</TableCell>}
                {podeVerValores && <TableCell className="text-right font-medium">{formatCurrency(chapa.valor_inventario) || '—'}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-muted-foreground">
              {t('inventory.slabs.totalLabel')}: <strong>{chapasFiltradas?.length || 0}</strong>
            </span>
            <span className="text-muted-foreground">
              {t('inventory.total')}: <strong>{formatNumber(chapasFiltradas?.reduce((sum, c) => sum + c.quantidade_m2, 0) || 0) || '0'} m²</strong>
            </span>
            {podeVerValores && (
              <span className="text-muted-foreground">
                {t('inventory.value')}: <strong>{formatCurrency(chapasFiltradas?.reduce((sum, c) => sum + (c.valor_inventario || 0), 0) || 0) || '—'}</strong>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedId && (
        <InventarioDetailModal
          open={!!selectedId}
          onOpenChange={(v) => { if (!v) setSelectedId(null); }}
          forma="chapa"
          itemId={selectedId}
        />
      )}
    </div>
  );
}
