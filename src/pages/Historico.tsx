import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  History, 
  Filter, 
  Download, 
  ArrowDownToLine,
  ArrowRightLeft,
  Package,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMovimentos, useCancelMovimento, type MovimentoComDetalhes } from '@/hooks/useMovimentos';
import { useLocaisAtivos } from '@/hooks/useLocais';
import { useProfiles } from '@/hooks/useProfiles';
import { exportToExcel } from '@/lib/exportExcel';

export default function Historico() {
  const { toast } = useToast();
  const { isAdmin, userLocal } = useAuth();
  const cancelMovimento = useCancelMovimento();

  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('__all__');
  const [localFilter, setLocalFilter] = useState<string>('__all__');
  const [idMmFilter, setIdMmFilter] = useState('');
  const [showCancelados, setShowCancelados] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 50;
  
  // UI State
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedMovimento, setSelectedMovimento] = useState<MovimentoComDetalhes | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  // For non-admin users, always filter by their local
  const effectiveLocalFilter = !isAdmin && userLocal ? userLocal.id : (localFilter === '__all__' ? undefined : localFilter);

  // Data
  const { data: result, isLoading } = useMovimentos({
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
    tipo: tipoFilter === '__all__' ? undefined : tipoFilter,
    localId: effectiveLocalFilter,
    idMm: idMmFilter.trim() || undefined,
    cancelados: showCancelados === 'todos' ? undefined : showCancelados === 'sim',
    limit: PAGE_SIZE,
    page: currentPage,
  });

  const movimentos = result?.data;
  const totalCount = result?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const { data: locais } = useLocaisAtivos();
  const { data: profiles } = useProfiles();

  // Build lookup maps
  const locaisMap = useMemo(() => {
    const map = new Map<string, string>();
    locais?.forEach(l => map.set(l.id, l.nome));
    return map;
  }, [locais]);

  const profilesMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles?.forEach(p => map.set(p.user_id, p.nome));
    return map;
  }, [profiles]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <ArrowDownToLine className="w-4 h-4 text-success" />;
      case 'transferencia':
        return <ArrowRightLeft className="w-4 h-4 text-warning" />;
      case 'saida':
        return <Package className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const classes: Record<string, string> = {
      entrada: 'badge-entrada',
      transferencia: 'badge-transferencia',
      saida: 'badge-saida',
    };
    const labels: Record<string, string> = {
      entrada: 'Entrada',
      transferencia: 'Transferência',
      saida: 'Saída',
    };
    return (
      <Badge variant="outline" className={classes[tipo]}>
        {labels[tipo]}
      </Badge>
    );
  };

  const getLocalNome = (localId?: string | null) => {
    if (!localId) return '-';
    return locaisMap.get(localId) || localId.substring(0, 8) + '…';
  };

  const getOperadorNome = (operadorId: string) => {
    return profilesMap.get(operadorId) || operadorId.substring(0, 8) + '…';
  };

  const getPercursoLabel = (mov: MovimentoComDetalhes) => {
    const origem = getLocalNome(mov.local_origem_id);
    const destino = getLocalNome(mov.local_destino_id);

    if (mov.tipo === 'entrada') return `→ ${destino}`;
    if (mov.tipo === 'saida') return `${origem} →`;
    if (mov.tipo === 'transferencia') return `${origem} → ${destino}`;

    return '-';
  };

  const handleCancelClick = (mov: MovimentoComDetalhes) => {
    setSelectedMovimento(mov);
    setMotivoCancelamento('');
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedMovimento || !motivoCancelamento.trim()) {
      toast({
        title: 'Erro',
        description: 'Indique o motivo do cancelamento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await cancelMovimento.mutateAsync({
        movimentoId: selectedMovimento.id,
        motivo: motivoCancelamento.trim(),
      });
      toast({
        title: 'Movimento cancelado',
        description: 'O movimento foi cancelado e o stock foi revertido.',
      });
      setCancelDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao cancelar',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    if (!movimentos) return;

    const exportData = movimentos.map(mov => ({
      'Data': format(new Date(mov.data_movimento), 'dd/MM/yyyy HH:mm', { locale: pt }),
      'Tipo': mov.tipo === 'entrada' ? 'Entrada' : mov.tipo === 'saida' ? 'Saída' : 'Transferência',
      'ID MM': mov.id_mm || '—',
      'Tipo Produto': mov.tipo_produto || '—',
      'Quantidade': mov.quantidade,
      'Origem': getLocalNome(mov.local_origem_id),
      'Destino': getLocalNome(mov.local_destino_id),
      'Cliente': '-',
      'Documento': mov.tipo_documento,
      'Nº Documento': mov.numero_documento || '-',
      'Matrícula': mov.matricula_viatura || '-',
      'Operador': getOperadorNome(mov.operador_id),
      'Cancelado': mov.cancelado ? 'Sim' : 'Não',
      'Motivo Cancelamento': mov.motivo_cancelamento || '-',
    }));

    exportToExcel(exportData, 'historico-movimentos');
  };

  const clearFilters = () => {
    setDataInicio('');
    setDataFim('');
    setTipoFilter('__all__');
    setLocalFilter('__all__');
    setIdMmFilter('');
    setShowCancelados('todos');
    setCurrentPage(0);
  };

  // Reset page when filters change
  const handleFilterChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (value: T) => {
    setter(value);
    setCurrentPage(0);
  };

  const hasFilters = dataInicio || dataFim || tipoFilter !== '__all__' || localFilter !== '__all__' || idMmFilter || showCancelados !== 'todos';
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Movimentos</h1>
          <p className="text-muted-foreground">Consulte todos os movimentos registados</p>
        </div>
        <Button onClick={handleExport} disabled={!movimentos?.length} className="gap-2">
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {/* Data Início */}
            <div className="space-y-2">
              <Label className="text-sm">Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => handleFilterChange(setDataInicio)(e.target.value)}
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <Label className="text-sm">Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => handleFilterChange(setDataFim)(e.target.value)}
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label className="text-sm">Tipo</Label>
              <Select value={tipoFilter} onValueChange={handleFilterChange(setTipoFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ID MM */}
            <div className="space-y-2">
              <Label className="text-sm">ID MM</Label>
              <Input
                placeholder="Pesquisar ID MM..."
                value={idMmFilter}
                onChange={(e) => handleFilterChange(setIdMmFilter)(e.target.value)}
              />
            </div>

            {/* Parque - only for admins */}
            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-sm">Parque</Label>
                <Select value={localFilter} onValueChange={handleFilterChange(setLocalFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {locais?.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Cancelados */}
            <div className="space-y-2">
              <Label className="text-sm">Cancelados</Label>
              <Select value={showCancelados} onValueChange={handleFilterChange(setShowCancelados)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="nao">Apenas ativos</SelectItem>
                  <SelectItem value="sim">Apenas cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          ) : movimentos && movimentos.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="table-zebra">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>ID MM</TableHead>
                    <TableHead>Tipo Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead>Origem → Destino</TableHead>
                    <TableHead>Estado</TableHead>
                    {isAdmin && <TableHead className="w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentos.map((mov) => (
                    <Collapsible key={mov.id} asChild>
                      <>
                        <TableRow className={mov.cancelado ? 'opacity-60 bg-muted/30' : ''}>
                          <TableCell>
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => toggleRow(mov.id)}
                              >
                                {expandedRows.has(mov.id) ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(mov.data_movimento), 'dd/MM/yyyy HH:mm', { locale: pt })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTipoIcon(mov.tipo)}
                              {getTipoBadge(mov.tipo)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-medium">{mov.id_mm || '—'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{mov.tipo_produto || '—'}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {mov.quantidade}
                          </TableCell>
                          <TableCell>
                            <span>{getPercursoLabel(mov)}</span>
                          </TableCell>
                          <TableCell>
                            {mov.cancelado ? (
                              <Badge variant="outline" className="badge-cancelado gap-1">
                                <XCircle className="w-3 h-3" /> Cancelado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="badge-entrada">
                                Ativo
                              </Badge>
                            )}
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              {!mov.cancelado && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleCancelClick(mov)}
                                >
                                  Cancelar
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={isAdmin ? 9 : 8} className="py-4">
                              <div className="pl-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Documento:</span>
                                  <p className="font-medium">
                                    {mov.tipo_documento.replace('_', ' ')}
                                    {mov.numero_documento && ` - ${mov.numero_documento}`}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Operador:</span>
                                  <p className="font-medium">{getOperadorLabel(mov)}</p>
                                </div>
                                {mov.matricula_viatura && (
                                  <div>
                                    <span className="text-muted-foreground">Matrícula:</span>
                                    <p className="font-medium">{mov.matricula_viatura}</p>
                                  </div>
                                )}
                                {mov.observacoes && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <span className="text-muted-foreground">Observações:</span>
                                    <p className="font-medium">{mov.observacoes}</p>
                                  </div>
                                )}
                                {mov.cancelado && mov.motivo_cancelamento && (
                                  <div className="sm:col-span-2 lg:col-span-3 text-destructive">
                                    <span className="flex items-center gap-1">
                                      <AlertTriangle className="w-4 h-4" />
                                      Motivo do cancelamento:
                                    </span>
                                    <p className="font-medium">{mov.motivo_cancelamento}</p>
                                  </div>
                                )}
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
              <History className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum movimento encontrado</p>
              <p className="text-sm">Ajuste os filtros ou registe novos movimentos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            A mostrar {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalCount)} de {totalCount} movimentos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              Página {currentPage + 1} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Seguinte
            </Button>
          </div>
        </div>
      )}

      {movimentos && movimentos.length > 0 && totalPages <= 1 && (
        <div className="text-sm text-muted-foreground text-center">
          A mostrar {movimentos.length} de {totalCount} movimento{totalCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* Dialog de Cancelamento */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Cancelar Movimento
            </DialogTitle>
            <DialogDescription>
              Esta ação irá reverter o stock automaticamente. Esta operação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {selectedMovimento && (
            <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
              <p><strong>Produto:</strong> {selectedMovimento.id_mm || '—'}</p>
              <p><strong>Quantidade:</strong> {selectedMovimento.quantidade}</p>
              <p><strong>Data:</strong> {format(new Date(selectedMovimento.data_movimento), 'dd/MM/yyyy HH:mm', { locale: pt })}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do cancelamento *</Label>
            <Textarea
              id="motivo"
              placeholder="Indique o motivo do cancelamento..."
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Voltar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmCancel}
              disabled={cancelMovimento.isPending || !motivoCancelamento.trim()}
            >
              {cancelMovimento.isPending ? 'A cancelar...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
