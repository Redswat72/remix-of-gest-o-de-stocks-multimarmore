import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUsers, type User } from "@/hooks/useUsers";
import { useLocais, useCreateLocal, useUpdateLocal } from "@/hooks/useLocais";
import { useStockAgregado } from "@/hooks/useStock";
import { exportToExcel } from "@/lib/exportExcel";
import { gerarModeloExcel } from "@/lib/excelTemplateGenerator";
import { useEmpresa } from "@/context/EmpresaContext";
import AddUserModal from "@/components/AddUserModal";
import type { AppRole, LocalFormData } from "@/types/database";
import {
  Shield, MapPin, Users, Package, Plus, Pencil, Check, Loader2,
  FileDown, FileSpreadsheet, Upload, UserPlus, Power, PowerOff,
} from "lucide-react";

export default function Superadmin() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Painel Superadmin</h1>
          <p className="text-muted-foreground">Gestão global do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="utilizadores" className="space-y-6">
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

        <TabsContent value="stock">
          <StockGlobalTab />
        </TabsContent>
        <TabsContent value="locais">
          <GestaoLocaisTab />
        </TabsContent>
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
    <Button variant="outline" onClick={() => navigate("/importar-inventario")} className="gap-2">
      <Upload className="h-4 w-4" />
      <span className="hidden sm:inline">Importar Inventário</span>
      <span className="sm:hidden">Importar</span>
    </Button>
  );
}

// === Stock Global Tab ===
function StockGlobalTab() {
  const { toast } = useToast();
  const { empresaConfig } = useEmpresa();
  const { data: stockAgregado, isLoading } = useStockAgregado();
  const { data: locais } = useLocais({ ativo: true });

  const handleExport = () => {
    if (!stockAgregado || !locais) return;
    const exportData = stockAgregado.map((item) => {
      const row: Record<string, string | number> = {
        [empresaConfig?.idPrefix ?? "IDMM"]: item.produto.idmm,
        "Tipo de Pedra": item.produto.tipo_pedra,
        "Nome Comercial": item.produto.nome_comercial || "-",
        Forma: item.produto.forma,
      };
      locais.forEach((local) => {
        const stockLocal = item.stockPorLocal.find((s) => s.local.id === local.id);
        row[local.nome] = stockLocal?.quantidade || 0;
      });
      row["Stock Total"] = item.stockTotal;
      return row;
    });
    exportToExcel(exportData, `stock-global-${empresaConfig?.id ?? "empresa"}`);
  };

  const handleDownloadTemplate = () => {
    try {
      gerarModeloExcel({ incluirExemplos: true, tipo: "blocos" });
      toast({ title: "Modelo descarregado", description: "O modelo de importação foi guardado com sucesso." });
    } catch (err) {
      console.error('Erro ao gerar modelo Excel:', err);
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: "Erro", description: `Não foi possível gerar o modelo: ${msg}`, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
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
            <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Modelo Excel</span>
              <span className="sm:hidden">Modelo</span>
            </Button>
            <ImportarButton />
            <Button onClick={handleExport} disabled={!stockAgregado?.length} className="gap-2">
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
                  <TableHead>{empresaConfig?.idPrefix ?? "IDMM"}</TableHead>
                  <TableHead>Tipo de Pedra</TableHead>
                  <TableHead>Forma</TableHead>
                  {locais?.map((local) => (
                    <TableHead key={local.id} className="text-center">{local.nome}</TableHead>
                  ))}
                  <TableHead className="text-right font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockAgregado.map((item) => (
                  <TableRow key={item.produto.id}>
                    <TableCell className="font-mono font-medium">{item.produto.idmm}</TableCell>
                    <TableCell>{item.produto.tipo_pedra}</TableCell>
                    <TableCell><Badge variant="outline">{item.produto.forma}</Badge></TableCell>
                    {locais?.map((local) => {
                      const stockLocal = item.stockPorLocal.find((s) => s.local.id === local.id);
                      return <TableCell key={local.id} className="text-center">{stockLocal?.quantidade || 0}</TableCell>;
                    })}
                    <TableCell className="text-right font-bold">{item.stockTotal}</TableCell>
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
  const [formData, setFormData] = useState<LocalFormData>({ codigo: "", nome: "", morada: "" });

  const handleOpenNew = () => { setEditingId(null); setFormData({ codigo: "", nome: "", morada: "" }); setDialogOpen(true); };
  const handleOpenEdit = (local: { id: string; codigo: string; nome: string; morada: string | null }) => {
    setEditingId(local.id); setFormData({ codigo: local.codigo, nome: local.nome, morada: local.morada || "" }); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.codigo.trim() || !formData.nome.trim()) {
      toast({ title: "Erro", description: "Código e nome são obrigatórios.", variant: "destructive" }); return;
    }
    try {
      if (editingId) {
        await updateLocal.mutateAsync({ id: editingId, data: formData });
        toast({ title: "Parque atualizado", description: "As alterações foram guardadas." });
      } else {
        await createLocal.mutateAsync(formData);
        toast({ title: "Parque criado", description: "O novo parque foi criado com sucesso." });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Ocorreu um erro inesperado", variant: "destructive" });
    }
  };

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    try {
      await updateLocal.mutateAsync({ id, data: { ativo } });
      toast({ title: ativo ? "Parque ativado" : "Parque desativado" });
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Ocorreu um erro", variant: "destructive" });
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
            <Button onClick={handleOpenNew} className="gap-2"><Plus className="w-4 h-4" />Novo Parque</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Parque" : "Novo Parque"}</DialogTitle>
              <DialogDescription>{editingId ? "Altere os dados do parque." : "Preencha os dados para criar um novo parque."}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input placeholder="Ex: P1" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input placeholder="Ex: Parque 1" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Morada</Label>
                <Input placeholder="Morada do parque" value={formData.morada} onChange={(e) => setFormData({ ...formData, morada: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={createLocal.isPending || updateLocal.isPending}>
                {(createLocal.isPending || updateLocal.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span className="ml-2">Guardar</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
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
              {locais.map((local) => (
                <TableRow key={local.id} className={!local.ativo ? "opacity-50" : ""}>
                  <TableCell className="font-mono font-medium">{local.codigo}</TableCell>
                  <TableCell>{local.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{local.morada || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={local.ativo} onCheckedChange={(checked) => handleToggleAtivo(local.id, checked)} />
                      <span className="text-sm">{local.ativo ? "Ativo" : "Inativo"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(local)}><Pencil className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum parque criado</p>
            <Button variant="link" onClick={handleOpenNew}>Criar primeiro parque</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// === Gestão de Utilizadores Tab ===
function GestaoUtilizadoresTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const { users, isLoading, atualizarRole, toggleAtivo } = useUsers();

  const getUserRole = (user: User): AppRole => {
    return user.user_roles?.[0]?.role ?? "operador";
  };

  const usersAtivos = users?.filter((u) => u.ativo) || [];
  const usersInativos = users?.filter((u) => !u.ativo) || [];

  const getRoleBadge = (role: AppRole) => {
    const variants: Record<AppRole, string> = {
      superadmin: "bg-destructive text-destructive-foreground",
      admin: "bg-primary text-primary-foreground",
      operador: "bg-secondary text-secondary-foreground",
    };
    return <Badge className={variants[role]}>{role}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Gestão de Utilizadores</h2>
          <p className="text-sm text-muted-foreground">Gerir colaboradores e permissões</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Adicionar Colaborador
        </Button>
      </div>

      {/* Utilizadores Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="w-4 h-4 text-green-500" />
            Utilizadores Ativos ({usersAtivos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Parque</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersAtivos.map((user) => {
                const role = getUserRole(user);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{(user as any).local?.nome || "—"}</TableCell>
                    <TableCell>{getRoleBadge(role)}</TableCell>
                    <TableCell>
                      {role !== "superadmin" && (
                        <div className="flex items-center gap-2">
                          <Select
                            value={role}
                            onValueChange={(value: string) =>
                              atualizarRole.mutate({ userId: user.user_id, role: value as AppRole })
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="operador">Operador</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Desativar"
                            onClick={() => toggleAtivo.mutate({ userId: user.user_id, ativo: false })}
                          >
                            <PowerOff className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Utilizadores Inativos */}
      {usersInativos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PowerOff className="w-4 h-4 text-muted-foreground" />
              Utilizadores Inativos ({usersInativos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Permissão</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersInativos.map((user) => {
                  const role = getUserRole(user);
                  return (
                    <TableRow key={user.id} className="opacity-60">
                      <TableCell>{user.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(role)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => toggleAtivo.mutate({ userId: user.user_id, ativo: true })}
                        >
                          <Power className="w-3 h-3" />
                          Reativar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AddUserModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
