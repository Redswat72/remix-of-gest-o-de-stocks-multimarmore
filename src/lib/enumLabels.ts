import { useAppT } from '@/hooks/useAppT';

/**
 * Grupos de enums armazenados na BD. Os valores das BD nunca são traduzidos
 * em writes/filters — só na apresentação, via este helper.
 */
export type EnumGroup =
  | 'tipoMovimento'
  | 'tipoDocumento'
  | 'role'
  | 'tipoProduto'
  | 'status'
  | 'company';

/**
 * Hook que devolve uma função para traduzir valores de enum vindos da BD.
 * Fallback seguro: se a chave não existir no dicionário, devolve o valor original
 * tal como veio da BD (nunca vazio, nunca erro).
 *
 * Exemplo:
 *   const enumLabel = useEnumLabel();
 *   enumLabel('tipoMovimento', 'saida') // PT: 'Saída'  EN: 'Dispatch'
 */
export function useEnumLabel() {
  const t = useAppT();
  return (group: EnumGroup, value?: string | null): string => {
    if (value == null || value === '') return '';
    const key = `enums.${group}.${value}`;
    const translated = t(key);
    // i18next devolve a key crua se não encontrar — usamos isso como sinal.
    return translated === key ? value : translated;
  };
}
