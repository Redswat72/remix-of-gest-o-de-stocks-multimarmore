import { useState } from 'react';
import { FileSpreadsheet, Filter, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuditoria, useAuditoriaTiposAcao, useAuditoriaUsers, AuditoriaFilters, AuditoriaRecord } from '@/hooks/useAuditoria';
import { exportToExcel } from '@/lib/exportExcel';
import { useAppT } from '@/hooks/useAppT';
import { formatDateTime } from '@/lib/format';

const TIPO_ACAO_COLORS: Record<string, string> = {
  criacao_movimento: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelamento_movimento: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  criacao_produto: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  edicao_produto: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  criacao_cliente: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  edicao_cliente: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  criacao_local: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  edicao_local: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  atribuicao_role: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  alteracao_role: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  alteracao_parque_utilizador: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
};

export default function Auditoria() {
  const t = useAppT();
  const [filters, setFilters] = useState<AuditoriaFilters>({});
  const [showFilters, setShowFilters] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<AuditoriaRecord | null>(null);

  const { data: registos, isLoading, error } = useAuditoria(filters);
  const { data: tiposAcao } = useAuditoriaTiposAcao();
  const { data: users } = useAuditoriaUsers();

  const getActionLabel = (tipo: string) =>
    t(`audit.actions.${tipo}` as any, { defaultValue: tipo });

  const getEntityLabel = (entidade: string) =>
    t(`audit.entities.${entidade}` as any, { defaultValue: entidade });

  const handleExportExcel = () => {
    if (!registos?.length) return;
    const exportData = registos.map(r => ({
      [t('audit.exportColDateTime')]: formatDateTime(r.data_hora),
      [t('audit.exportColUser')]: r.user_nome,
      [t('audit.exportColEmail')]: r.user_email,
      [t('audit.exportColRole')]: r.user_role,
      [t('audit.exportColActionType')]: getActionLabel(r.tipo_acao),
      [t('audit.exportColEntity')]: getEntityLabel(r.entidade),
      [t('audit.exportColEntityId')]: r.entidade_id || '-',
      [t('audit.exportColDescription')]: r.descricao,
    }));
    exportToExcel(exportData, 'auditoria');
  };

  const clearFilters = () => setFilters({});

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">{t('audit.errorLoad')} {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('audit.title')}</h1>
          <p className="text-muted-foreground">{t('audit.subtitle')}</p>
        </div>
        <Button onClick={handleExportExcel} disabled={!registos?.length}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          {t('audit.exportExcel')}
        </Button>
      </div>

      {/* Filtros */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  {t('audit.filters')}
                </CardTitle>
                {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>{t('audit.labelDateStart')}</Label>
                <Input type="date" value={filters.dataInicio || ''} onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value || undefined })} />
              </div>
              <div className="space-y-2">
                <Label>{t('audit.labelDateEnd')}</Label>
                <Input type="date" value={filters.dataFim || ''} onChange={(e) => setFilters({ ...filters, dataFim: e.target.value || undefined })} />
              </div>
              <div className="space-y-2">
                <Label>{t('audit.labelUser')}</Label>
                <Select value={filters.userId || 'all'} onValueChange={(v) => setFilters({ ...filters, userId: v === 'all' ? undefined : v })}>
                  <SelectTrigger><SelectValue placeholder={t('audit.allUsers')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('audit.allUsers')}</SelectItem>
                    {users?.map((user) => <SelectItem key={user.id} value={user.id}>{user.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('audit.labelActionType')}</Label>
                <Select value={filters.tipoAcao || 'all'} onValueChange={(v) => setFilters({ ...filters, tipoAcao: v === 'all' ? undefined : v })}>
                  <SelectTrigger><SelectValue placeholder={t('audit.allActionTypes')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('audit.allActionTypes')}</SelectItem>
                    {tiposAcao?.map((tipo) => <SelectItem key={tipo} value={tipo}>{getActionLabel(tipo)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('audit.labelEntity')}</Label>
                <Select value={filters.entidade || 'all'} onValueChange={(v) => setFilters({ ...filters, entidade: v === 'all' ? undefined : v })}>
                  <SelectTrigger><SelectValue placeholder={t('audit.allEntities')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('audit.allEntities')}</SelectItem>
                    <SelectItem value="movimentos">{getEntityLabel('movimentos')}</SelectItem>
                    <SelectItem value="produtos">{getEntityLabel('produtos')}</SelectItem>
                    <SelectItem value="clientes">{getEntityLabel('clientes')}</SelectItem>
                    <SelectItem value="locais">{getEntityLabel('locais')}</SelectItem>
                    <SelectItem value="user_roles">{getEntityLabel('user_roles')}</SelectItem>
                    <SelectItem value="profiles">{getEntityLabel('profiles')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-5 flex justify-end">
                <Button variant="outline" onClick={clearFilters}>{t('audit.clearFilters')}</Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Tabela de Registos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t('audit.tableTitle')}
            {registos && (
              <Badge variant="secondary" className="ml-2">
                {t('audit.recordCount_other', { count: registos.length })}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t('audit.loading')}</div>
          ) : !registos?.length ? (
            <div className="text-center py-8 text-muted-foreground">{t('audit.noRecords')}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">{t('audit.colDateTime')}</TableHead>
                    <TableHead className="min-w-[150px]">{t('audit.colUser')}</TableHead>
                    <TableHead className="min-w-[100px]">{t('audit.colRole')}</TableHead>
                    <TableHead className="min-w-[180px]">{t('audit.colActionType')}</TableHead>
                    <TableHead className="min-w-[100px]">{t('audit.colEntity')}</TableHead>
                    <TableHead className="min-w-[300px]">{t('audit.colDescription')}</TableHead>
                    <TableHead className="w-[80px]">{t('audit.colDetails')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registos.map((registo) => (
                    <TableRow key={registo.id}>
                      <TableCell className="font-mono text-sm">{formatDateTime(registo.data_hora)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{registo.user_nome}</div>
                          <div className="text-xs text-muted-foreground">{registo.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{registo.user_role}</Badge></TableCell>
                      <TableCell>
                        <Badge className={TIPO_ACAO_COLORS[registo.tipo_acao] || 'bg-gray-100 text-gray-800'}>
                          {getActionLabel(registo.tipo_acao)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getEntityLabel(registo.entidade)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate" title={registo.descricao}>{registo.descricao}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(registo)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('audit.detailDialogTitle')}</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t('audit.labelDateTime')}</Label>
                  <p className="font-mono">{formatDateTime(selectedRecord.data_hora)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('audit.labelEntityId')}</Label>
                  <p className="font-mono text-sm">{selectedRecord.entidade_id || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('audit.colUser')}</Label>
                  <p>{selectedRecord.user_nome}</p>
                  <p className="text-sm text-muted-foreground">{selectedRecord.user_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('audit.colRole')}</Label>
                  <p><Badge variant="outline">{selectedRecord.user_role}</Badge></p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('audit.colActionType')}</Label>
                  <p><Badge className={TIPO_ACAO_COLORS[selectedRecord.tipo_acao] || ''}>{getActionLabel(selectedRecord.tipo_acao)}</Badge></p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('audit.colEntity')}</Label>
                  <p><Badge variant="secondary">{getEntityLabel(selectedRecord.entidade)}</Badge></p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('audit.labelDescription')}</Label>
                <p className="mt-1">{selectedRecord.descricao}</p>
              </div>
              {selectedRecord.dados_anteriores && (
                <div>
                  <Label className="text-muted-foreground">{t('audit.labelPreviousData')}</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedRecord.dados_anteriores, null, 2)}
                  </pre>
                </div>
              )}
              {selectedRecord.dados_novos && (
                <div>
                  <Label className="text-muted-foreground">{t('audit.labelNewData')}</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedRecord.dados_novos, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
