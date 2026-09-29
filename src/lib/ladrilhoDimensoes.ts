type LadrilhoComDimensoes = {
  comprimento?: unknown;
  largura?: unknown;
  altura?: unknown;
  espessura?: unknown;
};

function formatMedida(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const numero = Number(value);
  if (!Number.isFinite(numero)) return '';
  return String(Math.round(numero * 100) / 100).replace('.', ',');
}

export function formatLadrilhoDimensoes(ladrilho: LadrilhoComDimensoes | null | undefined): string {
  if (!ladrilho) return '';
  const medidas = [
    ladrilho.comprimento,
    ladrilho.largura,
    ladrilho.altura,
    ladrilho.espessura,
  ].map(formatMedida);
  return medidas.some(Boolean) ? medidas.join(' x ') : '';
}