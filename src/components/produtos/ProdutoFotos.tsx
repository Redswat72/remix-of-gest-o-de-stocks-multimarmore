import { useState, useRef, useEffect } from 'react';
import { Camera, ImagePlus, X, Check, RotateCcw, Loader2, Image, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';

interface FotoSlot {
  url: string | null;
  preview: string | null;
  file: File | null;
  isUploading: boolean;
  progress: number;
}

interface ProdutoFotosProps {
  maxFotos: number;
  idmm: string;
  fotoUrls: (string | null)[];
  fotoHdUrls: (string | null)[];
  onFotosChange: (urls: (string | null)[]) => void;
  onFotosHdChange: (urls: (string | null)[]) => void;
  canUploadHd: boolean;
}

export function ProdutoFotos({
  maxFotos,
  idmm,
  fotoUrls,
  fotoHdUrls,
  onFotosChange,
  onFotosHdChange,
  canUploadHd,
}: ProdutoFotosProps) {
  const [activeTab, setActiveTab] = useState<'operacionais' | 'hd'>('operacionais');
  
  // Estado para fotos operacionais
  const [fotos, setFotos] = useState<FotoSlot[]>(
    Array(4).fill(null).map((_, i) => ({
      url: fotoUrls[i] || null,
      preview: fotoUrls[i] || null,
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

  const handleFileSelect = (index: number, file: File, isHd: boolean) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const setter = isHd ? setFotosHd : setFotos;
      setter(prev => {
        const newFotos = [...prev];
        newFotos[index] = {
          ...newFotos[index],
          preview: e.target?.result as string,
          file,
        };
        return newFotos;
      });
    };
    reader.readAsDataURL(file);
  };

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

    const result = await uploadImage(foto.file, {
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
  };

  const handleCancelPreview = (index: number, isHd: boolean) => {
    const setter = isHd ? setFotosHd : setFotos;
    const originalUrls = isHd ? fotoHdUrls : fotoUrls;
    
    setter(prev => {
      const newFotos = [...prev];
      newFotos[index] = {
        url: originalUrls[index] || null,
        preview: originalUrls[index] || null,
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

  const renderFotoGrid = (fotoList: FotoSlot[], isHd: boolean) => {
    const inputRefs = isHd ? hdFileInputRefs : fileInputRefs;
    const camRefs = isHd ? hdCameraInputRefs : cameraInputRefs;

    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: maxFotos }).map((_, index) => {
          const foto = fotoList[index];
          const hasPreview = !!foto?.preview;
          const isPending = foto?.file !== null;

          return (
            <div key={index} className="relative">
              <div className={cn(
                "relative aspect-square rounded-lg border-2 overflow-hidden transition-all",
                hasPreview 
                  ? "border-border bg-muted" 
                  : "border-dashed border-border bg-muted/30 hover:border-primary/50"
              )}>
                {hasPreview ? (
                  <>
                    <img
                      src={foto.preview!}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Badge HD */}
                    {isHd && (
                      <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">
                        <Sparkles className="w-3 h-3 mr-1" />
                        HD
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
                    <span className="text-xs text-muted-foreground">
                      {isHd ? `HD ${index + 1}` : `Foto ${index + 1}`}
                    </span>
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
          {renderFotoGrid(fotos, false)}
        </TabsContent>
        
        <TabsContent value="hd" className="mt-4">
          {canUploadHd ? (
            <>
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">
                  Fotos de alta qualidade para visualização detalhada. 
                  Sem compressão, preserva cores e detalhes da pedra.
                </p>
              </div>
              {renderFotoGrid(fotosHd, true)}
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
