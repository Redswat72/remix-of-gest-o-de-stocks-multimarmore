import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresa } from '@/context/EmpresaContext';
import { Loader2 } from 'lucide-react';
import type { AppRole } from '@/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
  adminOnly?: boolean;
  superadminOnly?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  adminOnly = false,
  superadminOnly = false 
}: ProtectedRouteProps) {
  const { user, loading, hasRole, isAdmin, isSuperadmin } = useAuth();
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

  return <>{children}</>;
}
