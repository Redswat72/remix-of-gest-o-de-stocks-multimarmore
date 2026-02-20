import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';
import type { Ladrilho } from '@/types/inventario';

export function useLadrilho(parque?: string) {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['ladrilho', parque],
    queryFn: async () => {
      let query = supabase
        .from('ladrilho')
        .select('*')
        .order('created_at', { ascending: false });

      if (parque) {
        query = query.eq('parque', parque);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Ladrilho[];
    },
  });
}

export function useResumoLadrilho() {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['resumo-ladrilho'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ladrilho')
        .select('quantidade_m2, valor_inventario, num_pecas');

      if (error) throw error;

      const total_registos = data.length;
      const total_m2 = data.reduce((sum, l) => sum + (l.quantidade_m2 || 0), 0);
      const total_pecas = data.reduce((sum, l) => sum + (l.num_pecas || 0), 0);
      const valor_total = data.reduce((sum, l) => sum + (l.valor_inventario || 0), 0);

      return { total_registos, total_m2, total_pecas, valor_total };
    },
  });
}
