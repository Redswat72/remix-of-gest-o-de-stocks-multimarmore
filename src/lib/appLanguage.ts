import i18n from '@/i18n';

export type AppLanguage = 'pt' | 'en';
const STORAGE_KEY = 'app-language';

function normalize(lng: string | null | undefined): AppLanguage {
  if (!lng) return 'pt';
  if (lng.toLowerCase().startsWith('en')) return 'en';
  return 'pt';
}

/** Lê o idioma preferido para a app interna (default: pt). */
export function getAppLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'pt';
  return normalize(localStorage.getItem(STORAGE_KEY));
}

/**
 * Define o idioma da app interna: aplica em i18next e persiste em localStorage.
 * Não toca em 'store-language' (chave da loja pública).
 */
export function setAppLanguage(lng: AppLanguage): void {
  const value = normalize(lng);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, value);
  }
  if (i18n.language !== value) {
    void i18n.changeLanguage(value);
  }
}

/** Aplica o idioma persistido (chamar ao montar a app interna). */
export function applyAppLanguage(): void {
  const lng = getAppLanguage();
  if (i18n.language !== lng) {
    void i18n.changeLanguage(lng);
  }
}
