import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import type { Bloco } from '@/types/inventario';

export function useBlocos(parque?: string) {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['blocos', empresa, parque],
    queryFn: async () => {
      let query = supabase
        .from('blocos')
        .select('*')
        .order('created_at', { ascending: false });

      if (parque) {
        query = query.eq('parque', parque);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Bloco[];
    },
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
