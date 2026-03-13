import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Bloco, Chapa, Ladrilho } from '@/types/inventario';

/** Fetch all rows from a table, paginating in chunks of 1000 to bypass the default limit */
async function fetchAll<T>(supabase: SupabaseClient, table: string): Promise<T[]> {
  const PAGE = 1000;
  let from = 0;
  const all: T[] = [];

  while (true) {
    const runPage = async (orderCol: 'id' | 'created_at') =>
      supabase
        .from(table)
        .select('*')
        .order(orderCol, { ascending: false })
        .range(from, from + PAGE - 1);

    let { data, error } = await runPage('id');

    if (error) {
      const retry = await runPage('created_at');
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...(data as T[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return all;
}

export type FormaInventario = 'bloco' | 'chapa' | 'ladrilho';

export interface ItemUnificado {
  id: string;
  forma: FormaInventario;
  referencia: string;       // referência principal para listagens
  idMm?: string | null;     // id_mm direto da BD (quando existir)
  variedade: string | null;
  parque: string;
  quantidade: number;       // tons for blocos, m² for chapas/ladrilho
  unidade: string;          // 'ton' | 'm²'
  valor: number | null;
  precoUnitario: number | null;
  // Campos extras por forma
  blocoOrigem?: string | null;
  comprimento?: number | null;
  largura?: number | null;
  altura?: number | null;
  toneladas?: number | null;
  bundleId?: string | null;
  numChapas?: number | null;
  dimensoes?: string | null;
  butchNo?: string | null;
  acabamento?: string | null;
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
  const { empresa } = useEmpresa();
  const { forma, busca, parque } = options;

  const blocosQuery = useQuery({
    queryKey: ['blocos-unificado', empresa],
    queryFn: () => fetchAll<Bloco>(supabase, 'blocos'),
    enabled: !!empresa && (!forma || forma === 'bloco'),
  });

  const chapasQuery = useQuery({
    queryKey: ['chapas-unificado', empresa],
    queryFn: () => fetchAll<Chapa>(supabase, 'chapas'),
    enabled: !!empresa && (!forma || forma === 'chapa'),
  });

  const ladrilhoQuery = useQuery({
    queryKey: ['ladrilho-unificado', empresa],
    queryFn: () => fetchAll<Ladrilho>(supabase, 'ladrilho'),
    enabled: !!empresa && (!forma || forma === 'ladrilho'),
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
        idMm: b.id_mm,
        variedade: b.variedade,
        parque: b.parque,
        quantidade: b.quantidade_tons,
        unidade: 'ton',
        valor: b.valor_inventario,
        precoUnitario: b.preco_unitario,
        blocoOrigem: b.bloco_origem,
        comprimento: b.comprimento,
        largura: b.largura,
        altura: b.altura,
        toneladas: b.quantidade_tons,
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
        acabamento: c.acabamento,
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
        referencia: l.id_mm
          ? l.id_mm
          : l.variedade && l.dimensoes
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
        acabamento: l.acabamento,
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
      i.acabamento?.toLowerCase().includes(search) ||
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
