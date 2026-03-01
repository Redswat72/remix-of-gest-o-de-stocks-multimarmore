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
import { ExportExcelButton } from '@/components/ExportExcelButton';
import { exportStockCompleto } from '@/utils/exportStockCompleto';

type SortField = 'referencia' | 'variedade' | 'quantidade' | 'valor';
type SortOrder = 'asc' | 'desc';

const FORMA_BADGE: Record<FormaInventario, { label: string; className: string }> = {
  bloco: { label: '🟦 Bloco', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  chapa: { label: '🟩 Chapa', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  ladrilho: { label: '🟨 Ladrilho', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
};

const formatCurrency = (value: number | null) => {
  if (!value) return '—';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatNumber = (value: number | null, decimals = 2) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
};

export default function Stock() {
  const navigate = useNavigate();
  const { empresaConfig } = useEmpresa();
  const supabase = useSupabaseEmpresa();
  const [busca, setBusca] = useState('');
  const [formaFilter, setFormaFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('referencia');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const { data: items, isLoading } = useStockUnificado({
    forma: (formaFilter || undefined) as FormaInventario | undefined,
    busca: busca || undefined,
  });

  const sortedItems = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'referencia': cmp = a.referencia.localeCompare(b.referencia); break;
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
    return {
      blocos: blocos.length,
      chapas: chapas.length,
      ladrilho: ladrilho.length,
      valorTotal: sortedItems.reduce((s, i) => s + (i.valor || 0), 0),
    };
  }, [sortedItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Consulta de Stock</h1>
          <p className="text-muted-foreground">Blocos, Chapas e Ladrilhos de todas as tabelas</p>
        </div>
        <ExportExcelButton
          onExport={() => exportStockCompleto(supabase, {
            empresaNome: empresaConfig!.nome,
            corHeader: empresaConfig!.cor,
          })}
          label="Exportar Excel"
        />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Blocos</p>
            <p className="text-2xl font-bold">{totals.blocos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Chapas</p>
            <p className="text-2xl font-bold">{totals.chapas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Ladrilhos</p>
            <p className="text-2xl font-bold">{totals.ladrilho}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.valorTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar filtros</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por ID, variedade, parque..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={formaFilter || 'all'} onValueChange={v => setFormaFilter(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as formas</SelectItem>
                <SelectItem value="bloco">Bloco</SelectItem>
                <SelectItem value="chapa">Chapa</SelectItem>
                <SelectItem value="ladrilho">Ladrilho</SelectItem>
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
                    <TableHead>Forma</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('referencia')}>
                      <div className="flex items-center gap-1">ID / Referência <SortIcon field="referencia" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('variedade')}>
                      <div className="flex items-center gap-1">Variedade <SortIcon field="variedade" /></div>
                    </TableHead>
                    <TableHead>Parque</TableHead>
                    <TableHead>Acabamento</TableHead>
                    <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('quantidade')}>
                      <div className="flex items-center justify-end gap-1">Quantidade <SortIcon field="quantidade" /></div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('valor')}>
                      <div className="flex items-center justify-end gap-1">Valor (€) <SortIcon field="valor" /></div>
                    </TableHead>
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
                        <Badge className={FORMA_BADGE[item.forma].className}>
                          {FORMA_BADGE[item.forma].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-medium">{item.referencia}</TableCell>
                      <TableCell className="text-muted-foreground">{item.variedade || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.parque}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.acabamento || '—'}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(item.quantidade)} {item.unidade}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum item em stock</p>
              <p className="text-sm">Ajuste os filtros ou importe dados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {sortedItems.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          A mostrar {sortedItems.length} item{sortedItems.length !== 1 ? 'ns' : ''}
        </div>
      )}
    </div>
  );
}
