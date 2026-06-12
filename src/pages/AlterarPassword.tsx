import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresa } from '@/context/EmpresaContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';
import { useAppT } from '@/hooks/useAppT';
import { AppLanguageSelector } from '@/components/AppLanguageSelector';

export default function AlterarPassword() {
  const { user, profile, refreshProfile, loading } = useAuth();
  const { supabaseEmpresa, empresaConfig } = useEmpresa();
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useAppT();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!loading && profile && profile.deve_alterar_password === false) {
    return <Navigate to="/" replace />;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: t('toasts.errorTitle'),
        description: t('auth.errorPasswordMismatch'),
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: t('toasts.errorTitle'),
        description: t('auth.errorPasswordShort8'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!supabaseEmpresa) throw new Error(t('auth.noConnection'));
      if (!user) throw new Error(t('auth.invalidSession'));

      const { error: authError } = await supabaseEmpresa.auth.updateUser({
        password: newPassword,
        data: { password_changed: true },
      });

      if (authError) throw authError;

      const { error: profileError } = await supabaseEmpresa
        .from('profiles')
        .update({ deve_alterar_password: false })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast({
        title: t('auth.passwordSetTitle'),
        description: t('auth.passwordSetDesc'),
      });

      await refreshProfile();
      navigate('/', { replace: true });
    } catch (error: any) {
      toast({
        title: t('auth.passwordErrorTitle'),
        description: error.message || t('auth.passwordErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <AppLanguageSelector />
        </div>

        <div className="flex flex-col items-center mb-8">
          {empresaConfig?.logo && (
            <img
              src={empresaConfig.logo}
              alt={empresaConfig?.nome ?? 'Empresa'}
              className="h-32 w-auto object-contain mb-4"
            />
          )}
        </div>

        <Card className="shadow-2xl border-border/40 bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">{t('auth.changePasswordTitle')}</CardTitle>
            <CardDescription>
              {t('auth.changePasswordSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t('auth.newPassword')}</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.savingPassword')}
                  </>
                ) : (
                  t('auth.savePassword')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Crafting Iconic Elegance
        </p>
      </div>
    </div>
  );
}
