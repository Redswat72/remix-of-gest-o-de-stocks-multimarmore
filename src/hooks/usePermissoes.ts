import { useAuth } from '@/hooks/useAuth';

/** Parque onde é permitido lançar produções (serrar/dividir blocos). */
export const PARQUE_PRODUCAO = 'MM002';

/**
 * Hook de permissões centralizado, baseado no papel de maior prioridade
 * (superadmin > admin > comercial > operador).
 * As permissões vêm SEMPRE do papel em user_roles e, para operadores,
 * do parque em profiles.local_id — nunca de emails fixos no código.
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
    podeEditarDimensoes: isAdmin,
  };
}
