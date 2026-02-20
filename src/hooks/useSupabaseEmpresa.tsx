import { useEmpresa } from '@/context/EmpresaContext';

/**
 * Hook utilitário que retorna o cliente Supabase da empresa selecionada.
 * Lança erro se nenhuma empresa estiver selecionada.
 */
export function useSupabaseEmpresa() {
  const { supabaseEmpresa, empresa, empresaConfig } = useEmpresa();

  if (!supabaseEmpresa || !empresa || !empresaConfig) {
    throw new Error('Nenhuma empresa selecionada. Selecione uma empresa primeiro.');
  }

  return {
    client: supabaseEmpresa,
    empresa,
    empresaConfig,
  };
}
