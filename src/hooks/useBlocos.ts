import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import type { Bloco } from '@/types/inventario';

async function fetchAllBlocos(supabase: any, parque?: string): Promise<Bloco[]> {
  const PAGE = 1000;
  let from = 0;
  const all: Bloco[] = [];
  while (true) {
    let query = supabase
      .from('blocos')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (parque) query = query.eq('parque', parque);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Bloco[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export function useBlocos(parque?: string) {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['blocos', empresa, parque],
    queryFn: () => fetchAllBlocos(supabase, parque),
    enabled: !!empresa,
  });
}

export function useResumoBlocos() {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['resumo-blocos', empresa],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocos')
        .select('quantidade_tons, valor_inventario');

      if (error) throw error;

      const total_blocos = data.length;
      const total_tons = data.reduce((sum, b) => sum + (b.quantidade_tons || 0), 0);
      const valor_total = data.reduce((sum, b) => sum + (b.valor_inventario || 0), 0);

      return { total_blocos, total_tons, valor_total };
    },
    enabled: !!empresa,
  });
}
