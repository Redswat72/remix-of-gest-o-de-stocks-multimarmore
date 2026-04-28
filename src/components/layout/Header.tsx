import { Bell, Search, LogOut, Sun, Moon, Monitor, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useEmpresa } from '@/context/EmpresaContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export function Header() {
  const { profile, roles, signOut, userLocal } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { empresaConfig } = useEmpresa();

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
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

  const forceRefresh = async () => {
    try {
      toast.loading('A limpar cache e atualizar...', { id: 'force-refresh' });
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      // Clear all caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (e) {
      console.error('Erro ao limpar cache:', e);
    } finally {
      // Hard reload bypassing cache
      const url = new URL(window.location.href);
      url.searchParams.set('_t', Date.now().toString());
      window.location.replace(url.toString());
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card px-4 lg:px-6 flex items-center justify-between">
      {/* Mobile Logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <Link to="/">
          <img 
            src={empresaConfig?.logo} 
            alt={empresaConfig?.nome ?? 'Empresa'} 
            className="h-9 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Search - Desktop only */}
      <div className="hidden lg:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pesquisar produtos, clientes..."
            className="pl-9 bg-muted/50 border-transparent focus:border-border focus:bg-background"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Local atual */}
        {userLocal && (
          <Badge variant="outline" className="hidden sm:flex bg-muted/50 text-foreground border-border">
            📍 {userLocal.nome}
          </Badge>
        )}

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              {resolvedTheme === 'dark' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
              <Sun className="w-4 h-4" />
              Claro
              {theme === 'light' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
              <Moon className="w-4 h-4" />
              Escuro
              {theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
              <Monitor className="w-4 h-4" />
              Sistema
              {theme === 'system' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Force Refresh / Update App */}
        <Button
          variant="ghost"
          size="icon"
          onClick={forceRefresh}
          title="Atualizar app (limpar cache)"
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-5 h-5" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-border">
                {(profile as { avatar_url?: string })?.avatar_url && (
                  <AvatarImage 
                    src={(profile as { avatar_url?: string }).avatar_url!} 
                    alt={profile?.nome || 'Avatar'} 
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {profile ? getInitials(profile.nome) : '??'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-foreground">{profile?.nome}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
                <Badge variant="outline" className={`w-fit mt-1 ${roleBadge.className}`}>
                  {roleBadge.label}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/perfil" className="flex items-center cursor-pointer">
                <span>O Meu Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
