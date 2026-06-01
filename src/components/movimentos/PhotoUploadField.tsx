import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { cn } from '@/lib/utils';

interface PhotoUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  idMM: string;
  fileLabel: string; // e.g. "foto1"
  folder?: string; // default "movimentos"
  disabled?: boolean;
}

export function PhotoUploadField({
  value,
  onChange,
  idMM,
  fileLabel,
  folder = 'movimentos',
  disabled,
}: PhotoUploadFieldProps) {
  const supabase = useSupabaseEmpresa();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Ficheiro inválido', description: 'Selecione uma imagem.', variant: 'destructive' });
      return;
    }
    const safeId = (idMM || 'sem_id').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${folder}/${safeId}/${Date.now()}_${fileLabel}.${ext}`;

    setUploading(true);
    try {
      const { data, error } = await supabase.storage
        .from('produtos')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const url = supabase.storage.from('produtos').getPublicUrl(data.path).data.publicUrl;
      onChange(url);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar foto',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
        disabled={disabled || uploading}
      />
      {value ? (
        <div className="relative rounded-lg border overflow-hidden aspect-square bg-muted/30">
          <img src={value} alt={fileLabel} className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              title="Substituir"
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={handleRemove}
              disabled={disabled || uploading}
              title="Remover"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className={cn(
            'w-full min-h-[88px] rounded-lg border-2 border-dashed border-border bg-muted/30',
            'flex flex-col items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground',
            'hover:border-primary/50 hover:bg-muted/50 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>A carregar...</span>
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              <span className="text-center leading-tight">Tirar foto ou escolher da galeria</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
