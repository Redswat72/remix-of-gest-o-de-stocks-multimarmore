/**
 * Regras puras de permissão de produção por parque.
 * - MM002 (Plurirochas): admins ou operadores do MM002 → chapas e divisão em blocos.
 * - MM003 (MTX): admins → só chapas.
 * - MM001 (Sede/Bencatel): só chapas, e só com grant explícito em
 *   permissoes_producao_parque (MM001/'chapas') + (admin OU operador MM001 com tem_producao).
 *   Ser admin NÃO basta. Ninguém divide blocos em MM001.
 */
export type OperacaoProducao = 'chapas' | 'blocos';

export interface ContextoPermissaoProducao {
  parqueBloco: string | null | undefined;
  isAdmin: boolean; // admin ou superadmin
  isOperador: boolean;
  userLocalCodigo: string | null | undefined;
  temProducao: boolean | null | undefined;
  /** true só se a consulta terminou com sucesso e existe a linha MM001/chapas */
  grantMM001Chapas: boolean;
}

export type MotivoBloqueio = 'ok' | 'parque_nao_produtivo' | 'sem_autorizacao_parque' | 'operacao_nao_permitida';

export function normalizarParque(p: string | null | undefined): string {
  return (p ?? '').replace(/[[\]\s]/g, '').toUpperCase();
}

export function verificarPermissaoProducao(ctx: ContextoPermissaoProducao, op: OperacaoProducao): MotivoBloqueio {
  const parque = normalizarParque(ctx.parqueBloco);
  const local = normalizarParque(ctx.userLocalCodigo);
  if (parque === 'MM002') {
    return ctx.isAdmin || (ctx.isOperador && local === 'MM002') ? 'ok' : 'sem_autorizacao_parque';
  }
  if (parque === 'MM003') {
    if (!ctx.isAdmin) return 'sem_autorizacao_parque';
    return op === 'chapas' ? 'ok' : 'operacao_nao_permitida';
  }
  if (parque === 'MM001') {
    const elegivel = ctx.isAdmin || (ctx.isOperador && local === 'MM001' && ctx.temProducao === true);
    if (!ctx.grantMM001Chapas || !elegivel) return 'sem_autorizacao_parque';
    return op === 'chapas' ? 'ok' : 'operacao_nao_permitida';
  }
  return 'parque_nao_produtivo';
}

export function podeProduzirOp(ctx: ContextoPermissaoProducao, op: OperacaoProducao): boolean {
  return verificarPermissaoProducao(ctx, op) === 'ok';
}

/** Interpreta as linhas devolvidas pela tabela de grants. */
export function temGrantMM001Chapas(rows: Array<{ parque_codigo: string; operacao: string }> | null | undefined): boolean {
  return !!rows?.some(r => normalizarParque(r.parque_codigo) === 'MM001' && r.operacao === 'chapas');
}
