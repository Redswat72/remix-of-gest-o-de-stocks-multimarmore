import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useEmpresa } from '@/context/EmpresaContext';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockUnificado, type FormaInventario, type ItemUnificado } from '@/hooks/useStockUnificado';
import type { Bloco } from '@/types/inventario';
import { useResumoBandas } from '@/hooks/useBandas';
import { usePermissoes } from '@/hooks/usePermissoes';
import { ExportExcelButton } from '@/components/ExportExcelButton';
import { exportStockCompleto } from '@/utils/exportStockCompleto';
import { useAppT } from '@/hooks/useAppT';
import { useEnumLabel } from '@/lib/enumLabels';
import { formatCurrency, formatNumber } from '@/lib/format';

type SortField = 'referencia' | 'variedade' | 'quantidade' | 'valor';
type SortOrder = 'asc' | 'desc';

const FORMA_BADGE_CLASS: Record<FormaInventario, string> = {
  bloco: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  chapa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ladrilho: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

const FORMA_EMOJI: Record<FormaInventario, string> = {
  bloco: '🟦',
  chapa: '🟩',
  ladrilho: '🟨',
};

export default function Stock() {
  const t = useAppT();
  const enumLabel = useEnumLabel();
  const navigate = useNavigate();
  const { empresaConfig } = useEmpresa();
  const supabase = useSupabaseEmpresa();
  const [busca, setBusca] = useState('');
  const [formaFilter, setFormaFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('referencia');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const { podeVerValores } = usePermissoes();

  const { data: items, isLoading } = useStockUnificado({
    forma: (formaFilter || undefined) as FormaInventario | undefined,
    busca: busca || undefined,
  });
  const { data: resumoBandas } = useResumoBandas();

  const getDisplayReferencia = (item: ItemUnificado) => {
    if (item.forma === 'bloco') {
      return (item.raw as Bloco).id_mm || item.idMm || item.referencia;
    }
    return item.referencia;
  };

  const sortedItems = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'referencia': cmp = getDisplayReferencia(a).localeCompare(getDisplayReferencia(b)); break;
        case 'variedade': cmp = (a.variedade || '').localeCompare(b.variedade || ''); break;
        case 'quantidade': cmp = a.quantidade - b.quantidade; break;
        case 'valor': cmp = (a.valor || 0) - (b.valor || 0); break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [items, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const clearFilters = () => { setBusca(''); setFormaFilter(''); };
  const hasFilters = busca || formaFilter;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  // Totals
  const totals = useMemo(() => {
    const blocos = sortedItems.filter(i => i.forma === 'bloco');
    const chapas = sortedItems.filter(i => i.forma === 'chapa');
    const ladrilho = sortedItems.filter(i => i.forma === 'ladrilho');
    const valorBase = sortedItems.reduce((s, i) => s + (i.valor || 0), 0);
    const bandas = resumoBandas?.total_bandas || 0;
    const valorBandas = resumoBandas?.valor_total || 0;

    return {
      blocos: blocos.length,
      chapas: chapas.length,
      ladrilho: ladrilho.length,
      bandas,
      valorTotal: valorBase + valorBandas,
    };
  }, [sortedItems, resumoBandas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('stock.title')}</h1>
          <p className="text-muted-foreground">{t('stock.subtitle')}</p>
        </div>
        {podeVerValores && (
          <ExportExcelButton
            onExport={() => exportStockCompleto(supabase, {
              empresaNome: empresaConfig!.nome,
              corHeader: empresaConfig!.cor,
            })}
            label={t('stock.exportExcel')}
          />
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{t('nav.blocos')}</p>
            <p className="text-2xl font-bold">{totals.blocos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{t('nav.chapas')}</p>
            <p className="text-2xl font-bold">{totals.chapas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{t('stock.tiles')}</p>
            <p className="text-2xl font-bold">{totals.ladrilho}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{t('nav.bandas')}</p>
            <p className="text-2xl font-bold">{totals.bandas}</p>
          </CardContent>
        </Card>
        {podeVerValores && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">{t('stock.totalValue')}</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.valorTotal) || '—'}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t('actions.filter')}
            </CardTitle>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>{t('stock.clearFilters')}</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('stock.searchPlaceholder')}
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={formaFilter || 'all'} onValueChange={v => setFormaFilter(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('stock.allForms')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('stock.allForms')}</SelectItem>
                <SelectItem value="bloco">{enumLabel('tipoProduto', 'bloco')}</SelectItem>
                <SelectItem value="chapa">{enumLabel('tipoProduto', 'chapa')}</SelectItem>
                <SelectItem value="ladrilho">{enumLabel('tipoProduto', 'ladrilho')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-20" />
                </div>
              ))}
            </div>
          ) : sortedItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('stock.colForm')}</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('referencia')}>
                      <div className="flex items-center gap-1">{t('stock.colIdMm')} <SortIcon field="referencia" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('variedade')}>
                      <div className="flex items-center gap-1">{t('stock.colVariety')} <SortIcon field="variedade" /></div>
                    </TableHead>
                    <TableHead>{t('stock.colYard')}</TableHead>
                    <TableHead>{t('stock.colFinish')}</TableHead>
                    <TableHead>{t('stock.colDimensions')}</TableHead>
                    <TableHead className="text-right">{t('stock.colWeight')}</TableHead>
                    <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('quantidade')}>
                      <div className="flex items-center justify-end gap-1">{t('stock.colQuantity')} <SortIcon field="quantidade" /></div>
                    </TableHead>
                    {podeVerValores && (
                      <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('valor')}>
                        <div className="flex items-center justify-end gap-1">{t('stock.colValue')} <SortIcon field="valor" /></div>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map(item => (
                    <TableRow
                      key={`${item.forma}-${item.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/inventario/${item.forma}/${item.id}`)}
                    >
                      <TableCell>
                        <Badge className={FORMA_BADGE_CLASS[item.forma]}>
                          {FORMA_EMOJI[item.forma]} {enumLabel('tipoProduto', item.forma)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-medium">{getDisplayReferencia(item)}</TableCell>
                      <TableCell className="text-muted-foreground">{item.variedade || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.parque}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.acabamento || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {item.comprimento && item.largura && item.altura
                          ? `${formatNumber(item.comprimento, 0)} × ${formatNumber(item.largura, 0)} × ${formatNumber(item.altura, 0)} cm`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.forma === 'bloco' && item.pesoKg ? `${formatNumber(item.pesoKg, 0)} kg` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(item.quantidade)} {item.unidade}
                      </TableCell>
                      {podeVerValores && (
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.valor) || '—'}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('stock.noItems')}</p>
              <p className="text-sm">{t('stock.adjustFilters')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {sortedItems.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {t('stock.showingItems', { count: sortedItems.length })}
        </div>
      )}
    </div>
  );
}
