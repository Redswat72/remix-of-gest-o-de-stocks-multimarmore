import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from 'sonner';
import type { UseFormReturn } from 'react-hook-form';

interface PargaCardProps {
  pargaIndex: 1 | 2 | 3 | 4;
  form: UseFormReturn<any>;
  idmm: string;
  foto1Url: string | null;
  foto2Url: string | null;
  onFoto1Change: (url: string | null) => void;
  onFoto2Change: (url: string | null) => void;
}

export function PargaCard({
  pargaIndex,
  form,
  idmm,
  foto1Url,
  foto2Url,
  onFoto1Change,
  onFoto2Change,
}: PargaCardProps) {
  const { uploadImage, isUploading } = useImageUpload();

  const nomeField = `parga${pargaIndex}_nome` as const;
  const quantidadeField = `parga${pargaIndex}_quantidade` as const;
  const comprimentoField = `parga${pargaIndex}_comprimento_cm` as const;
  const alturaField = `parga${pargaIndex}_altura_cm` as const;
  const espessuraField = `parga${pargaIndex}_espessura_cm` as const;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, photoSlot: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadImage(file, {
      bucket: 'produtos',
      naming: { 
        type: 'produto', 
        idmm: `${idmm}-P${pargaIndex}`, 
        slot: photoSlot === 1 ? 'F1' : 'F2' 
      },
      imageMode: 'operacional',
    });

    if (result) {
      if (photoSlot === 1) {
        onFoto1Change(result.url);
      } else {
        onFoto2Change(result.url);
      }
      toast.success(`Foto ${photoSlot === 1 ? 'da 1ª chapa' : 'da última chapa'} carregada`);
    } else {
      toast.error(
        'Upload falhou: não foi possível guardar no armazenamento (verifique o bucket "produtos" e permissões).'
      );
    }
  };

  const removePhoto = (photoSlot: 1 | 2) => {
    if (photoSlot === 1) {
      onFoto1Change(null);
    } else {
      onFoto2Change(null);
    }
  };

  return (
    <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-bold">
            {pargaIndex}
          </span>
          Parga {pargaIndex}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nome e Quantidade */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name={nomeField}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Nome da Parga</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder={`Ex: P${pargaIndex}`}
                    className="h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={quantidadeField}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Nº Chapas *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    placeholder="0"
                    className="h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dimensões */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Dimensões (cm)</p>
          <div className="grid grid-cols-3 gap-2">
            <FormField
              control={form.control}
              name={comprimentoField}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Comp.</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={alturaField}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Altura</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={espessuraField}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Esp.</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Fotos */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Fotografias</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Foto 1ª Chapa */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">1ª Chapa</p>
              {foto1Url ? (
                <div className="relative aspect-[4/3] rounded-md overflow-hidden border bg-muted">
                  <img
                    src={foto1Url}
                    alt="1ª Chapa"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removePhoto(1)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-md border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <Camera className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, 1)}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>

            {/* Foto Última Chapa */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Última Chapa</p>
              {foto2Url ? (
                <div className="relative aspect-[4/3] rounded-md overflow-hidden border bg-muted">
                  <img
                    src={foto2Url}
                    alt="Última Chapa"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removePhoto(2)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-md border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <Camera className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, 2)}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
