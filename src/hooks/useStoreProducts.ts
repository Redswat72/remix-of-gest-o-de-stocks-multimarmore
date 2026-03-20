import { useQuery } from '@tanstack/react-query';
import { supabase as supabaseMultimarmore } from '@/lib/supabase-external';
import { supabaseMagratex } from '@/lib/supabase-magratex';
import type { CompanySlug, StoreProduct, StoreProductParga } from '@/types/store';
import type { SupabaseClient } from '@supabase/supabase-js';

function getClient(company: CompanySlug) {
  return company === 'magratex' ? supabaseMagratex : supabaseMultimarmore;
}

/** Paginate through all rows to bypass 1000-row limit */
async function fetchAll<T>(client: SupabaseClient, table: string, orderCol = 'created_at'): Promise<T[]> {
  const PAGE = 1000;
  let from = 0;
  const all: T[] = [];
  while (true) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order(orderCol, { ascending: false })
      .range(from, from + PAGE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

function collectImages(...urls: (string | null | undefined)[]): string[] {
  return urls.filter((u): u is string => !!u);
}

function buildPargas(row: any): StoreProductParga[] {
  const pargas: StoreProductParga[] = [];
  for (let i = 1; i <= 4; i++) {
    const nome = row[`parga${i}_nome`];
    if (!nome) continue;
    pargas.push({
      nome,
      quantidade: row[`parga${i}_quantidade`] ?? null,
      comprimento: row[`parga${i}_comprimento`] ?? null,
      altura: row[`parga${i}_altura`] ?? null,
      fotoPrimeira: row[`parga${i}_foto_primeira`] ?? null,
      fotoUltima: row[`parga${i}_foto_ultima`] ?? null,
    });
  }
  return pargas;
}

export function useStoreProducts(company: CompanySlug) {
  return useQuery({
    queryKey: ['store-products', company],
    queryFn: async (): Promise<StoreProduct[]> => {
      const client = getClient(company);

      // Fetch from all three inventory tables in parallel
      const [blocos, chapas, ladrilho] = await Promise.all([
        fetchAll<any>(client, 'blocos', 'created_at'),
        fetchAll<any>(client, 'chapas', 'created_at'),
        fetchAll<any>(client, 'ladrilho', 'created_at'),
      ]);

      const products: StoreProduct[] = [];

      // Map blocos
      for (const b of blocos) {
        const images = collectImages(b.foto1_url, b.foto2_url);
        products.push({
          id: b.id,
          internal_id: b.id_mm,
          name: [b.variedade, b.bloco_origem].filter(Boolean).join(' — ') || b.id_mm,
          type: 'bloco',
          status: 'disponivel',
          length: b.comprimento ?? null,
          width: b.largura ?? null,
          height: b.altura ?? null,
          thickness: null,
          volume: b.comprimento && b.largura && b.altura
            ? Math.round((b.comprimento * b.largura * b.altura) / 1e6 * 1000) / 1000
            : null,
          weight: b.quantidade_tons ? Math.round(b.quantidade_tons * 1000) : null,
          observations: null,
          images: images.length > 0 ? images : ['/placeholder.svg'],
          variety: b.variedade ?? null,
          finish: null,
          line: b.linha ?? null,
          quantidade: b.quantidade_tons,
          unidade: 'ton',
          blocoOrigem: b.bloco_origem ?? null,
          bundleId: null,
          numChapas: null,
          dimensoes: b.comprimento && b.largura && b.altura
            ? `${b.comprimento} × ${b.largura} × ${b.altura} cm`
            : null,
          butchNo: null,
          numPecas: null,
          peso: b.quantidade_tons ?? null,
          acabamento: null,
          pargas: [],
        });
      }

      // Map chapas
      for (const c of chapas) {
        const pargas = buildPargas(c);
        // Collect all images: parga photos
        const images = collectImages(
          ...pargas.flatMap(p => [p.fotoPrimeira, p.fotoUltima])
        );
        products.push({
          id: c.id,
          internal_id: c.id_mm,
          name: [c.variedade, c.acabamento].filter(Boolean).join(' — ') || c.id_mm,
          type: 'chapa',
          status: 'disponivel',
          length: null,
          width: c.largura ?? null,
          height: c.altura ?? null,
          thickness: null,
          volume: null,
          weight: null,
          observations: null,
          images: images.length > 0 ? images : ['/placeholder.svg'],
          variety: c.variedade ?? null,
          finish: c.acabamento ?? null,
          line: c.linha ?? null,
          quantidade: c.quantidade_m2,
          unidade: 'm²',
          blocoOrigem: null,
          bundleId: c.bundle_id ?? null,
          numChapas: c.num_chapas ?? null,
          dimensoes: c.largura && c.altura ? `${c.largura} × ${c.altura} cm` : null,
          butchNo: null,
          numPecas: null,
          peso: null,
          acabamento: c.acabamento ?? null,
          pargas,
        });
      }

      // Map ladrilho
      for (const l of ladrilho) {
        const images = collectImages(l.foto_amostra_url);
        products.push({
          id: l.id,
          internal_id: l.id_mm ?? l.variedade ?? l.id,
          name: [l.variedade, l.dimensoes, l.acabamento].filter(Boolean).join(' — ') || l.id_mm || l.id,
          type: 'ladrilho',
          status: 'disponivel',
          length: l.comprimento ?? null,
          width: l.largura ?? null,
          height: l.altura ?? null,
          thickness: l.espessura ?? null,
          volume: null,
          weight: l.peso ?? null,
          observations: l.nota ?? null,
          images: images.length > 0 ? images : ['/placeholder.svg'],
          variety: l.variedade ?? null,
          finish: l.acabamento ?? null,
          line: null,
          quantidade: l.quantidade_m2,
          unidade: 'm²',
          blocoOrigem: null,
          bundleId: null,
          numChapas: null,
          dimensoes: l.dimensoes ?? null,
          butchNo: l.butch_no ?? null,
          numPecas: l.num_pecas ?? null,
          peso: l.peso ?? null,
          acabamento: l.acabamento ?? null,
          pargas: [],
        });
      }

      return products;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useUniqueStoneNames(company: CompanySlug) {
  return useQuery({
    queryKey: ['store-stones', company],
    queryFn: async () => {
      const client = getClient(company);

      const [blocos, chapas, ladrilho] = await Promise.all([
        client.from('blocos').select('variedade'),
        client.from('chapas').select('variedade'),
        client.from('ladrilho').select('variedade'),
      ]);

      const all = [
        ...(blocos.data ?? []),
        ...(chapas.data ?? []),
        ...(ladrilho.data ?? []),
      ];

      const names = [...new Set(all.map((p: any) => p.variedade as string).filter(Boolean))];
      return names.sort();
    },
    staleTime: 1000 * 60 * 10,
  });
}
