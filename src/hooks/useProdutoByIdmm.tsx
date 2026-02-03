import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Produto } from '@/types/database';

export function useProdutoByIdmm(idmm?: string) {
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
          // Produto não encontrado
          return null;
        }
        throw error;
      }
      return data as Produto;
    },
    enabled: !!idmm,
  });
}
