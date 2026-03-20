import { useQuery } from '@tanstack/react-query';
import { supabase as supabaseMultimarmore } from '@/lib/supabase-external';
import { supabaseMagratex } from '@/lib/supabase-magratex';
import type { CompanySlug, StoreProduct, StoreProductType } from '@/types/store';

function getClient(company: CompanySlug) {
  return company === 'magratex' ? supabaseMagratex : supabaseMultimarmore;
}

export function useStoreProducts(company: CompanySlug) {
  return useQuery({
    queryKey: ['store-products', company],
    queryFn: async (): Promise<StoreProduct[]> => {
      const client = getClient(company);

      const { data, error } = await client
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('idmm', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((p: any) => {
        const images: string[] = [
          p.foto1_hd_url, p.foto1_url,
          p.foto2_hd_url, p.foto2_url,
          p.foto3_hd_url, p.foto3_url,
          p.foto4_hd_url, p.foto4_url,
        ].filter((url): url is string => !!url);

        // Deduplicate (HD takes priority)
        const uniqueImages: string[] = [];
        const seen = new Set<string>();
        for (const img of images) {
          const key = img.split('/').pop() ?? img;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueImages.push(img);
          }
        }

        const name = [p.tipo_pedra, p.variedade].filter(Boolean).join(' - ');
        const weightKg = p.peso_ton ? Math.round(p.peso_ton * 1000) : null;

        return {
          id: p.id,
          internal_id: p.idmm,
          name,
          type: (p.forma ?? 'bloco') as StoreProductType,
          status: 'disponivel' as const,
          length: p.comprimento_cm ?? null,
          width: p.largura_cm ?? null,
          height: p.altura_cm ?? null,
          thickness: p.espessura_cm ?? null,
          volume: p.volume_m3 ?? null,
          weight: weightKg,
          observations: p.observacoes ?? null,
          images: uniqueImages.length > 0 ? uniqueImages : ['/placeholder.svg'],
          variety: p.variedade ?? null,
          finish: p.acabamento ?? null,
          line: p.linha ?? null,
        };
      });
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useUniqueStoneNames(company: CompanySlug) {
  return useQuery({
    queryKey: ['store-stones', company],
    queryFn: async () => {
      const client = getClient(company);
      const { data, error } = await client
        .from('produtos')
        .select('tipo_pedra')
        .eq('ativo', true);

      if (error) throw error;

      const names = [...new Set((data ?? []).map((p: any) => p.tipo_pedra as string))];
      return names.sort();
    },
    staleTime: 1000 * 60 * 10,
  });
}
