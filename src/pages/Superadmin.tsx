import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  MapPin, 
  Users, 
  Package, 
  Plus,
  Pencil,
  Check,
  X,
  Loader2,
  FileDown,
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocais, useCreateLocal, useUpdateLocal } from '@/hooks/useLocais';
import { useProfiles, useUpdateProfile, useUpdateUserRole } from '@/hooks/useProfiles';
import { useStockAgregado } from '@/hooks/useStock';
import { exportToExcel } from '@/lib/exportExcel';
import { gerarModeloExcel } from '@/lib/excelTemplateGenerator';
import type { AppRole, LocalFormData } from '@/types/database';

export default function Superadmin() {
  const { toast } = useToast();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Painel Superadmin</h1>
          <p className="text-muted-foreground">Gestão global do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="stock" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock" className="gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Stock Global</span>
          </TabsTrigger>
          <TabsTrigger value="locais" className="gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Parques</span>
          </TabsTrigger>
          <TabsTrigger value="utilizadores" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Utilizadores</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Stock Global */}
        <TabsContent value="stock">
          <StockGlobalTab />
        </TabsContent>

        {/* Tab: Gestão de Parques */}
        <TabsContent value="locais">
          <GestaoLocaisTab />
        </TabsContent>

        {/* Tab: Gestão de Utilizadores */}
        <TabsContent value="utilizadores">
          <GestaoUtilizadoresTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// === Botão de Importação ===
function ImportarButton() {
  const navigate = useNavigate();
  return (
    <Button 
      variant="outline" 
      onClick={() => navigate('/importar-inventario')}
      className="gap-2"
    >
      <Upload className="h-4 w-4" />
      <span className="hidden sm:inline">Importar Inventário</span>
      <span className="sm:hidden">Importar</span>
    </Button>
  );
}

// === Stock Global Tab ===
function StockGlobalTab() {
  const { toast } = useToast();
  const { data: stockAgregado, isLoading } = useStockAgregado();
  const { data: locais } = useLocais({ ativo: true });

  const handleExport = () => {
    if (!stockAgregado || !locais) return;

    const exportData = stockAgregado.map(item => {
      const row: Record<string, string | number> = {
        'IDMM': item.produto.idmm,
        'Tipo de Pedra': item.produto.tipo_pedra,
        'Nome Comercial': item.produto.nome_comercial || '-',
        'Forma': item.produto.forma,
      };

      // Adicionar colunas dinâmicas para cada parque
      locais.forEach(local => {
        const stockLocal = item.stockPorLocal.find(s => s.local.id === local.id);
        row[local.nome] = stockLocal?.quantidade || 0;
      });

      row['Stock Total'] = item.stockTotal;
      return row;
    });

    exportToExcel(exportData, 'stock-global-multimarmore');
  };

  const handleDownloadTemplate = () => {
    try {
      gerarModeloExcel({ incluirExemplos: true });
      toast({
        title: 'Modelo descarregado',
        description: 'O modelo de importação foi guardado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o modelo de importação.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Stock Global da Empresa</CardTitle>
            <CardDescription>Visão agregada de todos os parques</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadTemplate}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Modelo Excel</span>
              <span className="sm:hidden">Modelo</span>
            </Button>
            <ImportarButton />
            <Button 
              onClick={handleExport} 
              disabled={!stockAgregado?.length}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Exportar</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {stockAgregado && stockAgregado.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IDMM</TableHead>
                  <TableHead>Tipo de Pedra</TableHead>
                  <TableHead>Forma</TableHead>
                  {locais?.map(local => (
                    <TableHead key={local.id} className="text-center">
                      {local.nome}
                    </TableHead>
                  ))}
                  <TableHead className="text-right font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockAgregado.map(item => (
                  <TableRow key={item.produto.id}>
                    <TableCell className="font-mono font-medium">
                      {item.produto.idmm}
                    </TableCell>
                    <TableCell>{item.produto.tipo_pedra}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.produto.forma}</Badge>
                    </TableCell>
                    {locais?.map(local => {
                      const stockLocal = item.stockPorLocal.find(s => s.local.id === local.id);
                      return (
                        <TableCell key={local.id} className="text-center">
                          {stockLocal?.quantidade || 0}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-bold">
                      {item.stockTotal}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum produto em stock</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// === Gestão de Locais Tab ===
function GestaoLocaisTab() {
  const { toast } = useToast();
  const { data: locais, isLoading } = useLocais();
  const createLocal = useCreateLocal();
  const updateLocal = useUpdateLocal();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LocalFormData>({ codigo: '', nome: '', morada: '' });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ codigo: '', nome: '', morada: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (local: { id: string; codigo: string; nome: string; morada: string | null }) => {
    setEditingId(local.id);
    setFormData({ codigo: local.codigo, nome: local.nome, morada: local.morada || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.codigo.trim() || !formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Código e nome são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingId) {
        await updateLocal.mutateAsync({ id: editingId, data: formData });
        toast({ title: 'Parque atualizado', description: 'As alterações foram guardadas.' });
      } else {
        await createLocal.mutateAsync(formData);
        toast({ title: 'Parque criado', description: 'O novo parque foi criado com sucesso.' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    try {
      await updateLocal.mutateAsync({ id, data: { ativo } });
      toast({ 
        title: ativo ? 'Parque ativado' : 'Parque desativado',
        description: `O parque foi ${ativo ? 'ativado' : 'desativado'} com sucesso.`
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestão de Parques</CardTitle>
          <CardDescription>Adicione e configure os parques/armazéns</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Parque
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Parque' : 'Novo Parque'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Altere os dados do parque.' : 'Preencha os dados para criar um novo parque.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  placeholder="Ex: P1"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Parque 1"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Morada</Label>
                <Input
                  placeholder="Morada do parque"
                  value={formData.morada}
                  onChange={(e) => setFormData({ ...formData, morada: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={createLocal.isPending || updateLocal.isPending}
              >
                {(createLocal.isPending || updateLocal.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span className="ml-2">Guardar</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : locais && locais.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Morada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locais.map(local => (
                <TableRow key={local.id} className={!local.ativo ? 'opacity-50' : ''}>
                  <TableCell className="font-mono font-medium">{local.codigo}</TableCell>
                  <TableCell>{local.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{local.morada || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={local.ativo}
                        onCheckedChange={(checked) => handleToggleAtivo(local.id, checked)}
                      />
                      <span className="text-sm">{local.ativo ? 'Ativo' : 'Inativo'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(local)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum parque criado</p>
            <Button variant="link" onClick={handleOpenNew}>
              Criar primeiro parque
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// === Gestão de Utilizadores Tab ===
function GestaoUtilizadoresTab() {
  const { toast } = useToast();
  const { data: profiles, isLoading } = useProfiles();
  const { data: locais } = useLocais({ ativo: true });
  const updateProfile = useUpdateProfile();
  const updateUserRole = useUpdateUserRole();

  const handleRoleChange = async (userId: string, role: AppRole) => {
    try {
      await updateUserRole.mutateAsync({ userId, role });
      toast({ title: 'Role atualizada', description: 'A role do utilizador foi alterada.' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      });
    }
  };

  const handleLocalChange = async (userId: string, localId: string | null) => {
    try {
      await updateProfile.mutateAsync({ userId, data: { local_id: localId } });
      toast({ title: 'Parque atualizado', description: 'O parque do utilizador foi alterado.' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAtivo = async (userId: string, ativo: boolean) => {
    try {
      await updateProfile.mutateAsync({ userId, data: { ativo } });
      toast({ 
        title: ativo ? 'Utilizador ativado' : 'Utilizador desativado',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: AppRole) => {
    const variants: Record<AppRole, string> = {
      superadmin: 'bg-destructive text-destructive-foreground',
      admin: 'bg-primary text-primary-foreground',
      operador: 'bg-secondary text-secondary-foreground',
    };
    return <Badge className={variants[role]}>{role}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Utilizadores</CardTitle>
        <CardDescription>Configure roles e parques dos utilizadores</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : profiles && profiles.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Parque</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map(profile => {
                  const currentRole = profile.user_roles?.[0]?.role || 'operador';
                  return (
                    <TableRow key={profile.id} className={!profile.ativo ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{profile.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                      <TableCell>
                        <Select 
                          value={currentRole} 
                          onValueChange={(v) => handleRoleChange(profile.user_id, v as AppRole)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="operador">Operador</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">Superadmin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={profile.local_id || 'none'} 
                          onValueChange={(v) => handleLocalChange(profile.user_id, v === 'none' ? null : v)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Sem parque" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem parque</SelectItem>
                            {locais?.map(local => (
                              <SelectItem key={local.id} value={local.id}>
                                {local.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={profile.ativo}
                            onCheckedChange={(checked) => handleToggleAtivo(profile.user_id, checked)}
                          />
                          <span className="text-sm">{profile.ativo ? 'Ativo' : 'Inativo'}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum utilizador registado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
