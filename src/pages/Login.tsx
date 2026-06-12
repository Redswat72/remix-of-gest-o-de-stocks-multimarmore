import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresa } from '@/context/EmpresaContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAppT } from '@/hooks/useAppT';
import { AppLanguageSelector } from '@/components/AppLanguageSelector';

export default function Login() {
  const { user, loading, signIn, signUp } = useAuth();
  const { empresaConfig } = useEmpresa();
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useAppT();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupNome, setSignupNome] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        title: t('auth.errorLoginTitle'),
        description: t('auth.errorLoginDesc'),
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: t('toasts.errorTitle'),
        description: t('auth.errorPasswordMismatch'),
        variant: 'destructive',
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: t('toasts.errorTitle'),
        description: t('auth.errorPasswordShort'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await signUp(signupEmail, signupPassword, signupNome);

    if (error) {
      toast({
        title: t('auth.errorSignupTitle'),
        description: error.message || t('auth.errorSignupDesc'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('auth.signupSuccessTitle'),
        description: t('auth.signupSuccessDesc'),
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <AppLanguageSelector />
        </div>

        <div className="flex flex-col items-center mb-8">
          <img
            src={empresaConfig?.logo}
            alt={empresaConfig?.nome ?? 'Empresa'}
            className="h-40 w-auto object-contain mb-4"
          />
          <p className="text-muted-foreground text-center">
            {t('auth.platformTagline')}
          </p>
        </div>

        <Card className="shadow-lg border-border">
          <Tabs defaultValue="login">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('auth.tabLogin')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.tabSignup')}</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <CardTitle className="mb-2 text-lg">{t('auth.loginTitle')}</CardTitle>
                <CardDescription className="mb-6">
                  {t('auth.loginSubtitle')}
                </CardDescription>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('auth.email')}</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('auth.password')}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
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
                        {t('auth.submittingLogin')}
                      </>
                    ) : (
                      t('auth.submitLogin')
                    )}
                  </Button>
                  <button type="button" onClick={() => navigate('/selecionar-empresa')} className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors">
                    {t('auth.chooseAnotherCompany')}
                  </button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-0">
                <CardTitle className="mb-2 text-lg">{t('auth.signupTitle')}</CardTitle>
                <CardDescription className="mb-6">
                  {t('auth.signupSubtitle')}
                </CardDescription>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-nome">{t('auth.fullName')}</Label>
                    <Input
                      id="signup-nome"
                      type="text"
                      placeholder={t('auth.fullNamePlaceholder')}
                      value={signupNome}
                      onChange={(e) => setSignupNome(e.target.value)}
                      required
                      autoComplete="name"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('auth.email')}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('auth.password')}</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">{t('auth.confirmPassword')}</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                      minLength={6}
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
                        {t('auth.submittingSignup')}
                      </>
                    ) : (
                      t('auth.submitSignup')
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Crafting Iconic Elegance
        </p>
      </div>
    </div>
  );
}
