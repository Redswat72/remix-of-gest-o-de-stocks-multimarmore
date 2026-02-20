import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import type { Produto } from '@/types/database';

export function useProdutoByIdmm(idmm?: string) {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['produto-idmm', idmm],
    queryFn: async () => {
      if (!idmm) return null;

      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('idmm', idmm)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data as Produto;
    },
    enabled: !!idmm,
  });
}
