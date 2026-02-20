import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';
import type { Chapa } from '@/types/inventario';

export function useChapas(parque?: string, bundleId?: string) {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['chapas', parque, bundleId],
    queryFn: async () => {
      let query = supabase
        .from('chapas')
        .select('*')
        .order('created_at', { ascending: false });

      if (parque) {
        query = query.eq('parque', parque);
      }

      if (bundleId) {
        query = query.eq('bundle_id', bundleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Chapa[];
    },
  });
}

export function useResumoChapas() {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['resumo-chapas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chapas')
        .select('quantidade_m2, valor_inventario');

      if (error) throw error;

      const total_chapas = data.length;
      const total_m2 = data.reduce((sum, c) => sum + (c.quantidade_m2 || 0), 0);
      const valor_total = data.reduce((sum, c) => sum + (c.valor_inventario || 0), 0);

      return { total_chapas, total_m2, valor_total };
    },
  });
}
