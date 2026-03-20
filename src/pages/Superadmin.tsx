import { useState, useMemo } from "react";
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
import { useStockUnificado } from "@/hooks/useStockUnificado";
import { exportToExcel } from "@/lib/exportExcel";
import { gerarModeloExcel } from "@/lib/excelTemplateGenerator";
import { useEmpresa } from "@/context/EmpresaContext";
import AddUserModal from "@/components/AddUserModal";
import type { AppRole, LocalFormData } from "@/types/database";
import ExportLojaButton from "@/components/ExportLojaButton";
import {
  Shield, MapPin, Users, Package, Plus, Pencil, Check, Loader2,
  FileDown, FileSpreadsheet, Upload, UserPlus, Power, PowerOff, RefreshCw, Clock,
  Store, ExternalLink,
} from "lucide-react";
import { useSupabaseEmpresa } from "@/hooks/useSupabaseEmpresa";
import { useQueryClient } from "@tanstack/react-query";

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
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Use unified inventory (blocos + chapas + ladrilho) instead of just produtos/stock
  const { data: items, isLoading, allBlocos, allChapas, allLadrilho } = useStockUnificado();
  useLocais({ ativo: true }); // keep the query warm for recalculation
  const [recalculating, setRecalculating] = useState(false);
  const [formaFilter, setFormaFilter] = useState<string>('all');

  // Filter by forma
  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (formaFilter === 'all') return items;
    return items.filter(i => i.forma === formaFilter);
  }, [items, formaFilter]);

  // Summary stats
  const summary = useMemo(() => {
    const all = items || [];
    return {
      totalItems: all.length,
      blocos: allBlocos.length,
      chapas: allChapas.length,
      ladrilho: allLadrilho.length,
      valorTotal: all.reduce((sum, i) => sum + (i.valor || 0), 0),
    };
  }, [items, allBlocos, allChapas, allLadrilho]);

  const handleRecalcularStock = async () => {
    setRecalculating(true);
    try {
      const { data: movimentos, error: movError } = await supabase
        .from('movimentos')
        .select('produto_id, tipo, quantidade, local_origem_id, local_destino_id')
        .eq('cancelado', false);

      if (movError) throw movError;

      const stockMap = new Map<string, number>();
      const key = (prodId: string, localId: string) => `${prodId}|${localId}`;

      for (const m of movimentos || []) {
        if (m.tipo === 'entrada' && m.local_destino_id) {
          const k = key(m.produto_id, m.local_destino_id);
          stockMap.set(k, (stockMap.get(k) || 0) + m.quantidade);
        } else if (m.tipo === 'transferencia') {
          if (m.local_origem_id) {
            const k = key(m.produto_id, m.local_origem_id);
            stockMap.set(k, (stockMap.get(k) || 0) - m.quantidade);
          }
          if (m.local_destino_id) {
            const k = key(m.produto_id, m.local_destino_id);
            stockMap.set(k, (stockMap.get(k) || 0) + m.quantidade);
          }
        } else if (m.tipo === 'saida' && m.local_origem_id) {
          const k = key(m.produto_id, m.local_origem_id);
          stockMap.set(k, (stockMap.get(k) || 0) - m.quantidade);
        }
      }

      const { data: existingStock, error: stockError } = await supabase
        .from('stock')
        .select('id, produto_id, local_id, quantidade');
      if (stockError) throw stockError;

      const existingMap = new Map<string, { id: string; quantidade: number }>();
      for (const s of existingStock || []) {
        existingMap.set(key(s.produto_id, s.local_id), { id: s.id, quantidade: s.quantidade });
      }

      let updated = 0;
      let inserted = 0;
      for (const [k, qty] of stockMap.entries()) {
        const [prodId, localId] = k.split('|');
        const existing = existingMap.get(k);
        if (existing) {
          if (existing.quantidade !== qty) {
            const { error } = await supabase
              .from('stock')
              .update({ quantidade: qty })
              .eq('id', existing.id);
            if (error) console.error('Update error:', error);
            else updated++;
          }
          existingMap.delete(k);
        } else if (qty !== 0) {
          const { error } = await supabase
            .from('stock')
            .insert({ produto_id: prodId, local_id: localId, quantidade: qty });
          if (error) console.error('Insert error:', error);
          else inserted++;
        }
      }

      let zeroed = 0;
      for (const [, { id, quantidade }] of existingMap.entries()) {
        if (quantidade !== 0) {
          await supabase.from('stock').update({ quantidade: 0 }).eq('id', id);
          zeroed++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['stock-agregado'] });
      queryClient.invalidateQueries({ queryKey: ['stock-produto'] });

      toast({
        title: 'Stock recalculado',
        description: `${movimentos?.length || 0} movimentos processados. ${updated} actualizados, ${inserted} inseridos, ${zeroed} zerados.`,
      });
    } catch (error) {
      console.error('Erro ao recalcular stock:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao recalcular stock',
        variant: 'destructive',
      });
    } finally {
      setRecalculating(false);
    }
  };

  const FORMA_LABELS: Record<string, string> = { bloco: 'Bloco', chapa: 'Chapa', ladrilho: 'Ladrilho' };
  const FORMA_COLORS: Record<string, string> = {
    bloco: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    chapa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    ladrilho: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  };

  const formatNumber = (value: number | null, decimals = 2) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '—';
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleExport = () => {
    if (!filteredItems.length) return;
    const exportData = filteredItems.map((item) => ({
      [empresaConfig?.idPrefix ?? "IDMM"]: item.referencia,
      "Forma": FORMA_LABELS[item.forma] || item.forma,
      "Variedade": item.variedade || "-",
      "Parque": item.parque,
      "Quantidade": item.quantidade,
      "Unidade": item.unidade,
      "Valor (€)": item.valor ?? 0,
    }));
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFormaFilter('all')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{summary.totalItems}</p>
            <p className="text-xs text-muted-foreground">Total Registos</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFormaFilter('bloco')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{summary.blocos}</p>
            <p className="text-xs text-muted-foreground">Blocos</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFormaFilter('chapa')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{summary.chapas}</p>
            <p className="text-xs text-muted-foreground">Chapas</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFormaFilter('ladrilho')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{summary.ladrilho}</p>
            <p className="text-xs text-muted-foreground">Ladrilhos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{formatCurrency(summary.valorTotal)}</p>
            <p className="text-xs text-muted-foreground">Valor Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>
                Stock Global — {formaFilter === 'all' ? 'Todos' : FORMA_LABELS[formaFilter]}
                <span className="ml-2 text-sm font-normal text-muted-foreground">({filteredItems.length} registos)</span>
              </CardTitle>
              <CardDescription>Visão unificada de blocos, chapas e ladrilhos</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleRecalcularStock}
                disabled={recalculating}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{recalculating ? 'Recalculando...' : 'Recalcular Stock'}</span>
              </Button>
              <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Modelo Excel</span>
              </Button>
              <ImportarButton />
              <ExportLojaButton />
              <Button onClick={handleExport} disabled={!filteredItems.length} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar Excel</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Forma</TableHead>
                    <TableHead>{empresaConfig?.idPrefix ?? "IDMM"}</TableHead>
                    <TableHead>Variedade</TableHead>
                    <TableHead>Parque</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Valor (€)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow
                      key={`${item.forma}-${item.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/inventario/${item.forma}/${item.id}`)}
                    >
                      <TableCell>
                        <Badge className={FORMA_COLORS[item.forma]}>{FORMA_LABELS[item.forma]}</Badge>
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        {item.forma === 'bloco' ? (item.idMm || item.referencia) : item.referencia}
                      </TableCell>
                      <TableCell>{item.variedade || '—'}</TableCell>
                      <TableCell>{item.parque}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.quantidade)} {item.unidade}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.valor)}</TableCell>
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
    </div>
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
  const { users, isLoading, error, atualizarRole, toggleAtivo } = useUsers();

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

  return (
    <div className="space-y-6">
      {/* Header - always visible */}
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

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-destructive text-sm">
            <p className="font-medium">Erro ao carregar utilizadores:</p>
            <p>{(error as Error).message}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Utilizadores Pendentes / Inativos - shown first for visibility */}
          {usersInativos.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Pendentes de Aprovação / Inativos ({usersInativos.length})
                </CardTitle>
                <CardDescription>Utilizadores que se registaram e aguardam ativação</CardDescription>
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
                        <TableRow key={user.id} className="opacity-70">
                          <TableCell className="font-medium">{user.nome}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>{getRoleBadge(role)}</TableCell>
                          <TableCell>
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
                                variant="default"
                                size="sm"
                                className="gap-1"
                                onClick={() => toggleAtivo.mutate({ userId: user.user_id, ativo: true })}
                              >
                                <Check className="w-3 h-3" />
                                Aprovar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Utilizadores Ativos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Power className="w-4 h-4 text-green-500" />
                Utilizadores Ativos ({usersAtivos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersAtivos.length > 0 ? (
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum utilizador ativo encontrado</p>
                  <p className="text-xs mt-1">Adicione um colaborador usando o botão acima</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AddUserModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
