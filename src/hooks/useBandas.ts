import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import type { Banda } from '@/types/inventario';

type BandaResumoRow = {
  quantidade_m2?: number | null;
  area_m2?: number | null;
  valor_inventario?: number | null;
  valorizacao?: number | null;
};

const PAGE_SIZE = 1000;

function buildBandasQuery(supabase: any, empresa: string | null, selectCols: string) {
  if (empresa === 'magratex') {
    return supabase.from('bandas').select(selectCols);
  }

  return supabase.from('produtos').select(selectCols).eq('forma', 'banda');
}

async function fetchAllBandas(
  supabase: any,
  empresa: string | null,
  parque?: string,
): Promise<Banda[]> {
  let from = 0;
  const all: Banda[] = [];

  while (true) {
    let query = buildBandasQuery(supabase, empresa, '*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (parque) query = query.eq('parque', parque);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...(data as Banda[]));
    if (data.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  return all;
}

export function useBandas(parque?: string) {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['bandas', empresa, parque],
    queryFn: () => fetchAllBandas(supabase, empresa, parque),
    enabled: !!empresa,
  });
}

export function useResumoBandas() {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['resumo-bandas', empresa],
    queryFn: async () => {
      const data = await fetchAllBandas(supabase, empresa);
      const resumoData = data as unknown as BandaResumoRow[];

      const total_bandas = resumoData.length;
      const total_m2 = resumoData.reduce(
        (sum, b) => sum + (b.quantidade_m2 ?? b.area_m2 ?? 0),
        0,
      );
      const valor_total = resumoData.reduce(
        (sum, b) => sum + (b.valor_inventario ?? b.valorizacao ?? 0),
        0,
      );

      return { total_bandas, total_m2, valor_total };
    },
    enabled: !!empresa,
  });
}

