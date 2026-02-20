import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import type { MovimentoComDetalhes } from '@/hooks/useMovimentos';

/**
 * Último movimento (não cancelado) de um produto.
 * Usado para preencher campos na ficha: Data, Parque_MM, Origem_material.
 */
export function useUltimoMovimentoProduto(produtoId?: string) {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['ultimo-movimento-produto', produtoId],
    enabled: !!produtoId,
    queryFn: async () => {
      if (!produtoId) return null;

      const { data, error } = await supabase
        .from('movimentos')
        .select(
          `
          *,
          produto:produtos(id, idmm, tipo_pedra, nome_comercial, forma),
          local_origem:locais!movimentos_local_origem_id_fkey(id, nome, codigo),
          local_destino:locais!movimentos_local_destino_id_fkey(id, nome, codigo),
          cliente:clientes(id, nome),
          operador:profiles!movimentos_operador_id_fkey(id, nome, email)
        `
        )
        .eq('produto_id', produtoId)
        .eq('cancelado', false)
        .order('data_movimento', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as unknown as MovimentoComDetalhes | null;
    },
  });
}
