import { useAuth } from '@/hooks/useAuth';

/**
 * Utilizadores autorizados a registar entradas apenas num parque específico.
 * (Ana e Vanessa — entradas de chapas no parque MTX MM003)
 */
const ENTRADA_PARQUE_RESTRITO: Record<string, string> = {
  'ana.pombeiro@multimarmore.pt': 'MM003',
  'vanessa.nunes@multimarmore.pt': 'MM003',
};

/**
 * Hook de permissões centralizado.
 * podeVerValores: true se o utilizador é admin, superadmin ou área comercial.
 * entradaParqueRestrito: código do parque ao qual as entradas estão limitadas (ou null).
 */
export function usePermissoes() {
  const { isAdmin, hasRole, isSuperadmin, profile } = useAuth();
  const email = (profile?.email ?? '').toLowerCase();
  const entradaParqueRestrito = isSuperadmin ? null : (ENTRADA_PARQUE_RESTRITO[email] ?? null);

  return {
    podeVerValores: isAdmin || hasRole('comercial') || hasRole('area_comercial'),
    entradaParqueRestrito,
  };
}
