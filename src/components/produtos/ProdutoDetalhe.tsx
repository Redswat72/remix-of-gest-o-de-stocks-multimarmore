import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/hooks/useAuth';
import { 
  MapPin, 
  Package, 
  Sparkles, 
  Image as ImageIcon,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Clock,
  QrCode,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FotoLightbox, createFotosList } from './FotoLightbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  formatarDimensoes, 
  extrairFotosHd, 
  temFotosHd,
  contarFotosHd 
} from '@/lib/crmHelpers';
import type { Produto } from '@/types/database';
import type { FotoHdMetadata } from '@/types/crm';

const FORMA_LABELS: Record<string, string> = {
  bloco: 'Bloco',
  chapa: 'Chapa',
  ladrilho: 'Ladrilho',
};

const FORMA_COLORS: Record<string, string> = {
  bloco: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  chapa: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ladrilho: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

interface ProdutoDetalheProps {
  produto: Produto;
  /** Mostrar botão de partilha comercial */
  showPartilha?: boolean;
  /** Callback quando o lightbox é aberto */
  onLightboxOpen?: () => void;
}

/**
 * Componente de visualização detalhada do produto
 * Preparado para reutilização em integração CRM
 */
export function ProdutoDetalhe({ 
  produto, 
  showPartilha = true,
  onLightboxOpen 
}: ProdutoDetalheProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { isAdmin } = useAuth();
  const [partilhaOpen, setPartilhaOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [signedUrls, setSignedUrls] = useState<FotoHdMetadata[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeLabel, setQrCodeLabel] = useState<string>('');

  const fotosList = createFotosList(produto);
  const fotos = [produto.foto1_url, produto.foto2_url, produto.foto3_url, produto.foto4_url].filter(Boolean);
  const mainFoto = fotos[0];
  const hasHdPhotos = temFotosHd(produto);
  const hdCount = contarFotosHd(produto);
  const dimensoes = formatarDimensoes(produto);

  const handleImageClick = (index: number = 0) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    onLightboxOpen?.();
  };

  const handleHdClick = () => {
    const hdIndex = fotosList.findIndex(f => f.isHd);
    if (hdIndex >= 0) {
      setLightboxIndex(hdIndex);
      setLightboxOpen(true);
      onLightboxOpen?.();
    }
  };

  // Gerar signed URLs para fotos HD
  const generateSignedUrls = async () => {
    setIsGenerating(true);
    try {
      const fotosHd = extrairFotosHd(produto);
      const urlsWithSigned: FotoHdMetadata[] = [];

      for (const foto of fotosHd) {
        // Extrair o path do URL público
        const url = new URL(foto.url);
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/produtos_hd\/(.+)/);
        
        if (pathMatch) {
          const filePath = pathMatch[1];
          
          // Gerar signed URL com validade de 24h
          const { data, error } = await supabase.storage
            .from('produtos_hd')
            .createSignedUrl(filePath, 24 * 60 * 60); // 24 horas em segundos

          if (error) {
            console.error('Erro ao gerar signed URL:', error);
            urlsWithSigned.push(foto);
          } else {
            urlsWithSigned.push({
              ...foto,
              signedUrl: data.signedUrl,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        } else {
          urlsWithSigned.push(foto);
        }
      }

      setSignedUrls(urlsWithSigned);
      toast.success('Links temporários gerados com sucesso');
    } catch (error) {
      console.error('Erro ao gerar signed URLs:', error);
      toast.error('Erro ao gerar links temporários');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      toast.success('Link copiado!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  const copyAllLinks = async () => {
    const linksText = signedUrls
      .map(f => `${f.label}: ${f.signedUrl || f.url}`)
      .join('\n');
    
    const fullText = `Produto: ${produto.idmm}\n` +
      `Tipo: ${produto.tipo_pedra}\n` +
      (produto.nome_comercial ? `Nome: ${produto.nome_comercial}\n` : '') +
      (dimensoes ? `Dimensões: ${dimensoes}\n` : '') +
      `\nFotos HD:\n${linksText}`;

    try {
      await navigator.clipboard.writeText(fullText);
      toast.success('Dados copiados para a área de transferência');
    } catch {
      toast.error('Erro ao copiar dados');
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-xl">{produto.idmm}</CardTitle>
              <p className="text-sm text-muted-foreground">{produto.tipo_pedra}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={FORMA_COLORS[produto.forma]}>
                {FORMA_LABELS[produto.forma]}
              </Badge>
              {!produto.ativo && (
                <Badge variant="outline" className="text-destructive border-destructive">
                  Inativo
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Imagem principal e galeria */}
          <div className="space-y-2">
            <div 
              className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => handleImageClick(0)}
            >
              {mainFoto ? (
                <img
                  src={mainFoto}
                  alt={produto.idmm}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
              
              {/* Indicadores */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {hasHdPhotos && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 bg-accent/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHdClick();
                    }}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    HD ({hdCount})
                  </Button>
                )}
                {fotosList.length > 1 && (
                  <div className="flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    <ImageIcon className="h-3 w-3" />
                    {fotosList.length}
                  </div>
                )}
              </div>

              {/* GPS */}
              {produto.latitude && produto.longitude && (
                <div className="absolute bottom-2 right-2">
                  <Badge variant="secondary" className="bg-white/90 text-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    GPS
                  </Badge>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {fotosList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {fotosList.slice(0, 6).map((foto, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageClick(index)}
                    className="relative flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                  >
                    <img
                      src={foto.url}
                      alt={foto.label}
                      className="w-full h-full object-cover"
                    />
                    {foto.isHd && (
                      <div className="absolute top-0.5 right-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-accent" />
                      </div>
                    )}
                  </button>
                ))}
                {fotosList.length > 6 && (
                  <div 
                    className="flex-shrink-0 w-14 h-14 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/80"
                    onClick={() => handleImageClick(6)}
                  >
                    +{fotosList.length - 6}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Dados do produto */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {produto.nome_comercial && (
              <div>
                <span className="text-muted-foreground">Nome comercial</span>
                <p className="font-medium">{produto.nome_comercial}</p>
              </div>
            )}
            {produto.acabamento && (
              <div>
                <span className="text-muted-foreground">Acabamento</span>
                <p className="font-medium">{produto.acabamento}</p>
              </div>
            )}
            {dimensoes && (
              <div>
                <span className="text-muted-foreground">Dimensões</span>
                <p className="font-medium">{dimensoes}</p>
              </div>
            )}
            {produto.area_m2 && (
              <div>
                <span className="text-muted-foreground">Área</span>
                <p className="font-medium">{produto.area_m2.toFixed(2)} m²</p>
              </div>
            )}
            {produto.volume_m3 && (
              <div>
                <span className="text-muted-foreground">Volume</span>
                <p className="font-medium">{produto.volume_m3.toFixed(3)} m³</p>
              </div>
            )}
          </div>

          {/* Valorização e Valor de Inventário - admin only */}
          {isAdmin && (produto as any).valorizacao && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Valorização</span>
                <p className="font-medium">
                  {Number((produto as any).valorizacao).toFixed(2)} {produto.forma === 'bloco' ? '€/ton' : '€/m²'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Inventário</span>
                <p className="font-medium text-primary">
                  {(() => {
                    const val = Number((produto as any).valorizacao);
                    if (produto.forma === 'bloco' && produto.peso_ton) {
                      return (val * Number(produto.peso_ton)).toFixed(2) + ' €';
                    }
                    if (produto.area_m2) {
                      return (val * Number(produto.area_m2)).toFixed(2) + ' €';
                    }
                    return '—';
                  })()}
                </p>
              </div>
            </div>
          )}

          {produto.observacoes && (
            <>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Observações</span>
                <p className="text-sm mt-1">{produto.observacoes}</p>
              </div>
            </>
          )}

          {/* Botão de partilha comercial */}
          {showPartilha && hasHdPhotos && (
            <>
              <Separator />
              <Dialog open={partilhaOpen} onOpenChange={setPartilhaOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      if (signedUrls.length === 0) {
                        generateSignedUrls();
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Partilhar fotos comerciais
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Partilhar fotos HD</DialogTitle>
                    <DialogDescription>
                      Links temporários válidos por 24 horas para partilha comercial.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    {/* Info do produto */}
                    <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IDMM</span>
                        <span className="font-medium">{produto.idmm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo</span>
                        <span className="font-medium">{produto.tipo_pedra}</span>
                      </div>
                      {dimensoes && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dimensões</span>
                          <span className="font-medium">{dimensoes}</span>
                        </div>
                      )}
                    </div>

                    {/* Loading */}
                    {isGenerating && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2 text-sm">A gerar links...</span>
                      </div>
                    )}

                    {/* Lista de links */}
                    {!isGenerating && signedUrls.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Válido por 24h
                          </div>
                          <span>{signedUrls.length} foto(s) HD</span>
                        </div>

                        {signedUrls.map((foto, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between gap-2 bg-muted/50 rounded-lg p-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img 
                                src={foto.url} 
                                alt={foto.label}
                                className="w-10 h-10 rounded object-cover flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{foto.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {foto.slot} • HD
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Ver QR Code"
                                onClick={() => {
                                  setQrCodeUrl(foto.signedUrl || foto.url);
                                  setQrCodeLabel(foto.label);
                                }}
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Copiar link"
                                onClick={() => copyToClipboard(foto.signedUrl || foto.url, index)}
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Abrir em nova janela"
                                asChild
                              >
                                <a 
                                  href={foto.signedUrl || foto.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button
                          variant="secondary"
                          className="w-full mt-2"
                          onClick={copyAllLinks}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar todos os dados
                        </Button>
                      </div>
                    )}

                    {/* Regenerar */}
                    {!isGenerating && signedUrls.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={generateSignedUrls}
                      >
                        Regenerar links
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      <FotoLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        fotos={fotosList}
        initialIndex={lightboxIndex}
        idmm={produto.idmm}
        tipoPedra={produto.tipo_pedra}
      />

      {/* QR Code Dialog */}
      <Dialog open={!!qrCodeUrl} onOpenChange={(open) => !open && setQrCodeUrl(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code
            </DialogTitle>
            <DialogDescription>
              {qrCodeLabel} • {produto.idmm}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCodeUrl && (
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG 
                  value={qrCodeUrl} 
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
            )}
            
            <p className="text-xs text-center text-muted-foreground">
              Aponte a câmara do telemóvel para aceder à foto HD
            </p>

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => qrCodeUrl && copyToClipboard(qrCodeUrl, -1)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                asChild
              >
                <a 
                  href={qrCodeUrl || ''} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
