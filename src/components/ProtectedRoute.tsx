import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresa } from '@/context/EmpresaContext';
import { Loader2, Clock } from 'lucide-react';
import type { AppRole } from '@/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
  adminOnly?: boolean;
  superadminOnly?: boolean;
  skipPasswordCheck?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  adminOnly = false,
  superadminOnly = false,
  skipPasswordCheck = false,
}: ProtectedRouteProps) {
  const { user, loading, hasRole, isAdmin, isSuperadmin, roles, profile, signOut } = useAuth();
  const { empresa } = useEmpresa();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return <Navigate to="/selecionar-empresa" replace />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (superadminOnly && !isSuperadmin) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  // Account pending approval
  if (profile && !profile.ativo && !isAdmin && !isSuperadmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold">Conta Pendente de Aprovação</h2>
          <p className="text-muted-foreground">
            A sua conta foi criada com sucesso mas aguarda aprovação por parte de um administrador. 
            Será notificado quando a sua conta for ativada.
          </p>
          <button
            onClick={() => signOut()}
            className="text-sm text-primary hover:underline mt-2"
          >
            Terminar sessão
          </button>
        </div>
      </div>
    );
  }

  // Force password change for operators on first login
  if (
    !skipPasswordCheck &&
    !isAdmin &&
    !isSuperadmin &&
    roles.includes('operador') &&
    !user.user_metadata?.password_changed
  ) {
    return <Navigate to="/alterar-password" replace />;
  }

  return <>{children}</>;
}
