import { useTranslation } from 'react-i18next';

/**
 * Hook de tradução para a app interna (namespace 'app').
 * Devolve apenas a função t pré-vinculada ao namespace.
 */
export function useAppT() {
  const { t } = useTranslation('app');
  return t;
}

/**
 * Hook completo: devolve t + i18n para casos que precisem do idioma ativo.
 */
export function useAppTranslation() {
  return useTranslation('app');
}
