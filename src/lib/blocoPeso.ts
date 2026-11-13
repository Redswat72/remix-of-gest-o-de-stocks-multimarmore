import { formatNumber } from '@/lib/format';

/**
 * Peso dos blocos: a base de dados guarda sempre em kg (`quantidade_kg`).
 * A app mostra e recebe toneladas — a conversão é feita só aqui, na fronteira da UI.
 * null/undefined/'' = vazio (sem peso); 0 = zero real.
 */
export function kgToTons(kg: number | string | null | undefined): number | null {
  if (kg == null || kg === '') return null;
  const n = Number(kg);
  if (!Number.isFinite(n)) return null;
  return Math.round(n) === n ? n / 1000 : Number((n / 1000).toFixed(6));
}

export function tonsToKg(t: number | string | null | undefined): number | null {
  if (t == null || t === '') return null;
  const n = Number(String(t).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  // 0,001 t = 1 kg; arredonda a gramas para evitar ruído de vírgula flutuante
  return Math.round(n * 1000 * 1000) / 1000;
}

/** "25,000 t" — 3 casas (precisão 0,001 t = 1 kg). Vazio → '' */
export function formatTons(kg: number | string | null | undefined, decimals = 3): string {
  const t = kgToTons(kg);
  if (t == null) return '';
  return `${formatNumber(t, decimals)} t`;
}
