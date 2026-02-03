import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin, X, Camera, ImagePlus, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';
import type { Produto } from '@/types/database';

const produtoSchema = z.object({
  idmm: z.string().min(1, 'IDMM é obrigatório').max(50, 'Máximo 50 caracteres'),
  tipo_pedra: z.string().min(1, 'Tipo de pedra é obrigatório').max(100, 'Máximo 100 caracteres'),
  nome_comercial: z.string().max(100, 'Máximo 100 caracteres').optional(),
  forma: z.enum(['bloco', 'chapa', 'ladrilho'] as const),
  acabamento: z.string().max(50, 'Máximo 50 caracteres').optional(),
  comprimento_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  largura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  altura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  espessura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  observacoes: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface ProdutoFormProps {
  produto?: Produto | null;
  onSubmit: (data: ProdutoFormData, fotoUrls: (string | null)[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FotoSlot {
  url: string | null;
  preview: string | null;
  file: File | null;
  isUploading: boolean;
  progress: number;
}

export function ProdutoForm({ produto, onSubmit, onCancel, isLoading }: ProdutoFormProps) {
  const [fotos, setFotos] = useState<FotoSlot[]>([
    { url: null, preview: null, file: null, isUploading: false, progress: 0 },
    { url: null, preview: null, file: null, isUploading: false, progress: 0 },
    { url: null, preview: null, file: null, isUploading: false, progress: 0 },
    { url: null, preview: null, file: null, isUploading: false, progress: 0 },
  ]);
  const [gettingLocation, setGettingLocation] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
  const cameraInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
  const { uploadImage, deleteImage } = useImageUpload();

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      idmm: produto?.idmm || '',
      tipo_pedra: produto?.tipo_pedra || '',
      nome_comercial: produto?.nome_comercial || '',
      forma: produto?.forma || 'bloco',
      acabamento: produto?.acabamento || '',
      comprimento_cm: produto?.comprimento_cm || null,
      largura_cm: produto?.largura_cm || null,
      altura_cm: produto?.altura_cm || null,
      espessura_cm: produto?.espessura_cm || null,
      latitude: produto?.latitude || null,
      longitude: produto?.longitude || null,
      observacoes: produto?.observacoes || '',
    },
  });

  const forma = form.watch('forma');
  const maxFotos = forma === 'bloco' ? 4 : 2;

  useEffect(() => {
    if (produto) {
      const existingUrls = [
        produto.foto1_url,
        produto.foto2_url,
        produto.foto3_url,
        produto.foto4_url,
      ];
      setFotos(existingUrls.map(url => ({
        url,
        preview: url,
        file: null,
        isUploading: false,
        progress: 0,
      })));
    }
  }, [produto]);

  const handleFileSelect = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) return;

    // Criar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setFotos(prev => {
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

  const handleConfirmUpload = async (index: number) => {
    const foto = fotos[index];
    if (!foto.file) return;

    setFotos(prev => {
      const newFotos = [...prev];
      newFotos[index] = { ...newFotos[index], isUploading: true };
      return newFotos;
    });

    const result = await uploadImage(foto.file, {
      bucket: 'produtos',
      folder: produto?.id || 'novo',
      maxSizeKB: 500,
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.85,
    });

    if (result) {
      setFotos(prev => {
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
    } else {
      setFotos(prev => {
        const newFotos = [...prev];
        newFotos[index] = { ...newFotos[index], isUploading: false };
        return newFotos;
      });
    }
  };

  const handleCancelPreview = (index: number) => {
    setFotos(prev => {
      const newFotos = [...prev];
      // Restaurar URL anterior se existia
      const originalUrl = produto ? [
        produto.foto1_url,
        produto.foto2_url,
        produto.foto3_url,
        produto.foto4_url,
      ][index] : null;
      
      newFotos[index] = {
        url: originalUrl,
        preview: originalUrl,
        file: null,
        isUploading: false,
        progress: 0,
      };
      return newFotos;
    });
  };

  const handleRemoveFoto = async (index: number) => {
    const foto = fotos[index];
    if (foto.url) {
      const urlParts = foto.url.split('/produtos/');
      if (urlParts.length > 1) {
        await deleteImage('produtos', urlParts[1]);
      }
    }

    setFotos(prev => {
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
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('latitude', position.coords.latitude);
        form.setValue('longitude', position.coords.longitude);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        alert('Não foi possível obter a localização');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (data: ProdutoFormData) => {
    // Garantir que todas as fotos pendentes estão carregadas
    const hasePendingUploads = fotos.some(f => f.file !== null);
    if (hasePendingUploads) {
      alert('Por favor, confirme ou cancele os uploads pendentes antes de guardar.');
      return;
    }

    const fotoUrls = fotos.slice(0, maxFotos).map(f => f.url);
    await onSubmit(data, fotoUrls);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Identificação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="idmm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IDMM *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: BL-001" className="touch-target" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="forma"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="touch-target">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bloco">Bloco</SelectItem>
                    <SelectItem value="chapa">Chapa</SelectItem>
                    <SelectItem value="ladrilho">Ladrilho</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo_pedra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Pedra *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Mármore Branco" className="touch-target" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nome_comercial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Comercial</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder="Ex: Estremoz Clássico" className="touch-target" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="acabamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Acabamento</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="Ex: Polido, Amaciado" className="touch-target" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dimensões */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground">Dimensões (cm)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="comprimento_cm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comprimento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      className="touch-target"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="largura_cm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Largura</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      className="touch-target"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {forma === 'bloco' && (
              <FormField
                control={form.control}
                name="altura_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altura</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        className="touch-target"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(forma === 'chapa' || forma === 'ladrilho') && (
              <FormField
                control={form.control}
                name="espessura_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Espessura</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        className="touch-target"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Fotos com Câmara e Galeria */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground">
            Fotos ({forma === 'bloco' ? 'máx. 4' : 'máx. 2'})
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: maxFotos }).map((_, index) => {
              const foto = fotos[index];
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
                        
                        {/* Overlay de upload */}
                        {foto.isUploading && (
                          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <Progress value={foto.progress} className="w-3/4 h-2" />
                          </div>
                        )}

                        {/* Botões de confirmação para preview pendente */}
                        {isPending && !foto.isUploading && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => handleCancelPreview(index)}
                              className="h-12 w-12"
                            >
                              <RotateCcw className="w-5 h-5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              onClick={() => handleConfirmUpload(index)}
                              className="h-12 w-12"
                            >
                              <Check className="w-5 h-5" />
                            </Button>
                          </div>
                        )}

                        {/* Botão remover para foto guardada */}
                        {!isPending && !foto.isUploading && (
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => handleRemoveFoto(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-2">
                        <div className="flex gap-2">
                          {/* Botão Galeria */}
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => fileInputRefs.current[index]?.click()}
                            className="touch-target"
                          >
                            <ImagePlus className="w-5 h-5" />
                          </Button>
                          
                          {/* Botão Câmara */}
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => cameraInputRefs.current[index]?.click()}
                            className="touch-target"
                          >
                            <Camera className="w-5 h-5" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">Foto {index + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Inputs escondidos */}
                  <input
                    ref={el => { fileInputRefs.current[index] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(index, file);
                      e.target.value = '';
                    }}
                  />
                  <input
                    ref={el => { cameraInputRefs.current[index] = el; }}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(index, file);
                      e.target.value = '';
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* GPS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-muted-foreground">Localização GPS</h3>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="touch-target"
            >
              {gettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              Obter Localização
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      inputMode="decimal"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      placeholder="-90 a 90"
                      className="touch-target"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      inputMode="decimal"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      placeholder="-180 a 180"
                      className="touch-target"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Observações */}
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Notas adicionais sobre o produto..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="touch-target">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="touch-target">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {produto ? 'Guardar Alterações' : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
