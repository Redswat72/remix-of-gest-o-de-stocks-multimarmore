import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  onSubmit: (data: ProdutoFormData, fotos: (File | string | null)[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProdutoForm({ produto, onSubmit, onCancel, isLoading }: ProdutoFormProps) {
  const [fotos, setFotos] = useState<(File | string | null)[]>([null, null, null, null]);
  const [fotoPreviews, setFotoPreviews] = useState<(string | null)[]>([null, null, null, null]);
  const [gettingLocation, setGettingLocation] = useState(false);

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
      const existingFotos: (string | null)[] = [
        produto.foto1_url,
        produto.foto2_url,
        produto.foto3_url,
        produto.foto4_url || null,
      ];
      setFotos(existingFotos);
      setFotoPreviews(existingFotos);
    }
  }, [produto]);

  const handleFotoChange = (index: number, file: File | null) => {
    const newFotos = [...fotos];
    const newPreviews = [...fotoPreviews];
    
    if (file) {
      newFotos[index] = file;
      newPreviews[index] = URL.createObjectURL(file);
    } else {
      newFotos[index] = null;
      if (fotoPreviews[index]?.startsWith('blob:')) {
        URL.revokeObjectURL(fotoPreviews[index]!);
      }
      newPreviews[index] = null;
    }
    
    setFotos(newFotos);
    setFotoPreviews(newPreviews);
  };

  const removeFoto = (index: number) => {
    handleFotoChange(index, null);
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
    const fotosToSubmit = fotos.slice(0, maxFotos);
    await onSubmit(data, fotosToSubmit);
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
                  <Input {...field} placeholder="Ex: BL-001" />
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
                    <SelectTrigger>
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
                  <Input {...field} placeholder="Ex: Mármore Branco" />
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
                  <Input {...field} value={field.value || ''} placeholder="Ex: Estremoz Clássico" />
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
                <Input {...field} value={field.value || ''} placeholder="Ex: Polido, Amaciado" />
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
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
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
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
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
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
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
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Fotos */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground">
            Fotos ({forma === 'bloco' ? 'máx. 4' : 'máx. 2'})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: maxFotos }).map((_, index) => (
              <div key={index} className="relative">
                {fotoPreviews[index] ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={fotoPreviews[index]!}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeFoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer bg-muted/50 transition-colors">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground mt-1">Foto {index + 1}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFotoChange(index, e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* GPS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-muted-foreground">Localização GPS</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
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
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      placeholder="-90 a 90"
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
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      placeholder="-180 a 180"
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {produto ? 'Guardar Alterações' : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
