import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';

interface LocalResumo {
  id: string;
  nome: string;
  codigo: string;
}

interface ProdutoResumo {
  id: string;
  idmm: string;
  tipo_pedra: string;
  nome_comercial: string | null;
  forma: 'bloco' | 'chapa' | 'ladrilho';
}

export interface StockProdutoItem {
  quantidade: number;
  local: LocalResumo;
}

export interface StockAgregadoItem {
  produto: ProdutoResumo;
  stockPorLocal: StockProdutoItem[];
  stockTotal: number;
}

function normalizeSingleRelation<T>(value: unknown): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return value as T;
}

export function useStockProduto(produtoId?: string) {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['stock-produto', produtoId],
    enabled: !!produtoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock')
        .select(`
          quantidade,
          local:locais(id, nome, codigo)
        `)
        .eq('produto_id', produtoId!)
        .gt('quantidade', 0)
        .order('quantidade', { ascending: false });

      if (error) throw error;

      return (data ?? [])
        .map((item) => {
          const local = normalizeSingleRelation<LocalResumo>(item.local);
          if (!local) return null;
          return {
            quantidade: item.quantidade,
            local,
          } as StockProdutoItem;
        })
        .filter((item): item is StockProdutoItem => item !== null);
    },
  });
}

export function useStockProdutoLocal(produtoId?: string, localId?: string) {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['stock-produto-local', produtoId, localId ?? null],
    enabled: !!produtoId,
    queryFn: async () => {
      let query = supabase
        .from('stock')
        .select('quantidade')
        .eq('produto_id', produtoId!);

      if (localId) {
        query = query.eq('local_id', localId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).reduce((total, row) => total + (row.quantidade ?? 0), 0);
    },
  });
}

export function useStockAgregado() {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['stock-agregado'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock')
        .select(`
          quantidade,
          produto:produtos(id, idmm, tipo_pedra, nome_comercial, forma),
          local:locais(id, nome, codigo)
        `)
        .gt('quantidade', 0);

      if (error) throw error;

      const agrupado = new Map<string, StockAgregadoItem>();

      for (const row of data ?? []) {
        const produto = normalizeSingleRelation<ProdutoResumo>(row.produto);
        const local = normalizeSingleRelation<LocalResumo>(row.local);

        if (!produto || !local) continue;

        const existente = agrupado.get(produto.id);

        if (!existente) {
          agrupado.set(produto.id, {
            produto,
            stockPorLocal: [{ local, quantidade: row.quantidade }],
            stockTotal: row.quantidade,
          });
          continue;
        }

        existente.stockPorLocal.push({ local, quantidade: row.quantidade });
        existente.stockTotal += row.quantidade;
      }

      return Array.from(agrupado.values()).sort((a, b) =>
        a.produto.idmm.localeCompare(b.produto.idmm),
      );
    },
  });
}
