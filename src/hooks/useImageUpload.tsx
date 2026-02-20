import { useState } from 'react';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';

// Tipo de nomeação automática
type NamingType = 
  | { type: 'avatar'; userId: string }
  | { type: 'produto'; idmm: string; slot: 'F1' | 'F2' | 'F3' | 'F4' }
  | { type: 'produto_hd'; idmm: string; slot: 'F1' | 'F2' | 'F3' | 'F4' };

// Tipo de qualidade de imagem
type ImageMode = 'operacional' | 'hd';

interface UploadOptions {
  bucket: 'avatars' | 'produtos' | 'produtos_hd';
  naming: NamingType;
  imageMode?: ImageMode;
  maxSizeKB?: number;
  maxWidth?: number;
  maxHeight?: number;
  jpegQuality?: number;
}

interface UploadResult {
  url: string;
  path: string;
}

// Gerar nome do ficheiro conforme as regras
function generateFileName(naming: NamingType): string {
  const timestamp = Date.now();
  
  if (naming.type === 'avatar') {
    return `avatar_${naming.userId}_${timestamp}.jpg`;
  } else if (naming.type === 'produto') {
    const cleanIdmm = naming.idmm.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `produto_${cleanIdmm}_${naming.slot}_${timestamp}.jpg`;
  } else {
    const cleanIdmm = naming.idmm.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `produto_hd_${cleanIdmm}_${naming.slot}_${timestamp}.jpg`;
  }
}

async function fixImageOrientation(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Erro ao criar contexto do canvas')); return; }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => { if (blob) resolve(blob); else reject(new Error('Erro ao processar imagem')); },
          'image/jpeg',
          1.0
        );
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    };
    reader.onerror = () => reject(new Error('Erro ao ler ficheiro'));
  });
}

async function compressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<Blob> {
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
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        if (ratio < 1) { width = Math.round(width * ratio); height = Math.round(height * ratio); }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Erro ao criar contexto do canvas')); return; }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => { if (blob) resolve(blob); else reject(new Error('Erro ao comprimir imagem')); },
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
  const supabase = useSupabaseEmpresa();
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
      imageMode = 'operacional',
      maxSizeKB = 500,
      maxWidth = 2000,
      maxHeight = 2000,
      jpegQuality = 0.85,
    } = options;

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione um ficheiro de imagem');
      }

      setProgress(20);

      let imageBlob: Blob;

      if (imageMode === 'hd') {
        imageBlob = await fixImageOrientation(file);
        if (imageBlob.size > 20 * 1024 * 1024) {
          throw new Error('Imagem HD demasiado grande. Máximo permitido: 20MB');
        }
      } else {
        imageBlob = await compressImage(file, maxWidth, maxHeight, jpegQuality);
        if (imageBlob.size > maxSizeKB * 1024 * 2) {
          imageBlob = await compressImage(file, maxWidth, maxHeight, jpegQuality * 0.7);
          if (imageBlob.size > maxSizeKB * 1024 * 3) {
            throw new Error(`Imagem demasiado grande após compressão`);
          }
        }
      }

      setProgress(50);

      const fileName = generateFileName(naming);
      const filePath = fileName;

      setProgress(70);

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, imageBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('[useImageUpload] Upload error:', {
          message: uploadError.message,
          name: uploadError.name,
          bucket,
          filePath,
          error: uploadError,
        });
        
        const isBucketError = 
          uploadError.message.includes('Bucket not found') ||
          uploadError.message.includes('bucket') ||
          uploadError.message.includes('not found') ||
          uploadError.message.includes('403') ||
          uploadError.message.includes('permission') ||
          uploadError.message.includes('policy');
          
        if (isBucketError) {
          throw new Error(
            `Bucket "${bucket}" não encontrado ou sem permissões. ` +
            `Verifique se o bucket existe no Supabase Storage externo e tem policies de INSERT para utilizadores autenticados.`
          );
        }
        
        if (uploadError.message.includes('already exists') || uploadError.message.includes('Duplicate')) {
          const newFileName = fileName.replace('.jpg', `_${Math.random().toString(36).substring(2, 6)}.jpg`);
          const retryResult = await supabase.storage
            .from(bucket)
            .upload(newFileName, imageBlob, {
              contentType: 'image/jpeg',
              upsert: false,
            });
          
          if (retryResult.error) {
            console.error('[useImageUpload] Retry upload error:', retryResult.error);
            throw retryResult.error;
          }
          
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

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress(100);

      return {
        url: urlData.publicUrl,
        path: data.path,
      };
    } catch (err) {
      console.error('[useImageUpload] Error:', err);
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
