import { useQuery } from '@tanstack/react-query';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';

export interface InventarioItem {
  id: string;
  id_mm: string;
  tipo: 'bloco' | 'chapa' | 'ladrilho';
  variedade: string | null;
  parque: string;
  label: string;
}

export function useSearchInventario(search?: string) {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['search-inventario', search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];

      const results: InventarioItem[] = [];

      // Search blocos — only ativo = true
      const { data: blocos } = await supabase
        .from('blocos')
        .select('id, id_mm, variedade, parque')
        .ilike('id_mm', `%${search}%`)
        .eq('ativo', true)
        .limit(20);

      if (blocos) {
        for (const b of blocos) {
          results.push({
            id: b.id,
            id_mm: b.id_mm,
            tipo: 'bloco',
            variedade: b.variedade,
            parque: b.parque,
            label: `${b.id_mm} — Bloco${b.variedade ? ` (${b.variedade})` : ''} — ${b.parque}`,
          });
        }
      }

      // Search chapas (no ativo column, but filter via stock > 0 implicitly)
      const { data: chapas } = await supabase
        .from('chapas')
        .select('id, id_mm, variedade, parque')
        .ilike('id_mm', `%${search}%`)
        .limit(20);

      if (chapas) {
        for (const c of chapas) {
          results.push({
            id: c.id,
            id_mm: c.id_mm,
            tipo: 'chapa',
            variedade: c.variedade,
            parque: c.parque,
            label: `${c.id_mm} — Chapa${c.variedade ? ` (${c.variedade})` : ''} — ${c.parque}`,
          });
        }
      }

      // Search ladrilho
      const { data: ladrilhos } = await supabase
        .from('ladrilho')
        .select('id, id_mm, variedade, parque')
        .not('id_mm', 'is', null)
        .ilike('id_mm', `%${search}%`)
        .limit(20);

      if (ladrilhos) {
        for (const l of ladrilhos) {
          results.push({
            id: l.id,
            id_mm: l.id_mm || '',
            tipo: 'ladrilho',
            variedade: l.variedade,
            parque: l.parque,
            label: `${l.id_mm} — Ladrilho${l.variedade ? ` (${l.variedade})` : ''} — ${l.parque}`,
          });
        }
      }

      results.sort((a, b) => a.id_mm.localeCompare(b.id_mm));

      return results;
    },
    enabled: !!search && search.length >= 2,
  });
}
