import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';

interface LocalResumo {
  id: string;
  nome: string;
  codigo: string;
}

export interface StockProdutoItem {
  quantidade: number;
  local: LocalResumo;
}

export interface StockAgregadoItem {
  id_mm: string;
  tipo_produto: string;
  stockPorLocal: StockProdutoItem[];
  stockTotal: number;
}

function normalizeSingleRelation<T>(value: unknown): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return value as T;
}

export function useStockProduto(idMm?: string, tipoProduto?: string) {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['stock-produto', idMm, tipoProduto],
    enabled: !!idMm && !!tipoProduto,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock')
        .select(`
          quantidade,
          local:locais(id, nome, codigo)
        `)
        .eq('id_mm', idMm!)
        .eq('tipo_produto', tipoProduto!)
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

export function useStockProdutoLocal(idMm?: string, tipoProduto?: string, localId?: string) {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['stock-produto-local', idMm, tipoProduto, localId ?? null],
    enabled: !!idMm && !!tipoProduto,
    queryFn: async () => {
      let query = supabase
        .from('stock')
        .select('quantidade')
        .eq('id_mm', idMm!)
        .eq('tipo_produto', tipoProduto!);

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
          id_mm,
          tipo_produto,
          local:locais(id, nome, codigo)
        `)
        .gt('quantidade', 0);

      if (error) throw error;

      const agrupado = new Map<string, StockAgregadoItem>();

      for (const row of data ?? []) {
        const idMm = (row as any).id_mm as string;
        const tipoProduto = (row as any).tipo_produto as string;
        const local = normalizeSingleRelation<LocalResumo>(row.local);

        if (!idMm || !local) continue;

        const key = `${idMm}__${tipoProduto}`;
        const existente = agrupado.get(key);

        if (!existente) {
          agrupado.set(key, {
            id_mm: idMm,
            tipo_produto: tipoProduto,
            stockPorLocal: [{ local, quantidade: row.quantidade }],
            stockTotal: row.quantidade,
          });
          continue;
        }

        existente.stockPorLocal.push({ local, quantidade: row.quantidade });
        existente.stockTotal += row.quantidade;
      }

      return Array.from(agrupado.values())
        .filter(item => item.stockTotal > 0)
        .sort((a, b) => a.id_mm.localeCompare(b.id_mm));
    },
  });
}
