import type { SupabaseClient } from '@supabase/supabase-js';
import { formatChapaDimensoes } from '@/lib/chapaDimensoes';

export type TipoIdMm = 'bloco' | 'chapa' | 'ladrilho';

export interface IdMmExistente {
  tipo: TipoIdMm;
  id: string;
  id_mm: string;
  parque: string;
  variedade: string | null;
  dimensoes: string;
  quantidade: string;
  ativo: boolean;
}

const TABELAS: { tipo: TipoIdMm; tabela: string }[] = [
  { tipo: 'bloco', tabela: 'blocos' },
  { tipo: 'chapa', tabela: 'chapas' },
  { tipo: 'ladrilho', tabela: 'ladrilho' },
];

const n = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v));
const fmt = (v: number) => v.toLocaleString('pt-PT', { maximumFractionDigits: 2 });

function mapRow(tipo: TipoIdMm, r: Record<string, unknown>): IdMmExistente {
  let dimensoes = '';
  let quantidade = '';
  if (tipo === 'chapa') {
    dimensoes = formatChapaDimensoes(r);
    quantidade = `${n(r.num_chapas) ?? 0} chapas · ${fmt(n(r.quantidade_m2) ?? 0)} m²`;
  } else {
    const partes = [n(r.comprimento), n(r.largura), n(r.altura)].filter(v => v != null) as number[];
    dimensoes = (r.dimensoes as string) || (partes.length ? `${partes.map(fmt).join('×')} cm` : '');
    quantidade = tipo === 'bloco'
      ? `${fmt(n(r.quantidade_kg) ?? 0)} kg`
      : `${n(r.num_pecas) ?? 0} peças · ${fmt(n(r.quantidade_m2) ?? 0)} m²`;
  }
  return {
    tipo,
    id: String(r.id),
    id_mm: String(r.id_mm),
    parque: String(r.parque ?? ''),
    variedade: (r.variedade as string) ?? null,
    dimensoes,
    quantidade,
    ativo: r.ativo !== false,
  };
}

/** Procura id_mm (um ou vários) em blocos, chapas e ladrilho, em todos os parques, incluindo inativos. */
export async function procurarIdMm(supabase: SupabaseClient, ids: string[]): Promise<IdMmExistente[]> {
  const limpos = Array.from(new Set(ids.map(i => i.trim()).filter(Boolean)));
  if (!limpos.length) return [];
  const res = await Promise.all(
    TABELAS.map(async ({ tipo, tabela }) => {
      const { data, error } = await supabase.from(tabela).select('*').in('id_mm', limpos);
      if (error) {
        console.warn(`[procurarIdMm] ${tabela}:`, error.message);
        return [];
      }
      return ((data ?? []) as Record<string, unknown>[]).map(r => mapRow(tipo, r));
    })
  );
  return res.flat();
}
