import { useState } from 'react';
import { Plus, Search, Filter, Grid, List, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProdutos, useCreateProduto, useUpdateProduto, useDeleteProduto } from '@/hooks/useProdutos';
import { useCreateMovimento } from '@/hooks/useMovimentos';
import { ProdutoForm } from '@/components/produtos/ProdutoForm';
import { ProdutoCard } from '@/components/produtos/ProdutoCard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Produto, TipoMovimento, TipoDocumento } from '@/types/database';
import type { PargaFotos } from '@/components/produtos/ChapaFormSection';

interface Filters {
  search: string;
  forma: string;
  tipoPedra: string;
  ativo: string;
}

const FORMA_LABELS: Record<string, string> = {
  bloco: 'Bloco',
  chapa: 'Chapa',
  ladrilho: 'Ladrilho',
};

export default function Produtos() {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    forma: 'all',
    tipoPedra: '',
    ativo: 'all',
  });
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { roles } = useAuth();
  const { data: produtos, isLoading, error } = useProdutos();
  const createMutation = useCreateProduto();
  const updateMutation = useUpdateProduto();
  const deleteMutation = useDeleteProduto();
  const createMovimentoMutation = useCreateMovimento();
  
  // Verificar se pode carregar fotos HD (admin ou superadmin)
  const canUploadHd = roles.includes('admin') || roles.includes('superadmin');

  // Filtrar produtos
  const filteredProdutos = produtos?.filter((p) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (
        !p.idmm.toLowerCase().includes(search) &&
        !p.tipo_pedra.toLowerCase().includes(search) &&
        !(p.nome_comercial?.toLowerCase().includes(search))
      ) {
        return false;
      }
    }
    if (filters.forma !== 'all' && p.forma !== filters.forma) return false;
    if (filters.tipoPedra && !p.tipo_pedra.toLowerCase().includes(filters.tipoPedra.toLowerCase())) return false;
    if (filters.ativo === 'ativo' && !p.ativo) return false;
    if (filters.ativo === 'inativo' && p.ativo) return false;
    return true;
  });

  const handleSubmit = async (
    data: any, 
    fotoUrls: (string | null)[], 
    fotoHdUrls: (string | null)[],
    pargaFotos?: PargaFotos
  ) => {
    setIsSubmitting(true);
    
    try {
      // Build parga fotos data if provided
      const pargaFotosData = pargaFotos ? {
        parga1_foto1_url: pargaFotos.parga1_foto1_url,
        parga1_foto2_url: pargaFotos.parga1_foto2_url,
        parga2_foto1_url: pargaFotos.parga2_foto1_url,
        parga2_foto2_url: pargaFotos.parga2_foto2_url,
        parga3_foto1_url: pargaFotos.parga3_foto1_url,
        parga3_foto2_url: pargaFotos.parga3_foto2_url,
        parga4_foto1_url: pargaFotos.parga4_foto1_url,
        parga4_foto2_url: pargaFotos.parga4_foto2_url,
      } : {};

      if (editingProduto) {
        // Atualizar produto com URLs das fotos operacionais e HD
        await updateMutation.mutateAsync({
          id: editingProduto.id,
          ...data,
          foto1_url: fotoUrls[0] || null,
          foto2_url: fotoUrls[1] || null,
          foto3_url: fotoUrls[2] || null,
          foto4_url: fotoUrls[3] || null,
          foto1_hd_url: fotoHdUrls[0] || null,
          foto2_hd_url: fotoHdUrls[1] || null,
          foto3_hd_url: fotoHdUrls[2] || null,
          foto4_hd_url: fotoHdUrls[3] || null,
          ...pargaFotosData,
        });
        
        toast({
          title: 'Produto atualizado',
          description: `O produto ${data.idmm} foi atualizado com sucesso.`,
        });
      } else {
        // Criar produto com URLs das fotos
        const novoProduto = await createMutation.mutateAsync({
          ...data,
          foto1_url: fotoUrls[0] || null,
          foto2_url: fotoUrls[1] || null,
          foto3_url: fotoUrls[2] || null,
          foto4_url: fotoUrls[3] || null,
          foto1_hd_url: fotoHdUrls[0] || null,
          foto2_hd_url: fotoHdUrls[1] || null,
          foto3_hd_url: fotoHdUrls[2] || null,
          foto4_hd_url: fotoHdUrls[3] || null,
          ...pargaFotosData,
        });

        // Se foi selecionado um parque, criar movimento de entrada automático
        if (data.local_id && novoProduto?.id) {
          try {
            await createMovimentoMutation.mutateAsync({
              tipo: 'entrada' as TipoMovimento,
              tipo_documento: 'sem_documento' as TipoDocumento,
              produto_id: novoProduto.id,
              quantidade: 1,
              local_destino_id: data.local_id,
              observacoes: 'Entrada automática na criação do produto',
            });
          } catch (movErr: any) {
            console.error('Erro ao criar movimento de entrada:', movErr);
            // Não impedir criação do produto se movimento falhar
            toast({
              title: 'Aviso',
              description: 'Produto criado, mas não foi possível registar a entrada no parque. Registe o movimento manualmente.',
              variant: 'destructive',
            });
          }
        }
        
        toast({
          title: 'Produto criado',
          description: data.local_id 
            ? `O produto ${data.idmm} foi criado e adicionado ao stock do parque.`
            : `O produto ${data.idmm} foi criado com sucesso.`,
        });
      }
      
      setIsFormOpen(false);
      setEditingProduto(null);
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Ocorreu um erro ao guardar o produto.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Produto eliminado',
        description: 'O produto foi desativado com sucesso.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Ocorreu um erro ao eliminar o produto.',
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      forma: 'all',
      tipoPedra: '',
      ativo: 'all',
    });
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">Erro ao carregar produtos: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Produtos</h1>
          <p className="text-muted-foreground">Gerir produtos de pedra natural</p>
        </div>
        <Button onClick={() => { setEditingProduto(null); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
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
              <div className="space-y-2 lg:col-span-2">
                <Label>Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="IDMM, tipo de pedra..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Forma</Label>
                <Select
                  value={filters.forma}
                  onValueChange={(value) => setFilters({ ...filters, forma: value })}
                >
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

              <div className="space-y-2">
                <Label>Tipo de Pedra</Label>
                <Input
                  placeholder="Filtrar por tipo..."
                  value={filters.tipoPedra}
                  onChange={(e) => setFilters({ ...filters, tipoPedra: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={filters.ativo}
                  onValueChange={(value) => setFilters({ ...filters, ativo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-5 flex justify-between items-center">
                <div className="flex gap-2">
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
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Lista de Produtos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !filteredProdutos?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum produto encontrado
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProdutos.map((produto) => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IDMM</TableHead>
                    <TableHead>Tipo de Pedra</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Nome Comercial</TableHead>
                    <TableHead>Dimensões</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProdutos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-medium">{produto.idmm}</TableCell>
                      <TableCell>{produto.tipo_pedra}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{FORMA_LABELS[produto.forma]}</Badge>
                      </TableCell>
                      <TableCell>{produto.nome_comercial || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {produto.forma === 'bloco'
                          ? produto.comprimento_cm && produto.largura_cm && produto.altura_cm
                            ? `${produto.comprimento_cm}×${produto.largura_cm}×${produto.altura_cm} cm`
                            : '-'
                          : produto.comprimento_cm && produto.largura_cm
                          ? `${produto.comprimento_cm}×${produto.largura_cm}${produto.espessura_cm ? `×${produto.espessura_cm}` : ''} cm`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {produto.ativo ? (
                          <Badge variant="secondary">Ativo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-destructive">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(produto)}>
                            Editar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contador */}
      {filteredProdutos && (
        <div className="text-center text-sm text-muted-foreground">
          {filteredProdutos.length} {filteredProdutos.length === 1 ? 'produto' : 'produtos'} encontrados
        </div>
      )}

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setIsFormOpen(false); setEditingProduto(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduto ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <ProdutoForm
            produto={editingProduto}
            onSubmit={handleSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingProduto(null); }}
            isLoading={isSubmitting}
            canUploadHd={canUploadHd}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
