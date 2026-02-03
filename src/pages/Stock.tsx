import { useState, useMemo } from 'react';
import { Search, Filter, Download, Package, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useStockAgregado, type StockAgregado } from '@/hooks/useStock';
import { useLocaisAtivos } from '@/hooks/useLocais';
import { useTiposPedra } from '@/hooks/useProdutos';
import { exportToExcel } from '@/lib/exportExcel';

const STOCK_BAIXO_THRESHOLD = 5;

type SortField = 'idmm' | 'tipo_pedra' | 'stockTotal';
type SortOrder = 'asc' | 'desc';

export default function Stock() {
  const [searchIdmm, setSearchIdmm] = useState('');
  const [tipoPedraFilter, setTipoPedraFilter] = useState<string>('');
  const [formaFilter, setFormaFilter] = useState<string>('');
  const [localFilter, setLocalFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('idmm');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: stock, isLoading: stockLoading } = useStockAgregado({
    tipoPedra: tipoPedraFilter || undefined,
    forma: formaFilter || undefined,
    idmm: searchIdmm || undefined,
  });

  const { data: locais } = useLocaisAtivos();
  const { data: tiposPedra } = useTiposPedra();

  // Filtrar por local (filtro adicional no cliente)
  const stockFiltrado = useMemo(() => {
    if (!stock) return [];
    
    let filtered = stock;

    if (localFilter) {
      filtered = filtered.filter(item => 
        item.stockPorLocal.some(s => s.local.id === localFilter)
      );
    }

    // Ordenação
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'idmm':
          comparison = a.produto.idmm.localeCompare(b.produto.idmm);
          break;
        case 'tipo_pedra':
          comparison = a.produto.tipo_pedra.localeCompare(b.produto.tipo_pedra);
          break;
        case 'stockTotal':
          comparison = a.stockTotal - b.stockTotal;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [stock, localFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleRow = (produtoId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(produtoId)) {
        newSet.delete(produtoId);
      } else {
        newSet.add(produtoId);
      }
      return newSet;
    });
  };

  const getStockBadge = (quantidade: number) => {
    if (quantidade === 0) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Sem stock</Badge>;
    }
    if (quantidade <= STOCK_BAIXO_THRESHOLD) {
      return <Badge variant="outline" className="border-caution text-caution gap-1"><AlertTriangle className="w-3 h-3" /> Stock baixo</Badge>;
    }
    return null;
  };

  const getFormaBadge = (forma: string) => {
    const classes: Record<string, string> = {
      bloco: 'badge-operador',
      chapa: 'badge-admin',
      ladrilho: 'badge-superadmin',
    };
    return (
      <Badge variant="outline" className={classes[forma] || ''}>
        {forma.charAt(0).toUpperCase() + forma.slice(1)}
      </Badge>
    );
  };

  const handleExport = () => {
    if (!stockFiltrado) return;

    const exportData = stockFiltrado.flatMap(item => {
      if (item.stockPorLocal.length === 0) {
        return [{
          IDMM: item.produto.idmm,
          'Tipo de Pedra': item.produto.tipo_pedra,
          'Nome Comercial': item.produto.nome_comercial || '-',
          Forma: item.produto.forma,
          Parque: '-',
          Quantidade: 0,
          'Stock Total': item.stockTotal,
        }];
      }

      return item.stockPorLocal.map(s => ({
        IDMM: item.produto.idmm,
        'Tipo de Pedra': item.produto.tipo_pedra,
        'Nome Comercial': item.produto.nome_comercial || '-',
        Forma: item.produto.forma,
        Parque: s.local.nome,
        Quantidade: s.quantidade,
        'Stock Total': item.stockTotal,
      }));
    });

    exportToExcel(exportData, 'stock-multimarmore');
  };

  const clearFilters = () => {
    setSearchIdmm('');
    setTipoPedraFilter('');
    setFormaFilter('');
    setLocalFilter('');
  };

  const hasFilters = searchIdmm || tipoPedraFilter || formaFilter || localFilter;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Consulta de Stock</h1>
          <p className="text-muted-foreground">Visualize o stock de todos os parques</p>
        </div>
        <Button onClick={handleExport} disabled={!stockFiltrado?.length} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar Excel
        </Button>
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
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Pesquisa IDMM */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por IDMM..."
                value={searchIdmm}
                onChange={(e) => setSearchIdmm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tipo de Pedra */}
            <Select value={tipoPedraFilter} onValueChange={setTipoPedraFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Pedra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {tiposPedra?.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Forma */}
            <Select value={formaFilter} onValueChange={setFormaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="bloco">Bloco</SelectItem>
                <SelectItem value="chapa">Chapa</SelectItem>
                <SelectItem value="ladrilho">Ladrilho</SelectItem>
              </SelectContent>
            </Select>

            {/* Parque */}
            <Select value={localFilter} onValueChange={setLocalFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Parque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os parques</SelectItem>
                {locais?.map(local => (
                  <SelectItem key={local.id} value={local.id}>{local.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Stock */}
      <Card>
        <CardContent className="p-0">
          {stockLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-20" />
                </div>
              ))}
            </div>
          ) : stockFiltrado && stockFiltrado.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="table-zebra">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort('idmm')}
                    >
                      <div className="flex items-center gap-1">
                        IDMM
                        <SortIcon field="idmm" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort('tipo_pedra')}
                    >
                      <div className="flex items-center gap-1">
                        Tipo de Pedra
                        <SortIcon field="tipo_pedra" />
                      </div>
                    </TableHead>
                    <TableHead>Nome Comercial</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort('stockTotal')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Stock Total
                        <SortIcon field="stockTotal" />
                      </div>
                    </TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockFiltrado.map((item) => (
                    <Collapsible key={item.produto.id} asChild>
                      <>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => toggleRow(item.produto.id)}
                              >
                                {expandedRows.has(item.produto.id) ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            {item.produto.idmm}
                          </TableCell>
                          <TableCell>{item.produto.tipo_pedra}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.produto.nome_comercial || '-'}
                          </TableCell>
                          <TableCell>{getFormaBadge(item.produto.forma)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.stockTotal}
                          </TableCell>
                          <TableCell>{getStockBadge(item.stockTotal)}</TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={7} className="py-3">
                              <div className="pl-12">
                                <p className="text-sm font-medium mb-2">Stock por Parque:</p>
                                <div className="flex flex-wrap gap-2">
                                  {item.stockPorLocal.map(s => (
                                    <Badge 
                                      key={s.local.id} 
                                      variant="secondary"
                                      className="text-sm"
                                    >
                                      {s.local.nome}: <span className="font-semibold ml-1">{s.quantidade}</span>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum produto em stock</p>
              <p className="text-sm">Ajuste os filtros ou registe novos movimentos de entrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      {stockFiltrado && stockFiltrado.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          A mostrar {stockFiltrado.length} produto{stockFiltrado.length !== 1 ? 's' : ''} em stock
        </div>
      )}
    </div>
  );
}
