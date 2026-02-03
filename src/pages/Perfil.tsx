import { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from '@/components/ui/image-upload';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useProfiles';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/use-toast';

export default function Perfil() {
  const { toast } = useToast();
  const { user, profile, roles, userLocal, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();
  const { uploadImage, deleteImage, isUploading, progress, error: uploadError } = useImageUpload();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar dados do perfil
  useEffect(() => {
    if (profile) {
      setNome(profile.nome || '');
      setTelefone((profile as { telefone?: string }).telefone || '');
      setAvatarUrl((profile as { avatar_url?: string }).avatar_url || null);
    }
  }, [profile]);

  // Verificar alterações
  useEffect(() => {
    if (profile) {
      const profileData = profile as { telefone?: string; avatar_url?: string };
      const changed = 
        nome !== profile.nome ||
        telefone !== (profileData.telefone || '') ||
        avatarUrl !== (profileData.avatar_url || null);
      setHasChanges(changed);
    }
  }, [nome, telefone, avatarUrl, profile]);

  const handleAvatarUpload = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const result = await uploadImage(file, {
      bucket: 'avatars',
      naming: { type: 'avatar', userId: user.id },
      maxSizeKB: 300,
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.85,
    });

    if (result) {
      setAvatarUrl(result.url);
      return result.url;
    }
    return null;
  };

  const handleAvatarDelete = async (): Promise<boolean> => {
    if (!user || !avatarUrl) return true;
    
    // Extrair path do URL
    const urlParts = avatarUrl.split('/avatars/');
    if (urlParts.length > 1) {
      await deleteImage('avatars', urlParts[1]);
    }
    
    setAvatarUrl(null);
    return true;
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        data: {
          nome,
          telefone: telefone || null,
          avatar_url: avatarUrl,
        },
      });

      await refreshProfile();
      
      toast({
        title: 'Perfil atualizado',
        description: 'As suas alterações foram guardadas com sucesso.',
      });
      
      setHasChanges(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao guardar',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = () => {
    if (roles.includes('superadmin')) {
      return { label: 'Superadmin', className: 'badge-superadmin' };
    }
    if (roles.includes('admin')) {
      return { label: 'Admin', className: 'badge-admin' };
    }
    return { label: 'Operador', className: 'badge-operador' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">O Meu Perfil</h1>
          <p className="text-muted-foreground">Gerir informações pessoais</p>
        </div>
      </div>

      {/* Foto de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Foto de Perfil</CardTitle>
          <CardDescription>
            Adicione uma foto para facilitar a identificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32">
              <ImageUpload
                value={avatarUrl}
                onChange={setAvatarUrl}
                onUpload={handleAvatarUpload}
                onDelete={handleAvatarDelete}
                isUploading={isUploading}
                progress={progress}
                aspectRatio="square"
                placeholder="Foto"
                className="w-full h-full"
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                Formatos suportados: JPG, PNG<br />
                Tamanho máximo: 5MB<br />
                A imagem será redimensionada para 400×400px
              </p>
            </div>
          </div>
          {uploadError && (
            <p className="text-sm text-destructive mt-2">{uploadError}</p>
          )}
        </CardContent>
      </Card>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Pessoais</CardTitle>
          <CardDescription>
            Informações da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="O seu nome"
              className="touch-target"
            />
          </div>

          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              value={profile?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado
            </p>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone / Telemóvel
            </Label>
            <Input
              id="telefone"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="+351 912 345 678"
              className="touch-target"
            />
          </div>

          <Separator />

          {/* Info adicional (readonly) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Role
              </Label>
              <div>
                <Badge variant="outline" className={roleBadge.className}>
                  {roleBadge.label}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Parque Atribuído
              </Label>
              <div>
                {userLocal ? (
                  <Badge variant="outline" className="bg-muted">
                    📍 {userLocal.nome}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Sem parque atribuído
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateProfile.isPending}
          size="lg"
          className="touch-target gap-2"
        >
          {updateProfile.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Guardar Alterações
        </Button>
      </div>
    </div>
  );
}
