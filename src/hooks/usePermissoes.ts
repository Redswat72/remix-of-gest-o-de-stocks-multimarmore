import { useAuth } from '@/hooks/useAuth';

/**
 * Utilizadores autorizados a registar entradas apenas num parque específico.
 * (Ana e Vanessa — entradas de chapas no parque MTX MM003)
 */
const ENTRADA_PARQUE_RESTRITO: Record<string, string> = {
  'ana.pombeiro@multimarmore.pt': 'MM003',
  'vanessa.nunes@multimarmore.pt': 'MM003',
};

/** Parque onde é permitido lançar produções (serrar/dividir blocos). */
export const PARQUE_PRODUCAO = 'MM002';

/**
 * Hook de permissões centralizado, baseado no papel de maior prioridade
 * (superadmin > admin > comercial > operador).
 */
export function usePermissoes() {
  const {
    isAdmin,
    isSuperadmin,
    isComercial,
    isOperador,
    podeRegistarMovimento,
    profile,
    userLocal,
  } = useAuth();

  const email = (profile?.email ?? '').toLowerCase();
  const entradaParqueRestrito = isSuperadmin ? null : (ENTRADA_PARQUE_RESTRITO[email] ?? null);

  // Operadores estão limitados ao parque atribuído em profiles.local_id
  const restritoAoParque = isOperador && !!userLocal;

  return {
    podeVerValores: isAdmin || isComercial,
    podeRegistarMovimento,
    podeValidarMovimentos: isAdmin,
    // Parque do operador (código + id) e flag de restrição
    restritoAoParque,
    parqueOperadorId: restritoAoParque ? userLocal!.id : null,
    parqueOperadorCodigo: restritoAoParque ? userLocal!.codigo : null,
    parqueOperadorNome: restritoAoParque ? userLocal!.nome : null,
    entradaParqueRestrito,
    podeEditarDimensoes: isAdmin,
  };
}
