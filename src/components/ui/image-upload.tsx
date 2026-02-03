import { useState, useRef, useCallback } from 'react';
import { Camera, ImagePlus, X, Loader2, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<string | null>;
  onDelete?: () => Promise<boolean>;
  isUploading?: boolean;
  progress?: number;
  disabled?: boolean;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  placeholder?: string;
  showCamera?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  onDelete,
  isUploading = false,
  progress = 0,
  disabled = false,
  className,
  aspectRatio = 'square',
  placeholder = 'Adicionar foto',
  showCamera = true,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    // Criar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setPendingFile(file);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;

    const url = await onUpload(pendingFile);
    if (url) {
      onChange(url);
      setPreview(null);
      setPendingFile(null);
    }
  };

  const handleCancelPreview = () => {
    setPreview(null);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleRemove = async () => {
    if (onDelete) {
      const success = await onDelete();
      if (success) {
        onChange(null);
      }
    } else {
      onChange(null);
    }
  };

  const displayImage = preview || value;
  const isPending = !!preview && !!pendingFile;

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed border-border bg-muted/30 overflow-hidden transition-all',
          aspectClasses[aspectRatio],
          !displayImage && 'hover:border-primary/50 hover:bg-muted/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            
            {/* Overlay de upload em progresso */}
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <Progress value={progress} className="w-3/4 h-2" />
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
            )}

            {/* Botões de ação para preview pendente */}
            {isPending && !isUploading && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center gap-3">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={handleCancelPreview}
                  className="touch-target"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={handleConfirmUpload}
                  className="touch-target gap-2"
                >
                  <Check className="w-5 h-5" />
                  Guardar
                </Button>
              </div>
            )}

            {/* Botão de remover para imagem já guardada */}
            {!isPending && !isUploading && (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
            <div className="flex gap-3">
              {/* Botão Galeria */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="touch-target gap-2"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="hidden sm:inline">Galeria</span>
              </Button>

              {/* Botão Câmara */}
              {showCamera && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="touch-target gap-2"
                >
                  <Camera className="w-5 h-5" />
                  <span className="hidden sm:inline">Câmara</span>
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center">{placeholder}</p>
          </div>
        )}
      </div>

      {/* Input para galeria */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Input para câmara */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}

// Componente para múltiplas imagens (até 4 fotos de produtos)
interface MultiImageUploadProps {
  values: (string | null)[];
  onChange: (urls: (string | null)[]) => void;
  onUpload: (file: File, index: number) => Promise<string | null>;
  onDelete?: (index: number) => Promise<boolean>;
  isUploading?: boolean;
  progress?: number;
  disabled?: boolean;
  maxImages?: number;
}

export function MultiImageUpload({
  values,
  onChange,
  onUpload,
  onDelete,
  isUploading = false,
  progress = 0,
  disabled = false,
  maxImages = 4,
}: MultiImageUploadProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleUpload = async (file: File, index: number) => {
    setUploadingIndex(index);
    const url = await onUpload(file, index);
    setUploadingIndex(null);
    return url;
  };

  const handleChange = (url: string | null, index: number) => {
    const newValues = [...values];
    newValues[index] = url;
    onChange(newValues);
  };

  const handleDelete = async (index: number) => {
    if (onDelete) {
      return await onDelete(index);
    }
    return true;
  };

  // Garantir que temos sempre o número máximo de slots
  const slots = Array(maxImages).fill(null).map((_, i) => values[i] || null);

  return (
    <div className="grid grid-cols-2 gap-3">
      {slots.map((value, index) => (
        <ImageUpload
          key={index}
          value={value}
          onChange={(url) => handleChange(url, index)}
          onUpload={(file) => handleUpload(file, index)}
          onDelete={() => handleDelete(index)}
          isUploading={isUploading && uploadingIndex === index}
          progress={uploadingIndex === index ? progress : 0}
          disabled={disabled}
          placeholder={`Foto ${index + 1}`}
          aspectRatio="square"
        />
      ))}
    </div>
  );
}
