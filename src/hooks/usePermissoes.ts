import { useAuth } from '@/hooks/useAuth';

/**
 * Hook de permissões centralizado.
 * podeVerValores: true se o utilizador é admin, superadmin ou área comercial.
 */
export function usePermissoes() {
  const { isAdmin, hasRole } = useAuth();
  return {
    podeVerValores: isAdmin || hasRole('comercial') || hasRole('area_comercial'),
  };
}
