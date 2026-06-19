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
import { useAppT } from '@/hooks/useAppT';
import { useEnumLabel } from '@/lib/enumLabels';

export default function Perfil() {
  const { toast } = useToast();
  const { user, profile, roles, userLocal, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();
  const { uploadImage, deleteImage, isUploading, progress, error: uploadError } = useImageUpload();
  const t = useAppT();
  const enumLabel = useEnumLabel();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || '');
      setTelefone((profile as { telefone?: string }).telefone || '');
      setAvatarUrl((profile as { avatar_url?: string }).avatar_url || null);
    }
  }, [profile]);

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
      jpegQuality: 0.85,
    });

    if (result) {
      setAvatarUrl(result.url);
      return result.url;
    }
    return null;
  };

  const handleAvatarDelete = async (): Promise<boolean> => {
    if (!user || !avatarUrl) return true;
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
        title: t('profile.updatedTitle'),
        description: t('profile.updatedDesc'),
      });

      setHasChanges(false);
    } catch (error) {
      toast({
        title: t('profile.saveErrorTitle'),
        description: error instanceof Error ? error.message : t('profile.saveErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const getRoleInfo = () => {
    if (roles.includes('superadmin')) return { value: 'superadmin', className: 'badge-superadmin' };
    if (roles.includes('admin')) return { value: 'admin', className: 'badge-admin' };
    if (roles.includes('comercial') || roles.includes('area_comercial')) return { value: 'comercial', className: 'badge-admin' };
    return { value: 'operador', className: 'badge-operador' };
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>
      </div>

      {/* Foto de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('profile.photoTitle')}</CardTitle>
          <CardDescription>{t('profile.photoSubtitle')}</CardDescription>
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
                placeholder={t('profile.photoPlaceholder')}
                className="w-full h-full"
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                {t('profile.photoFormats')}<br />
                {t('profile.photoMaxSize')}<br />
                {t('profile.photoResized')}
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
          <CardTitle className="text-lg">{t('profile.personalTitle')}</CardTitle>
          <CardDescription>{t('profile.personalSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">{t('profile.name')}</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={t('profile.namePlaceholder')}
              className="touch-target"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t('profile.email')}
            </Label>
            <Input
              id="email"
              value={profile?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              {t('profile.emailReadonly')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {t('profile.phone')}
            </Label>
            <Input
              id="telefone"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder={t('profile.phonePlaceholder')}
              className="touch-target"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">{t('profile.role')}</Label>
              <div>
                <Badge variant="outline" className={roleInfo.className}>
                  {enumLabel('role', roleInfo.value)}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('profile.assignedYard')}
              </Label>
              <div>
                {userLocal ? (
                  <Badge variant="outline" className="bg-muted">
                    📍 {userLocal.nome}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t('profile.noYard')}
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
          {t('profile.saveChanges')}
        </Button>
      </div>
    </div>
  );
}
