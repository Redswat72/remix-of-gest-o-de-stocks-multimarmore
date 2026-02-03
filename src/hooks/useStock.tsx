import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Stock, Produto, Local } from '@/types/database';

export interface StockComDetalhes extends Stock {
  produto: Produto;
  local: Local;
}

export interface StockAgregado {
  produto: Produto;
  stockPorLocal: { local: Local; quantidade: number }[];
  stockTotal: number;
}

interface UseStockOptions {
  tipoPedra?: string;
  forma?: string;
  localId?: string;
  nomeComercial?: string;
  idmm?: string;
  enabled?: boolean;
}

export function useStock(options: UseStockOptions = {}) {
  const { tipoPedra, forma, localId, nomeComercial, idmm, enabled = true } = options;

  return useQuery({
    queryKey: ['stock', { tipoPedra, forma, localId, nomeComercial, idmm }],
    queryFn: async () => {
      let query = supabase
        .from('stock')
        .select(`
          *,
          produto:produtos(*),
          local:locais(*)
        `)
        .gt('quantidade', 0);

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar no cliente (para evitar complexidade de joins)
      let filtered = (data as unknown as StockComDetalhes[]) || [];

      if (tipoPedra) {
        filtered = filtered.filter(s => 
          s.produto?.tipo_pedra?.toLowerCase().includes(tipoPedra.toLowerCase())
        );
      }

      if (forma) {
        filtered = filtered.filter(s => s.produto?.forma === forma);
      }

      if (localId) {
        filtered = filtered.filter(s => s.local_id === localId);
      }

      if (nomeComercial) {
        filtered = filtered.filter(s => 
          s.produto?.nome_comercial?.toLowerCase().includes(nomeComercial.toLowerCase())
        );
      }

      if (idmm) {
        filtered = filtered.filter(s => 
          s.produto?.idmm?.toLowerCase().includes(idmm.toLowerCase())
        );
      }

      return filtered;
    },
    enabled,
  });
}

export function useStockAgregado(options: UseStockOptions = {}) {
  const { tipoPedra, forma, nomeComercial, idmm, enabled = true } = options;

  return useQuery({
    queryKey: ['stock-agregado', { tipoPedra, forma, nomeComercial, idmm }],
    queryFn: async () => {
      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select(`
          *,
          produto:produtos(*),
          local:locais(*)
        `)
        .gt('quantidade', 0);

      if (stockError) throw stockError;

      const typedData = (stockData as unknown as StockComDetalhes[]) || [];

      // Filtrar por produto
      let filtered = typedData;

      if (tipoPedra) {
        filtered = filtered.filter(s => 
          s.produto?.tipo_pedra?.toLowerCase().includes(tipoPedra.toLowerCase())
        );
      }

      if (forma) {
        filtered = filtered.filter(s => s.produto?.forma === forma);
      }

      if (nomeComercial) {
        filtered = filtered.filter(s => 
          s.produto?.nome_comercial?.toLowerCase().includes(nomeComercial.toLowerCase())
        );
      }

      if (idmm) {
        filtered = filtered.filter(s => 
          s.produto?.idmm?.toLowerCase().includes(idmm.toLowerCase())
        );
      }

      // Agregar por produto
      const agregadoMap = new Map<string, StockAgregado>();

      for (const item of filtered) {
        const produtoId = item.produto_id;
        
        if (!agregadoMap.has(produtoId)) {
          agregadoMap.set(produtoId, {
            produto: item.produto,
            stockPorLocal: [],
            stockTotal: 0,
          });
        }

        const agregado = agregadoMap.get(produtoId)!;
        agregado.stockPorLocal.push({
          local: item.local,
          quantidade: item.quantidade,
        });
        agregado.stockTotal += item.quantidade;
      }

      return Array.from(agregadoMap.values());
    },
    enabled,
  });
}

export function useStockProdutoLocal(produtoId?: string, localId?: string) {
  return useQuery({
    queryKey: ['stock-produto-local', produtoId, localId],
    queryFn: async () => {
      if (!produtoId || !localId) return 0;

      const { data, error } = await supabase
        .from('stock')
        .select('quantidade')
        .eq('produto_id', produtoId)
        .eq('local_id', localId)
        .maybeSingle();

      if (error) throw error;
      return data?.quantidade || 0;
    },
    enabled: !!produtoId && !!localId,
  });
}
