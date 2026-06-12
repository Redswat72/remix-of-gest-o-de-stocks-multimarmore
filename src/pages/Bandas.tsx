import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBandas } from "@/hooks/useBandas";
import { usePermissoes } from "@/hooks/usePermissoes";
import { Search } from "lucide-react";
import InventarioDetailModal from "@/components/inventario/InventarioDetailModal";
import { useAppT } from "@/hooks/useAppT";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function Bandas() {
  const t = useAppT();
  const [parqueFiltro, setParqueFiltro] = useState<string>("");
  const [busca, setBusca] = useState("");
  const { data: bandas, isLoading } = useBandas(parqueFiltro || undefined);
  const { podeVerValores } = usePermissoes();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const bandasFiltradas = bandas?.filter((banda) => {
    const searchLower = busca.toLowerCase();
    return (
      banda.idmm?.toLowerCase().includes(searchLower) ||
      banda.variedade?.toLowerCase().includes(searchLower) ||
      false
    );
  });

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
        <h1 className="text-2xl font-bold">{t('inventory.strips.title')}</h1>
        <p className="text-muted-foreground">{t('inventory.strips.subtitle')}</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('inventory.strips.searchPlaceholder')} value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
          <Select value={parqueFiltro} onValueChange={setParqueFiltro}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('inventory.allYards')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('inventory.allYards')}</SelectItem>
              <SelectItem value="MM">MM</SelectItem>
              <SelectItem value="MOL">MOL</SelectItem>
              <SelectItem value="MTX">MTX</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t('inventory.col.yard')}</TableHead>
              <TableHead>{t('inventory.col.variety')}</TableHead>
              <TableHead>{t('inventory.col.dimensions')}</TableHead>
              <TableHead className="text-right">{t('inventory.col.area')}</TableHead>
              {podeVerValores && <TableHead className="text-right">{t('inventory.col.pricePerM2')}</TableHead>}
              {podeVerValores && <TableHead className="text-right">{t('inventory.col.value')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {bandasFiltradas?.map((banda) => (
              <TableRow key={banda.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(banda.id)}>
                <TableCell className="font-medium">{banda.idmm}</TableCell>
                <TableCell><Badge variant="outline">{banda.parque}</Badge></TableCell>
                <TableCell>{banda.variedade || "—"}</TableCell>
                <TableCell>
                  {banda.largura && banda.altura ? `${banda.largura} × ${banda.altura} cm` : "—"}
                </TableCell>
                <TableCell className="text-right">{formatNumber(banda.quantidade_m2) || '—'}</TableCell>
                {podeVerValores && <TableCell className="text-right">{formatCurrency(banda.preco_unitario) || '—'}</TableCell>}
                {podeVerValores && <TableCell className="text-right font-medium">{formatCurrency(banda.valor_inventario) || '—'}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="text-muted-foreground">
            {t('inventory.strips.totalLabel')}: <strong className="text-foreground">{bandasFiltradas?.length || 0}</strong>
          </span>
          <span className="text-muted-foreground">
            {t('inventory.total')}: <strong className="text-foreground">{formatNumber(bandasFiltradas?.reduce((sum, b) => sum + (b.quantidade_m2 || 0), 0) || 0) || '0'} m²</strong>
          </span>
          {podeVerValores && (
            <span className="text-muted-foreground">
              {t('inventory.value')}: <strong className="text-foreground">{formatCurrency(bandasFiltradas?.reduce((sum, b) => sum + (b.valor_inventario || 0), 0) || 0) || '—'}</strong>
            </span>
          )}
        </div>
      </Card>

      {selectedId && (
        <InventarioDetailModal
          open={!!selectedId}
          onOpenChange={(v) => { if (!v) setSelectedId(null); }}
          forma="banda"
          itemId={selectedId}
        />
      )}
    </div>
  );
}
