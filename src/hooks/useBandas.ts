import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import type { Banda } from '@/types/inventario';

export function useBandas(parque?: string) {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['bandas', empresa, parque],
    queryFn: async () => {
      let query = supabase
        .from('produtos')
        .select('*')
        .eq('forma', 'banda')
        .order('created_at', { ascending: false });

      if (parque) {
        query = query.eq('parque', parque);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Banda[];
    },
    enabled: !!empresa,
  });
}

export function useResumoBandas() {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['resumo-bandas', empresa],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('area_m2, valorizacao')
        .eq('forma', 'banda');

      if (error) throw error;

      const total_bandas = data.length;
      const total_m2 = data.reduce((sum: number, b: any) => sum + (b.area_m2 || 0), 0);
      const valor_total = data.reduce((sum: number, b: any) => sum + (b.valorizacao || 0), 0);

      return { total_bandas, total_m2, valor_total };
    },
    enabled: !!empresa,
  });
}
