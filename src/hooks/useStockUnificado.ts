import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';
import type { Bloco, Chapa, Ladrilho } from '@/types/inventario';

export type FormaInventario = 'bloco' | 'chapa' | 'ladrilho';

export interface ItemUnificado {
  id: string;
  forma: FormaInventario;
  referencia: string;       // id_mm or variedade+dimensoes
  variedade: string | null;
  parque: string;
  quantidade: number;       // tons for blocos, m² for chapas/ladrilho
  unidade: string;          // 'ton' | 'm²'
  valor: number | null;
  precoUnitario: number | null;
  // Campos extras por forma
  blocoOrigem?: string | null;
  bundleId?: string | null;
  numChapas?: number | null;
  dimensoes?: string | null;
  butchNo?: string | null;
  numPecas?: number | null;
  peso?: number | null;
  // Raw data
  raw: Bloco | Chapa | Ladrilho;
}

interface UseStockUnificadoOptions {
  forma?: FormaInventario | '';
  busca?: string;
  parque?: string;
}

export function useStockUnificado(options: UseStockUnificadoOptions = {}) {
  const supabase = useSupabaseEmpresa();
  const { forma, busca, parque } = options;

  const blocosQuery = useQuery({
    queryKey: ['blocos-unificado'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Bloco[];
    },
    enabled: !forma || forma === 'bloco',
  });

  const chapasQuery = useQuery({
    queryKey: ['chapas-unificado'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chapas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Chapa[];
    },
    enabled: !forma || forma === 'chapa',
  });

  const ladrilhoQuery = useQuery({
    queryKey: ['ladrilho-unificado'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ladrilho')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Ladrilho[];
    },
    enabled: !forma || forma === 'ladrilho',
  });

  const isLoading = blocosQuery.isLoading || chapasQuery.isLoading || ladrilhoQuery.isLoading;
  const error = blocosQuery.error || chapasQuery.error || ladrilhoQuery.error;

  const items: ItemUnificado[] = [];

  // Map blocos
  if (blocosQuery.data) {
    for (const b of blocosQuery.data) {
      items.push({
        id: b.id,
        forma: 'bloco',
        referencia: b.id_mm,
        variedade: b.variedade,
        parque: b.parque,
        quantidade: b.quantidade_tons,
        unidade: 'ton',
        valor: b.valor_inventario,
        precoUnitario: b.preco_unitario,
        blocoOrigem: b.bloco_origem,
        raw: b,
      });
    }
  }

  // Map chapas
  if (chapasQuery.data) {
    for (const c of chapasQuery.data) {
      items.push({
        id: c.id,
        forma: 'chapa',
        referencia: c.id_mm,
        variedade: c.variedade,
        parque: c.parque,
        quantidade: c.quantidade_m2,
        unidade: 'm²',
        valor: c.valor_inventario,
        precoUnitario: c.preco_unitario,
        bundleId: c.bundle_id,
        numChapas: c.num_chapas,
        raw: c,
      });
    }
  }

  // Map ladrilho
  if (ladrilhoQuery.data) {
    for (const l of ladrilhoQuery.data) {
      items.push({
        id: l.id,
        forma: 'ladrilho',
        referencia: l.variedade && l.dimensoes
          ? `${l.variedade} ${l.dimensoes}`
          : l.variedade || l.dimensoes || l.id,
        variedade: l.variedade,
        parque: l.parque,
        quantidade: l.quantidade_m2,
        unidade: 'm²',
        valor: l.valor_inventario,
        precoUnitario: l.preco_unitario,
        dimensoes: l.dimensoes,
        butchNo: l.butch_no,
        numPecas: l.num_pecas,
        peso: l.peso,
        raw: l,
      });
    }
  }

  // Apply filters
  let filtered = items;

  if (forma) {
    filtered = filtered.filter(i => i.forma === forma);
  }

  if (parque) {
    filtered = filtered.filter(i =>
      i.parque.toLowerCase().includes(parque.toLowerCase())
    );
  }

  if (busca) {
    const search = busca.toLowerCase();
    filtered = filtered.filter(i =>
      i.referencia.toLowerCase().includes(search) ||
      i.variedade?.toLowerCase().includes(search) ||
      i.parque.toLowerCase().includes(search) ||
      (i.bundleId?.toLowerCase().includes(search)) ||
      (i.butchNo?.toLowerCase().includes(search))
    );
  }

  return {
    data: filtered,
    allBlocos: blocosQuery.data || [],
    allChapas: chapasQuery.data || [],
    allLadrilho: ladrilhoQuery.data || [],
    isLoading,
    error,
  };
}
