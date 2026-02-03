import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, ImagePlus, X, Check, RotateCcw, Loader2, Image, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';
import type { FormaProduto } from '@/types/database';

interface FotoSlot {
  url: string | null;
  preview: string | null;
  previewWithWatermark: string | null;
  file: File | null;
  isUploading: boolean;
  progress: number;
}

interface ProdutoFotosProps {
  forma: FormaProduto;
  idmm: string;
  fotoUrls: (string | null)[];
  fotoHdUrls: (string | null)[];
  onFotosChange: (urls: (string | null)[]) => void;
  onFotosHdChange: (urls: (string | null)[]) => void;
  canUploadHd: boolean;
}

// Configuração de slots HD por forma de produto
const HD_SLOTS_CONFIG: Record<FormaProduto, { count: number; labels: string[] }> = {
  bloco: {
    count: 4,
    labels: ['Lado A', 'Lado B', 'Lado C', 'Lado D'],
  },
  chapa: {
    count: 2,
    labels: ['Frente', 'Verso'],
  },
  ladrilho: {
    count: 2,
    labels: ['Frente', 'Verso'],
  },
};

// Função para aplicar watermark na imagem
async function applyWatermark(
  imageDataUrl: string,
  idmm: string,
  lado: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Erro ao criar contexto do canvas'));
        return;
      }
      
      // Desenhar imagem original
      ctx.drawImage(img, 0, 0);
      
      // Configurar watermark
      const watermarkText = `MULTIMÁRMORE • IDMM: ${idmm} • ${lado}`;
      const fontSize = Math.max(16, Math.min(img.width * 0.02, 48));
      
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      
      // Medir texto
      const textMetrics = ctx.measureText(watermarkText);
      const padding = fontSize * 0.5;
      const x = img.width - padding;
      const y = img.height - padding;
      
      // Fundo semi-transparente para legibilidade
      const bgHeight = fontSize * 1.5;
      const bgWidth = textMetrics.width + padding * 2;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(img.width - bgWidth - padding / 2, img.height - bgHeight - padding / 2, bgWidth + padding, bgHeight + padding);
      
      // Texto com opacidade 10%
      ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
      ctx.fillText(watermarkText, x, y);
      
      // Contorno subtil para legibilidade
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      ctx.strokeText(watermarkText, x, y);
      
      resolve(canvas.toDataURL('image/jpeg', 1.0));
    };
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = imageDataUrl;
  });
}

// Converter File para data URL
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler ficheiro'));
    reader.readAsDataURL(file);
  });
}

// Converter data URL para Blob
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function ProdutoFotos({
  forma,
  idmm,
  fotoUrls,
  fotoHdUrls,
  onFotosChange,
  onFotosHdChange,
  canUploadHd,
}: ProdutoFotosProps) {
  const [activeTab, setActiveTab] = useState<'operacionais' | 'hd'>('operacionais');
  
  // Configuração baseada na forma
  const hdConfig = HD_SLOTS_CONFIG[forma];
  const maxFotosOperacionais = forma === 'bloco' ? 4 : 2;
  const maxFotosHd = hdConfig.count;
  
  // Estado para fotos operacionais
  const [fotos, setFotos] = useState<FotoSlot[]>(
    Array(4).fill(null).map((_, i) => ({
      url: fotoUrls[i] || null,
      preview: fotoUrls[i] || null,
      previewWithWatermark: null,
      file: null,
      isUploading: false,
      progress: 0,
    }))
  );
  
  // Estado para fotos HD
  const [fotosHd, setFotosHd] = useState<FotoSlot[]>(
    Array(4).fill(null).map((_, i) => ({
      url: fotoHdUrls[i] || null,
      preview: fotoHdUrls[i] || null,
      previewWithWatermark: null,
      file: null,
      isUploading: false,
      progress: 0,
    }))
  );

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
  const cameraInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
  const hdFileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
  const hdCameraInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
  
  const { uploadImage, deleteImage } = useImageUpload();

  // Sincronizar URLs externas
  useEffect(() => {
    setFotos(prev => prev.map((foto, i) => ({
      ...foto,
      url: fotoUrls[i] || null,
      preview: foto.file ? foto.preview : (fotoUrls[i] || null),
    })));
  }, [fotoUrls]);

  useEffect(() => {
    setFotosHd(prev => prev.map((foto, i) => ({
      ...foto,
      url: fotoHdUrls[i] || null,
      preview: foto.file ? foto.preview : (fotoHdUrls[i] || null),
    })));
  }, [fotoHdUrls]);

  const handleFileSelect = useCallback(async (index: number, file: File, isHd: boolean) => {
    if (!file.type.startsWith('image/')) return;

    const setter = isHd ? setFotosHd : setFotos;
    const originalPreview = await fileToDataUrl(file);
    
    if (isHd) {
      // Para HD, gerar preview com watermark
      const lado = hdConfig.labels[index] || `HD${index + 1}`;
      const currentIdmm = idmm || 'NOVO';
      
      try {
        const previewWithWatermark = await applyWatermark(originalPreview, currentIdmm, lado);
        setter(prev => {
          const newFotos = [...prev];
          newFotos[index] = {
            ...newFotos[index],
            preview: originalPreview,
            previewWithWatermark,
            file,
          };
          return newFotos;
        });
      } catch {
        // Se falhar o watermark, usar preview normal
        setter(prev => {
          const newFotos = [...prev];
          newFotos[index] = {
            ...newFotos[index],
            preview: originalPreview,
            previewWithWatermark: originalPreview,
            file,
          };
          return newFotos;
        });
      }
    } else {
      // Para operacionais, sem watermark
      setter(prev => {
        const newFotos = [...prev];
        newFotos[index] = {
          ...newFotos[index],
          preview: originalPreview,
          previewWithWatermark: null,
          file,
        };
        return newFotos;
      });
    }
  }, [idmm, hdConfig.labels]);

  const handleConfirmUpload = async (index: number, isHd: boolean) => {
    const fotoList = isHd ? fotosHd : fotos;
    const foto = fotoList[index];
    if (!foto.file) return;

    const slotMap = ['F1', 'F2', 'F3', 'F4'] as const;
    const slot = slotMap[index];
    const currentIdmm = idmm || 'sem-id';

    const setter = isHd ? setFotosHd : setFotos;
    setter(prev => {
      const newFotos = [...prev];
      newFotos[index] = { ...newFotos[index], isUploading: true };
      return newFotos;
    });

    try {
      let fileToUpload: File | Blob = foto.file;
      
      // Para HD, aplicar watermark antes do upload
      if (isHd && foto.previewWithWatermark) {
        fileToUpload = dataUrlToBlob(foto.previewWithWatermark);
      }

      const result = await uploadImage(fileToUpload as File, {
        bucket: isHd ? 'produtos_hd' : 'produtos',
        naming: isHd 
          ? { type: 'produto_hd', idmm: currentIdmm, slot }
          : { type: 'produto', idmm: currentIdmm, slot },
        imageMode: isHd ? 'hd' : 'operacional',
        maxSizeKB: isHd ? 20000 : 500,
        maxWidth: isHd ? 8000 : 2000,
        maxHeight: isHd ? 8000 : 2000,
        jpegQuality: isHd ? 1.0 : 0.85,
      });

      if (result) {
        setter(prev => {
          const newFotos = [...prev];
          newFotos[index] = {
            url: result.url,
            preview: result.url,
            previewWithWatermark: null,
            file: null,
            isUploading: false,
            progress: 0,
          };
          return newFotos;
        });
        
        // Notificar mudança
        const newUrls = (isHd ? fotosHd : fotos).map((f, i) => 
          i === index ? result.url : f.url
        );
        if (isHd) {
          onFotosHdChange(newUrls);
        } else {
          onFotosChange(newUrls);
        }
      } else {
        setter(prev => {
          const newFotos = [...prev];
          newFotos[index] = { ...newFotos[index], isUploading: false };
          return newFotos;
        });
      }
    } catch {
      setter(prev => {
        const newFotos = [...prev];
        newFotos[index] = { ...newFotos[index], isUploading: false };
        return newFotos;
      });
    }
  };

  const handleCancelPreview = (index: number, isHd: boolean) => {
    const setter = isHd ? setFotosHd : setFotos;
    const originalUrls = isHd ? fotoHdUrls : fotoUrls;
    
    setter(prev => {
      const newFotos = [...prev];
      newFotos[index] = {
        url: originalUrls[index] || null,
        preview: originalUrls[index] || null,
        previewWithWatermark: null,
        file: null,
        isUploading: false,
        progress: 0,
      };
      return newFotos;
    });
  };

  const handleRemoveFoto = async (index: number, isHd: boolean) => {
    const fotoList = isHd ? fotosHd : fotos;
    const foto = fotoList[index];
    const bucket = isHd ? 'produtos_hd' : 'produtos';
    
    if (foto.url) {
      const urlParts = foto.url.split(`/${bucket}/`);
      if (urlParts.length > 1) {
        await deleteImage(bucket, urlParts[1]);
      }
    }

    const setter = isHd ? setFotosHd : setFotos;
    setter(prev => {
      const newFotos = [...prev];
      newFotos[index] = {
        url: null,
        preview: null,
        previewWithWatermark: null,
        file: null,
        isUploading: false,
        progress: 0,
      };
      return newFotos;
    });
    
    const newUrls = (isHd ? fotosHd : fotos).map((f, i) => 
      i === index ? null : f.url
    );
    if (isHd) {
      onFotosHdChange(newUrls);
    } else {
      onFotosChange(newUrls);
    }
  };

  const renderFotoGrid = (fotoList: FotoSlot[], isHd: boolean, maxSlots: number, slotLabels?: string[]) => {
    const inputRefs = isHd ? hdFileInputRefs : fileInputRefs;
    const camRefs = isHd ? hdCameraInputRefs : cameraInputRefs;

    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: maxSlots }).map((_, index) => {
          const foto = fotoList[index];
          const hasPreview = !!foto?.preview;
          const isPending = foto?.file !== null;
          const label = isHd 
            ? (slotLabels?.[index] || `HD ${index + 1}`)
            : `Foto ${index + 1}`;

          // Para HD com watermark, mostrar preview com watermark
          const displayPreview = isHd && foto?.previewWithWatermark 
            ? foto.previewWithWatermark 
            : foto?.preview;

          return (
            <div key={index} className="relative">
              {/* Label do slot */}
              <div className="mb-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                {isHd && <Sparkles className="w-3 h-3" />}
                {label}
              </div>
              
              <div className={cn(
                "relative aspect-square rounded-lg border-2 overflow-hidden transition-all",
                hasPreview 
                  ? "border-border bg-muted" 
                  : "border-dashed border-border bg-muted/30 hover:border-primary/50"
              )}>
                {hasPreview ? (
                  <>
                    <img
                      src={displayPreview!}
                      alt={label}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Badge HD */}
                    {isHd && (
                      <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        HD
                      </Badge>
                    )}
                    
                    {/* Indicador de watermark pendente */}
                    {isHd && isPending && foto.previewWithWatermark && (
                      <Badge variant="outline" className="absolute bottom-2 left-2 bg-background/80 text-xs">
                        Watermark aplicado
                      </Badge>
                    )}
                    
                    {/* Overlay de upload */}
                    {foto.isUploading && (
                      <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <Progress value={foto.progress} className="w-3/4 h-2" />
                      </div>
                    )}

                    {/* Botões de confirmação */}
                    {isPending && !foto.isUploading && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => handleCancelPreview(index, isHd)}
                          className="h-12 w-12"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => handleConfirmUpload(index, isHd)}
                          className="h-12 w-12"
                        >
                          <Check className="w-5 h-5" />
                        </Button>
                      </div>
                    )}

                    {/* Botão remover */}
                    {!isPending && !foto.isUploading && (
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => handleRemoveFoto(index, isHd)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => inputRefs.current[index]?.click()}
                        className="touch-target"
                      >
                        <ImagePlus className="w-5 h-5" />
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => camRefs.current[index]?.click()}
                        className="touch-target"
                      >
                        <Camera className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Inputs escondidos */}
              <input
                ref={el => { inputRefs.current[index] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(index, file, isHd);
                  e.target.value = '';
                }}
              />
              <input
                ref={el => { camRefs.current[index] = el; }}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(index, file, isHd);
                  e.target.value = '';
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Verificar se há uploads pendentes
  const hasPendingUploads = () => {
    return fotos.some(f => f.file !== null) || fotosHd.some(f => f.file !== null);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="operacionais" className="gap-2">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Operacionais</span>
            <span className="sm:hidden">Op.</span>
          </TabsTrigger>
          <TabsTrigger 
            value="hd" 
            disabled={!canUploadHd}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Alta Qualidade (HD)</span>
            <span className="sm:hidden">HD</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="operacionais" className="mt-4">
          <div className="mb-3">
            <p className="text-sm text-muted-foreground">
              Fotos para uso operacional (listagens, histórico, mobile). 
              Comprimidas até 2000px, ideal para rapidez.
            </p>
          </div>
          {renderFotoGrid(fotos, false, maxFotosOperacionais)}
        </TabsContent>
        
        <TabsContent value="hd" className="mt-4">
          {canUploadHd ? (
            <>
              <div className="mb-3 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Fotos de alta qualidade para visualização detalhada. 
                  Sem compressão, preserva cores e detalhes da pedra.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  💧 Watermark discreto aplicado automaticamente (MULTIMÁRMORE • IDMM • Lado)
                </p>
              </div>
              {renderFotoGrid(fotosHd, true, maxFotosHd, hdConfig.labels)}
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Acesso restrito</p>
              <p className="text-sm">
                Apenas Admins e Superadmins podem carregar fotos HD
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {hasPendingUploads() && (
        <p className="text-sm text-destructive">
          ⚠️ Confirme ou cancele os uploads pendentes antes de guardar.
        </p>
      )}
    </div>
  );
}

// Exportar função utilitária para verificar uploads pendentes
export function getPendingUploadsState(fotos: FotoSlot[], fotosHd: FotoSlot[]): boolean {
  return fotos.some(f => f.file !== null) || fotosHd.some(f => f.file !== null);
}
