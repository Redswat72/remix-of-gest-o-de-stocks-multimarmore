import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import type { Ladrilho } from '@/types/inventario';

async function fetchAllLadrilho(supabase: any, parque?: string): Promise<Ladrilho[]> {
  const PAGE = 1000;
  let from = 0;
  const all: Ladrilho[] = [];

  while (true) {
    const runPage = async (orderCol: 'id' | 'created_at') => {
      let query = supabase
        .from('ladrilho')
        .select('*')
        .order(orderCol, { ascending: false })
        .range(from, from + PAGE - 1);

      if (parque) query = query.eq('parque', parque);
      return query;
    };

    let { data, error } = await runPage('id');

    if (error) {
      const retry = await runPage('created_at');
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...(data as Ladrilho[]));
    if (data.length < PAGE) break;

    from += PAGE;
  }

  return all;
}

export function useLadrilho(parque?: string) {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['ladrilho', empresa, parque],
    queryFn: () => fetchAllLadrilho(supabase, parque),
    enabled: !!empresa,
  });
}

export function useResumoLadrilho() {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['resumo-ladrilho', empresa],
    queryFn: async () => {
      const data = await fetchAllLadrilho(supabase);

      const total_registos = data.length;
      const total_m2 = data.reduce((sum, l) => sum + (l.quantidade_m2 || 0), 0);
      const total_pecas = data.reduce((sum, l) => sum + (l.num_pecas || 0), 0);
      const valor_total = data.reduce((sum, l) => sum + (l.valor_inventario || 0), 0);

      return { total_registos, total_m2, total_pecas, valor_total };
    },
    enabled: !!empresa,
  });
}
