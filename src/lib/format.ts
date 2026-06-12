import i18n from '@/i18n';

/** Locale BCP-47 ativa com base no idioma da app. */
export function getActiveLocale(): string {
  return i18n.language?.startsWith('en') ? 'en-GB' : 'pt-PT';
}

export function useLocale(): string {
  return getActiveLocale();
}

function asDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: Date | string | number | null | undefined): string {
  const d = asDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(getActiveLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(value: Date | string | number | null | undefined): string {
  const d = asDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(getActiveLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value as number)) return '';
  return new Intl.NumberFormat(getActiveLocale(), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value as number);
}

export function formatCurrency(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value as number)) return '';
  return new Intl.NumberFormat(getActiveLocale(), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value as number);
}

export function formatWeight(kg: number | null | undefined, decimals = 0): string {
  if (kg == null) return '';
  return `${formatNumber(kg, decimals)} kg`;
}

export function formatVolume(m3: number | null | undefined, decimals = 3): string {
  if (m3 == null) return '';
  return `${formatNumber(m3, decimals)} m³`;
}

export function formatArea(m2: number | null | undefined, decimals = 2): string {
  if (m2 == null) return '';
  return `${formatNumber(m2, decimals)} m²`;
}
