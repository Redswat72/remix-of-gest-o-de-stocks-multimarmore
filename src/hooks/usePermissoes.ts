import { useAuth } from '@/hooks/useAuth';

/**
 * Hook de permissões centralizado.
 * podeVerValores: true se o utilizador é admin ou superadmin.
 */
export function usePermissoes() {
  const { isAdmin } = useAuth();
  return {
    podeVerValores: isAdmin, // isAdmin já inclui superadmin
  };
}
