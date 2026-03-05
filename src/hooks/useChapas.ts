import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import type { Chapa } from '@/types/inventario';

async function fetchAllChapas(supabase: any, parque?: string, bundleId?: string): Promise<Chapa[]> {
  const PAGE = 1000;
  let from = 0;
  const all: Chapa[] = [];
  while (true) {
    let query = supabase
      .from('chapas')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (parque) query = query.eq('parque', parque);
    if (bundleId) query = query.eq('bundle_id', bundleId);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Chapa[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export function useChapas(parque?: string, bundleId?: string) {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['chapas', empresa, parque, bundleId],
    queryFn: () => fetchAllChapas(supabase, parque, bundleId),
    enabled: !!empresa,
  });
}

export function useResumoChapas() {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['resumo-chapas', empresa],
    queryFn: async () => {
      const data = await fetchAllChapas(supabase);

      const total_chapas = data.length;
      const total_m2 = data.reduce((sum, c) => sum + (c.quantidade_m2 || 0), 0);
      const valor_total = data.reduce((sum, c) => sum + (c.valor_inventario || 0), 0);

      return { total_chapas, total_m2, valor_total };
    },
    enabled: !!empresa,
  });
}
