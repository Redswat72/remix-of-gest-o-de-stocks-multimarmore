import { useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { FileSpreadsheet, Filter, Search, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuditoria, useAuditoriaTiposAcao, useAuditoriaUsers, AuditoriaFilters, AuditoriaRecord } from '@/hooks/useAuditoria';
import { exportToExcel } from '@/lib/exportExcel';

const TIPO_ACAO_LABELS: Record<string, string> = {
  criacao_movimento: 'Criação de Movimento',
  cancelamento_movimento: 'Cancelamento de Movimento',
  criacao_produto: 'Criação de Produto',
  edicao_produto: 'Edição de Produto',
  criacao_cliente: 'Criação de Cliente',
  edicao_cliente: 'Edição de Cliente',
  criacao_local: 'Criação de Local',
  edicao_local: 'Edição de Local',
  atribuicao_role: 'Atribuição de Role',
  alteracao_role: 'Alteração de Role',
  alteracao_parque_utilizador: 'Alteração de Parque',
};

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

const ENTIDADE_LABELS: Record<string, string> = {
  movimentos: 'Movimentos',
  produtos: 'Produtos',
  clientes: 'Clientes',
  locais: 'Locais',
  user_roles: 'Roles',
  profiles: 'Perfis',
};

export default function Auditoria() {
  const [filters, setFilters] = useState<AuditoriaFilters>({});
  const [showFilters, setShowFilters] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<AuditoriaRecord | null>(null);
  
  const { data: registos, isLoading, error } = useAuditoria(filters);
  const { data: tiposAcao } = useAuditoriaTiposAcao();
  const { data: users } = useAuditoriaUsers();

  const handleExportExcel = () => {
    if (!registos?.length) return;
    
    const exportData = registos.map(r => ({
      'Data/Hora': format(new Date(r.data_hora), 'dd/MM/yyyy HH:mm:ss', { locale: pt }),
      'Utilizador': r.user_nome,
      'Email': r.user_email,
      'Role': r.user_role,
      'Tipo de Ação': TIPO_ACAO_LABELS[r.tipo_acao] || r.tipo_acao,
      'Entidade': ENTIDADE_LABELS[r.entidade] || r.entidade,
      'ID Entidade': r.entidade_id || '-',
      'Descrição': r.descricao,
    }));
    
    exportToExcel(exportData, 'auditoria');
  };

  const clearFilters = () => {
    setFilters({});
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">Erro ao carregar auditoria: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Auditoria</h1>
          <p className="text-muted-foreground">Registo cronológico de todas as ações do sistema</p>
        </div>
        <Button onClick={handleExportExcel} disabled={!registos?.length}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar Excel
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
                  Filtros
                </CardTitle>
                {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filters.dataInicio || ''}
                  onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value || undefined })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filters.dataFim || ''}
                  onChange={(e) => setFilters({ ...filters, dataFim: e.target.value || undefined })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Utilizador</Label>
                <Select
                  value={filters.userId || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, userId: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de Ação</Label>
                <Select
                  value={filters.tipoAcao || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, tipoAcao: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tiposAcao?.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {TIPO_ACAO_LABELS[tipo] || tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Entidade</Label>
                <Select
                  value={filters.entidade || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, entidade: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="movimentos">Movimentos</SelectItem>
                    <SelectItem value="produtos">Produtos</SelectItem>
                    <SelectItem value="clientes">Clientes</SelectItem>
                    <SelectItem value="locais">Locais</SelectItem>
                    <SelectItem value="user_roles">Roles</SelectItem>
                    <SelectItem value="profiles">Perfis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="lg:col-span-5 flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Tabela de Registos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Registos de Auditoria
            {registos && (
              <Badge variant="secondary" className="ml-2">
                {registos.length} {registos.length === 1 ? 'registo' : 'registos'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">A carregar...</div>
          ) : !registos?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registo de auditoria encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Data/Hora</TableHead>
                    <TableHead className="min-w-[150px]">Utilizador</TableHead>
                    <TableHead className="min-w-[100px]">Role</TableHead>
                    <TableHead className="min-w-[180px]">Tipo de Ação</TableHead>
                    <TableHead className="min-w-[100px]">Entidade</TableHead>
                    <TableHead className="min-w-[300px]">Descrição</TableHead>
                    <TableHead className="w-[80px]">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registos.map((registo) => (
                    <TableRow key={registo.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(registo.data_hora), 'dd/MM/yyyy HH:mm:ss', { locale: pt })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{registo.user_nome}</div>
                          <div className="text-xs text-muted-foreground">{registo.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{registo.user_role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={TIPO_ACAO_COLORS[registo.tipo_acao] || 'bg-gray-100 text-gray-800'}>
                          {TIPO_ACAO_LABELS[registo.tipo_acao] || registo.tipo_acao}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ENTIDADE_LABELS[registo.entidade] || registo.entidade}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate" title={registo.descricao}>
                        {registo.descricao}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecord(registo)}
                        >
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
            <DialogTitle>Detalhes do Registo de Auditoria</DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Data/Hora</Label>
                  <p className="font-mono">
                    {format(new Date(selectedRecord.data_hora), 'dd/MM/yyyy HH:mm:ss', { locale: pt })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ID da Entidade</Label>
                  <p className="font-mono text-sm">{selectedRecord.entidade_id || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Utilizador</Label>
                  <p>{selectedRecord.user_nome}</p>
                  <p className="text-sm text-muted-foreground">{selectedRecord.user_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p>
                    <Badge variant="outline">{selectedRecord.user_role}</Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo de Ação</Label>
                  <p>
                    <Badge className={TIPO_ACAO_COLORS[selectedRecord.tipo_acao] || ''}>
                      {TIPO_ACAO_LABELS[selectedRecord.tipo_acao] || selectedRecord.tipo_acao}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entidade</Label>
                  <p>
                    <Badge variant="secondary">
                      {ENTIDADE_LABELS[selectedRecord.entidade] || selectedRecord.entidade}
                    </Badge>
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="mt-1">{selectedRecord.descricao}</p>
              </div>
              
              {selectedRecord.dados_anteriores && (
                <div>
                  <Label className="text-muted-foreground">Dados Anteriores</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedRecord.dados_anteriores, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedRecord.dados_novos && (
                <div>
                  <Label className="text-muted-foreground">Dados Novos</Label>
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
