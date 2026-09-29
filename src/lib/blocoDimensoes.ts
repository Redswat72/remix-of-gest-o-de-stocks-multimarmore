type BlocoComDimensoes = {
  comprimento?: unknown;
  largura?: unknown;
  altura?: unknown;
};

function formatMedida(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const numero = Number(value);
  if (!Number.isFinite(numero)) return '';
  return String(Math.round(numero * 100) / 100).replace('.', ',');
}

export function formatBlocoDimensoes(bloco: BlocoComDimensoes | null | undefined): string {
  if (!bloco) return '';
  const medidas = [bloco.comprimento, bloco.largura, bloco.altura].map(formatMedida);
  return medidas.some(Boolean) ? medidas.join(' x ') : '';
}