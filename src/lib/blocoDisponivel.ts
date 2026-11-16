/**
 * Um bloco só está disponível (stock/produto) se tiver peso > 0 kg e não estiver
 * explicitamente inativo. Zero/NULL/negativo = consumido, qualquer que seja `ativo`.
 * Os registos ficam na BD e no histórico; isto só decide a visibilidade operacional.
 */
export function isBlocoDisponivel(b: { quantidade_kg?: number | string | null; ativo?: boolean | null } | null | undefined): boolean {
  if (!b) return false;
  if (b.ativo === false) return false;
  const kg = Number(b.quantidade_kg);
  return Number.isFinite(kg) && b.quantidade_kg !== null && b.quantidade_kg !== '' && kg > 0;
}
