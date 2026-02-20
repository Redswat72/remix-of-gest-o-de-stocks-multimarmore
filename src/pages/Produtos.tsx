import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Grid, List, ChevronDown, ChevronUp, Loader2, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useStockUnificado, type FormaInventario, type ItemUnificado } from '@/hooks/useStockUnificado';
import { useEmpresa } from '@/context/EmpresaContext';

const FORMA_LABELS: Record<string, string> = {
  bloco: 'Bloco',
  chapa: 'Chapa',
  ladrilho: 'Ladrilho',
};

const FORMA_COLORS: Record<string, string> = {
  bloco: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  chapa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ladrilho: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

const formatCurrency = (value: number | null) => {
  if (!value) return '—';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatNumber = (value: number | null, decimals = 2) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
};

export default function Produtos() {
  const navigate = useNavigate();
  const { empresaConfig } = useEmpresa();
  const [search, setSearch] = useState('');
  const [formaFilter, setFormaFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: items, isLoading } = useStockUnificado({
    forma: formaFilter === 'all' ? undefined : formaFilter as FormaInventario,
    busca: search || undefined,
  });

  const clearFilters = () => {
    setSearch('');
    setFormaFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Produtos</h1>
          <p className="text-muted-foreground">Todos os blocos, chapas e ladrilhos</p>
        </div>
      </div>

      {/* Filtros */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
                {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 lg:col-span-2">
                <Label>Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ID, variedade, parque..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Forma</Label>
                <Select value={formaFilter} onValueChange={setFormaFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="bloco">Bloco</SelectItem>
                    <SelectItem value="chapa">Chapa</SelectItem>
                    <SelectItem value="ladrilho">Ladrilho</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex gap-2 items-end">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={clearFilters} className="ml-auto">
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !items?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            Nenhum produto encontrado
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <InventarioCard key={`${item.forma}-${item.id}`} item={item} onClick={() => navigate(`/inventario/${item.forma}/${item.id}`)} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Forma</TableHead>
                    <TableHead>ID / Referência</TableHead>
                    <TableHead>Variedade</TableHead>
                    <TableHead>Parque</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Valor (€)</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={`${item.forma}-${item.id}`}>
                      <TableCell>
                        <Badge className={FORMA_COLORS[item.forma]}>{FORMA_LABELS[item.forma]}</Badge>
                      </TableCell>
                      <TableCell className="font-mono font-medium">{item.referencia}</TableCell>
                      <TableCell>{item.variedade || '—'}</TableCell>
                      <TableCell>{item.parque}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.quantidade)} {item.unidade}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.valor)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/inventario/${item.forma}/${item.id}`)}>
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {items && items.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          A mostrar {items.length} produto{items.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

function InventarioCard({ item, onClick }: { item: ItemUnificado; onClick: () => void }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="relative aspect-video bg-muted flex items-center justify-center">
        <Package className="h-12 w-12 text-muted-foreground/30" />
        <Badge className={`absolute top-2 left-2 ${FORMA_COLORS[item.forma]}`}>
          {FORMA_LABELS[item.forma]}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-bold text-lg">{item.referencia}</h3>
          <p className="text-sm text-muted-foreground">{item.variedade || '—'}</p>
        </div>
        <div className="space-y-1 text-sm mb-4">
          <p><span className="text-muted-foreground">Parque:</span> {item.parque}</p>
          <p><span className="text-muted-foreground">Quantidade:</span> {formatNumber(item.quantidade)} {item.unidade}</p>
          {item.valor != null && (
            <p><span className="text-muted-foreground">Valor:</span> {formatCurrency(item.valor)}</p>
          )}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={e => { e.stopPropagation(); onClick(); }}>
          Ver Ficha
        </Button>
      </CardContent>
    </Card>
  );
}
