import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Pencil, 
  Plus, 
  Loader2,
  MapPin,
  Package,
  Ruler,
  Calendar,
  AlertCircle,
  Warehouse
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProduto, useUpdateProduto } from '@/hooks/useProdutos';
import { useStockProduto } from '@/hooks/useStock';
import { useUltimoMovimentoProduto } from '@/hooks/useUltimoMovimentoProduto';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ProdutoForm } from '@/components/produtos/ProdutoForm';
import { ProdutoQrCode } from '@/components/produtos/ProdutoQrCode';
import { FotoLightbox, createFotosList } from '@/components/produtos/FotoLightbox';

const FORMA_LABELS: Record<string, string> = {
  bloco: 'Bloco',
  chapa: 'Chapa',
  ladrilho: 'Ladrilho',
};

const ORIGEM_MATERIAL_LABELS: Record<string, string> = {
  adquirido: 'Adquirido',
  producao_propria: 'Produção própria',
};

export default function ProdutoFicha() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isSuperadmin, roles } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: produto, isLoading, error } = useProduto(id);
  const { data: ultimoMovimento } = useUltimoMovimentoProduto(produto?.id);
  const { data: stockProduto = [] } = useStockProduto(produto?.id);
  const updateMutation = useUpdateProduto();

  const canEdit = isAdmin || isSuperadmin;
  const canUploadHd = isAdmin || isSuperadmin;
  const canCreateMovimento = roles.length > 0; // Qualquer utilizador autenticado

  const handleUpdate = async (
    data: any, 
    fotoUrls: (string | null)[], 
    fotoHdUrls: (string | null)[],
    pargaFotos?: {
      parga1_foto1_url: string | null;
      parga1_foto2_url: string | null;
      parga2_foto1_url: string | null;
      parga2_foto2_url: string | null;
      parga3_foto1_url: string | null;
      parga3_foto2_url: string | null;
      parga4_foto1_url: string | null;
      parga4_foto2_url: string | null;
    }
  ) => {
    if (!produto) return;

    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        id: produto.id,
        ...data,
        foto1_url: fotoUrls[0] || null,
        foto2_url: fotoUrls[1] || null,
        foto3_url: fotoUrls[2] || null,
        foto4_url: fotoUrls[3] || null,
        foto1_hd_url: fotoHdUrls[0] || null,
        foto2_hd_url: fotoHdUrls[1] || null,
        foto3_hd_url: fotoHdUrls[2] || null,
        foto4_hd_url: fotoHdUrls[3] || null,
        // Incluir fotos de pargas se fornecidas (para produtos tipo chapa)
        ...pargaFotos,
      });

      toast({
        title: 'Produto atualizado',
        description: `O produto ${data.idmm} foi atualizado com sucesso.`,
      });
      setIsEditDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Ocorreu um erro ao atualizar o produto.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">A carregar produto...</p>
        </div>
      </div>
    );
  }

  // Erro
  if (error || !produto) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <div>
              <h1 className="text-xl font-bold mb-2">Produto não encontrado</h1>
              <p className="text-muted-foreground">
                {error?.message || 'Não foi possível carregar os dados do produto.'}
              </p>
            </div>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Usar createFotosList para preparar fotos para o lightbox
  const fotos = createFotosList(produto);

  const parqueMM =
    ultimoMovimento?.local_destino?.codigo ||
    ultimoMovimento?.local_origem?.codigo ||
    ultimoMovimento?.local_destino?.nome ||
    ultimoMovimento?.local_origem?.nome ||
    null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{produto.idmm}</h1>
              <Badge variant="outline">{FORMA_LABELS[produto.forma]}</Badge>
              {!produto.ativo && (
                <Badge variant="destructive">Inativo</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{produto.tipo_pedra}</p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {canCreateMovimento && (
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none"
              onClick={() => navigate(`/movimento/novo?produto=${produto.id}`)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Movimento
            </Button>
          )}
          {canEdit && (
            <Button 
              className="flex-1 sm:flex-none"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo Principal - Mobile First */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Galeria de Fotos */}
          {fotos.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Fotografias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {fotos.map((foto, index) => (
                    <div 
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => openLightbox(index)}
                    >
                      <img
                        src={foto.url}
                        alt={foto.label}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <span className="text-white text-xs font-medium">{foto.label}</span>
                        {foto.isHd && (
                          <Badge variant="secondary" className="ml-2 text-[10px] py-0">HD</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Sem fotografias disponíveis</p>
                {canEdit && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    Adicionar Fotos
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações Técnicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Dados Técnicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Parque MM (derivado do stock) */}
              {stockProduto.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Warehouse className="h-3.5 w-3.5" />
                    Parque MM
                  </span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {stockProduto.map((item) => (
                      <Badge key={item.local.id} variant="secondary" className="text-sm">
                        {item.local.codigo} - {item.local.nome}
                        {item.quantidade > 1 && (
                          <span className="ml-1 text-muted-foreground">({item.quantidade})</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Linha */}
              {produto.linha && (
                <div>
                  <span className="text-sm text-muted-foreground">Linha</span>
                  <p className="font-medium">{produto.linha}</p>
                </div>
              )}

              {/* Variedade */}
              {produto.variedade && (
                <div>
                  <span className="text-sm text-muted-foreground">Variedade</span>
                  <p className="font-medium">{produto.variedade}</p>
                </div>
              )}

              {/* Origem do Bloco */}
              {produto.origem_bloco && (
                <div>
                  <span className="text-sm text-muted-foreground">Origem do Bloco</span>
                  <p className="font-medium">{produto.origem_bloco}</p>
                </div>
              )}

              {/* Nome Comercial */}
              {produto.nome_comercial && (
                <div>
                  <span className="text-sm text-muted-foreground">Nome Comercial</span>
                  <p className="font-medium">{produto.nome_comercial}</p>
                </div>
              )}

              {/* Acabamento */}
              {produto.acabamento && (
                <div>
                  <span className="text-sm text-muted-foreground">Acabamento</span>
                  <p className="font-medium">{produto.acabamento}</p>
                </div>
              )}

              <Separator />

              {/* Dimensões */}
              <div>
                <span className="text-sm text-muted-foreground">Dimensões</span>
                <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {produto.comprimento_cm && (
                    <div>
                      <span className="text-xs text-muted-foreground">Comprimento</span>
                      <p className="font-medium">{produto.comprimento_cm} cm</p>
                    </div>
                  )}
                  {produto.largura_cm && (
                    <div>
                      <span className="text-xs text-muted-foreground">Largura</span>
                      <p className="font-medium">{produto.largura_cm} cm</p>
                    </div>
                  )}
                  {produto.forma === 'bloco' && produto.altura_cm && (
                    <div>
                      <span className="text-xs text-muted-foreground">Altura</span>
                      <p className="font-medium">{produto.altura_cm} cm</p>
                    </div>
                  )}
                  {produto.espessura_cm && (
                    <div>
                      <span className="text-xs text-muted-foreground">Espessura</span>
                      <p className="font-medium">{produto.espessura_cm} cm</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Peso - apenas para blocos */}
              {produto.forma === 'bloco' && produto.peso_ton && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Peso</span>
                    <p className="font-medium text-lg">{produto.peso_ton} toneladas</p>
                  </div>
                </>
              )}

              {/* Área e Volume */}
              {(produto.area_m2 || produto.volume_m3) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {produto.area_m2 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Área</span>
                        <p className="font-medium">{produto.area_m2.toFixed(2)} m²</p>
                      </div>
                    )}
                    {produto.volume_m3 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Volume</span>
                        <p className="font-medium">{produto.volume_m3.toFixed(3)} m³</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Localização GPS */}
              {(produto.latitude && produto.longitude) && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Localização GPS
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="font-mono text-sm">
                        {produto.latitude.toFixed(6)}, {produto.longitude.toFixed(6)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={`https://maps.google.com/?q=${produto.latitude},${produto.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver no mapa
                        </a>
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Observações */}
              {produto.observacoes && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Observações</span>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{produto.observacoes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* QR Code */}
          <ProdutoQrCode idmm={produto.idmm} tipoPedra={produto.tipo_pedra} />

          {/* Metadados */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {ultimoMovimento?.data_movimento && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Data</span>
                  <span className="text-right">
                    {format(new Date(ultimoMovimento.data_movimento), "d 'de' MMM yyyy", { locale: pt })}
                  </span>
                </div>
              )}
              {parqueMM && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Parque MM</span>
                  <span className="text-right">{parqueMM}</span>
                </div>
              )}
              {ultimoMovimento?.origem_material && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Origem material</span>
                  <span className="text-right">
                    {ORIGEM_MATERIAL_LABELS[String(ultimoMovimento.origem_material)] || ultimoMovimento.origem_material}
                  </span>
                </div>
              )}
              {(ultimoMovimento?.data_movimento || parqueMM || ultimoMovimento?.origem_material) && <Separator />}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{format(new Date(produto.created_at), "d 'de' MMM yyyy", { locale: pt })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atualizado</span>
                <span>{format(new Date(produto.updated_at), "d 'de' MMM yyyy", { locale: pt })}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <Badge variant={produto.ativo ? 'secondary' : 'destructive'}>
                  {produto.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lightbox */}
      {fotos.length > 0 && (
        <FotoLightbox
          fotos={fotos}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          idmm={produto.idmm}
          tipoPedra={produto.tipo_pedra}
        />
      )}

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          <ProdutoForm
            produto={produto}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={isSubmitting}
            canUploadHd={canUploadHd}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
