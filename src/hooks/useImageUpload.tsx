import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Tipo de nomeação automática
type NamingType = 
  | { type: 'avatar'; userId: string }
  | { type: 'produto'; idmm: string; slot: 'F1' | 'F2' | 'F3' | 'F4' };

interface UploadOptions {
  bucket: 'avatars' | 'produtos';
  naming: NamingType;
  maxSizeKB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface UploadResult {
  url: string;
  path: string;
}

// Gerar nome do ficheiro conforme as regras
function generateFileName(naming: NamingType): string {
  const timestamp = Date.now();
  
  if (naming.type === 'avatar') {
    // avatar_{userId}_{timestamp}.jpg
    return `avatar_${naming.userId}_${timestamp}.jpg`;
  } else {
    // produto_{idmm}_{slot}_{timestamp}.jpg
    // Limpar IDMM de caracteres especiais
    const cleanIdmm = naming.idmm.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `produto_${cleanIdmm}_${naming.slot}_${timestamp}.jpg`;
  }
}

// Compressão de imagem usando canvas
async function compressImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular novas dimensões mantendo proporção
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Erro ao criar contexto do canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Sempre converter para JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Erro ao comprimir imagem'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    };
    reader.onerror = () => reject(new Error('Erro ao ler ficheiro'));
  });
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (
    file: File,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    const {
      bucket,
      naming,
      maxSizeKB = 500,
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
    } = options;

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Validar tipo de ficheiro
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione um ficheiro de imagem');
      }

      setProgress(20);

      // Comprimir e converter para JPG
      const imageBlob = await compressImage(file, maxWidth, maxHeight, quality);

      // Verificar tamanho após compressão
      if (imageBlob.size > maxSizeKB * 1024) {
        // Tentar novamente com qualidade menor
        const lowerQualityBlob = await compressImage(file, maxWidth, maxHeight, quality * 0.7);
        if (lowerQualityBlob.size > maxSizeKB * 1024 * 2) {
          throw new Error(`Imagem demasiado grande. Máximo permitido: ${maxSizeKB * 2}KB`);
        }
      }

      setProgress(50);

      // Gerar nome único conforme regras
      const fileName = generateFileName(naming);
      const filePath = fileName;

      setProgress(70);

      // Fazer upload SEM upsert para não sobrescrever
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, imageBlob, {
          contentType: 'image/jpeg',
          upsert: false, // NÃO sobrescrever ficheiros existentes
        });

      if (uploadError) {
        // Se já existir, gerar novo nome com sufixo aleatório
        if (uploadError.message.includes('already exists') || uploadError.message.includes('Duplicate')) {
          const newFileName = fileName.replace('.jpg', `_${Math.random().toString(36).substring(2, 6)}.jpg`);
          const retryResult = await supabase.storage
            .from(bucket)
            .upload(newFileName, imageBlob, {
              contentType: 'image/jpeg',
              upsert: false,
            });
          
          if (retryResult.error) throw retryResult.error;
          
          setProgress(90);
          
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(retryResult.data.path);

          setProgress(100);

          return {
            url: urlData.publicUrl,
            path: retryResult.data.path,
          };
        }
        throw uploadError;
      }

      setProgress(90);

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress(100);

      return {
        url: urlData.publicUrl,
        path: data.path,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (bucket: string, path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao eliminar imagem';
      setError(message);
      return false;
    }
  };

  const reset = () => {
    setProgress(0);
    setError(null);
  };

  return {
    uploadImage,
    deleteImage,
    isUploading,
    progress,
    error,
    reset,
  };
}
