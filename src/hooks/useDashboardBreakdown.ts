import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';

/**
 * Query LEVE para o breakdown por parque do Dashboard.
 * Em vez de carregar todas as colunas (fotos, observações, parga1..4, etc.)
 * de blocos/chapas/ladrilho, seleciona apenas os campos estritamente
 * necessários e pagina manualmente para contornar o limite de 1000 linhas.
 */

const PAGE = 1000;

async function fetchAllLight<T>(
  supabase: any,
  table: string,
  columns: string
): Promise<T[]> {
  let from = 0;
  const all: T[] = [];
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export interface BreakdownBloco {
  parque: string;
  quantidade_tons: number | null;
  valor_inventario: number | null;
}
export interface BreakdownChapa {
  parque: string;
  quantidade_m2: number | null;
  valor_inventario: number | null;
}
export interface BreakdownLadrilho {
  parque: string;
  quantidade_m2: number | null;
  valor_inventario: number | null;
}

export function useDashboardBreakdown() {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['dashboard-breakdown', empresa],
    queryFn: async () => {
      const [blocos, chapas, ladrilhos] = await Promise.all([
        fetchAllLight<BreakdownBloco>(
          supabase,
          'blocos',
          'parque, quantidade_tons, valor_inventario'
        ),
        fetchAllLight<BreakdownChapa>(
          supabase,
          'chapas',
          'parque, quantidade_m2, valor_inventario'
        ),
        fetchAllLight<BreakdownLadrilho>(
          supabase,
          'ladrilho',
          'parque, quantidade_m2, valor_inventario'
        ),
      ]);
      return { blocos, chapas, ladrilhos };
    },
    enabled: !!empresa,
    staleTime: 1000 * 60 * 5,
  });
}
