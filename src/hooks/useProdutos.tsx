import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { withSchemaSafeRetry } from '@/lib/postgrestSafeWrite';
import type { Produto, ProdutoFormData, FormaProduto } from '@/types/database';

interface UseProdutosOptions {
  tipoPedra?: string;
  forma?: string;
  idmm?: string;
  ativo?: boolean;
}

export function useProdutos(options: UseProdutosOptions = {}) {
  const supabase = useSupabaseEmpresa();
  const { tipoPedra, forma, idmm, ativo = true } = options;

  return useQuery({
    queryKey: ['produtos', options],
    queryFn: async () => {
      let query = supabase
        .from('produtos')
        .select('*')
        .order('idmm', { ascending: true });

      if (ativo !== undefined) {
        query = query.eq('ativo', ativo);
      }

      if (tipoPedra) {
        query = query.ilike('tipo_pedra', `%${tipoPedra}%`);
      }

      if (forma) {
        query = query.eq('forma', forma as FormaProduto);
      }

      if (idmm) {
        query = query.ilike('idmm', `%${idmm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Produto[];
    },
  });
}

export function useProduto(id?: string) {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['produto', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Produto;
    },
    enabled: !!id,
  });
}

interface CreateProdutoData extends ProdutoFormData {
  variedade?: string | null;
  origem_bloco?: string | null;
  foto1_url?: string | null;
  foto2_url?: string | null;
  foto3_url?: string | null;
  foto4_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  peso_ton?: number | null;
  parga1_nome?: string | null;
  parga1_quantidade?: number | null;
  parga1_comprimento_cm?: number | null;
  parga1_altura_cm?: number | null;
  parga1_espessura_cm?: number | null;
  parga1_foto1_url?: string | null;
  parga1_foto2_url?: string | null;
  parga2_nome?: string | null;
  parga2_quantidade?: number | null;
  parga2_comprimento_cm?: number | null;
  parga2_altura_cm?: number | null;
  parga2_espessura_cm?: number | null;
  parga2_foto1_url?: string | null;
  parga2_foto2_url?: string | null;
  parga3_nome?: string | null;
  parga3_quantidade?: number | null;
  parga3_comprimento_cm?: number | null;
  parga3_altura_cm?: number | null;
  parga3_espessura_cm?: number | null;
  parga3_foto1_url?: string | null;
  parga3_foto2_url?: string | null;
  parga4_nome?: string | null;
  parga4_quantidade?: number | null;
  parga4_comprimento_cm?: number | null;
  parga4_altura_cm?: number | null;
  parga4_espessura_cm?: number | null;
  parga4_foto1_url?: string | null;
  parga4_foto2_url?: string | null;
}

export function useCreateProduto() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: CreateProdutoData) => {
      const insertData: Record<string, unknown> = {
        idmm: formData.idmm,
        tipo_pedra: formData.tipo_pedra,
        forma: formData.forma,
        nome_comercial: formData.nome_comercial || null,
        acabamento: formData.acabamento || null,
        comprimento_cm: formData.comprimento_cm || null,
        largura_cm: formData.largura_cm || null,
        altura_cm: formData.altura_cm || null,
        espessura_cm: formData.espessura_cm || null,
        observacoes: formData.observacoes || null,
      };

      const { data, error } = await supabase
        .from('produtos')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      const fotosUpdate: Record<string, unknown> = {
        foto1_url: formData.foto1_url ?? null,
        foto2_url: formData.foto2_url ?? null,
        foto3_url: formData.foto3_url ?? null,
        foto4_url: formData.foto4_url ?? null,
        foto1_hd_url: (formData as any).foto1_hd_url ?? null,
        foto2_hd_url: (formData as any).foto2_hd_url ?? null,
        foto3_hd_url: (formData as any).foto3_hd_url ?? null,
        foto4_hd_url: (formData as any).foto4_hd_url ?? null,
        parga1_foto1_url: formData.parga1_foto1_url ?? null,
        parga1_foto2_url: formData.parga1_foto2_url ?? null,
        parga2_foto1_url: formData.parga2_foto1_url ?? null,
        parga2_foto2_url: formData.parga2_foto2_url ?? null,
        parga3_foto1_url: formData.parga3_foto1_url ?? null,
        parga3_foto2_url: formData.parga3_foto2_url ?? null,
        parga4_foto1_url: formData.parga4_foto1_url ?? null,
        parga4_foto2_url: formData.parga4_foto2_url ?? null,
      };

      const hasAnyFoto = Object.values(fotosUpdate).some(
        (v) => typeof v === 'string' && v.length > 0
      );

      if (hasAnyFoto) {
        const { data: updated, error: updateError } = await withSchemaSafeRetry(
          fotosUpdate,
          async (safeData) => {
            return await supabase
              .from('produtos')
              .update(safeData as any)
              .eq('id', (data as any).id)
              .select()
              .single();
          },
          { maxRetries: 20 }
        );

        if (updateError) throw updateError;
        return updated;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
}

interface UpdateProdutoData {
  id: string;
  idmm?: string;
  tipo_pedra?: string;
  variedade?: string | null;
  origem_bloco?: string | null;
  nome_comercial?: string | null;
  forma?: FormaProduto;
  acabamento?: string | null;
  comprimento_cm?: number | null;
  largura_cm?: number | null;
  altura_cm?: number | null;
  espessura_cm?: number | null;
  peso_ton?: number | null;
  observacoes?: string | null;
  foto1_url?: string | null;
  foto2_url?: string | null;
  foto3_url?: string | null;
  foto4_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  parga1_nome?: string | null;
  parga1_quantidade?: number | null;
  parga1_comprimento_cm?: number | null;
  parga1_altura_cm?: number | null;
  parga1_espessura_cm?: number | null;
  parga1_foto1_url?: string | null;
  parga1_foto2_url?: string | null;
  parga2_nome?: string | null;
  parga2_quantidade?: number | null;
  parga2_comprimento_cm?: number | null;
  parga2_altura_cm?: number | null;
  parga2_espessura_cm?: number | null;
  parga2_foto1_url?: string | null;
  parga2_foto2_url?: string | null;
  parga3_nome?: string | null;
  parga3_quantidade?: number | null;
  parga3_comprimento_cm?: number | null;
  parga3_altura_cm?: number | null;
  parga3_espessura_cm?: number | null;
  parga3_foto1_url?: string | null;
  parga3_foto2_url?: string | null;
  parga4_nome?: string | null;
  parga4_quantidade?: number | null;
  parga4_comprimento_cm?: number | null;
  parga4_altura_cm?: number | null;
  parga4_espessura_cm?: number | null;
  parga4_foto1_url?: string | null;
  parga4_foto2_url?: string | null;
}

export function useUpdateProduto() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateProdutoData) => {
      const { data, error } = await withSchemaSafeRetry(
        updateData as Record<string, unknown>,
        async (safeData) => {
          return await supabase
            .from('produtos')
            .update(safeData as any)
            .eq('id', id)
            .select()
            .single();
        },
        { maxRetries: 20 }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['produto', variables.id] });
      }
    },
  });
}

export function useDeleteProduto() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('produtos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
}

export function useTiposPedra() {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['tipos-pedra'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('tipo_pedra')
        .eq('ativo', true);

      if (error) throw error;

      const tipos = [...new Set(data.map(p => p.tipo_pedra))].sort();
      return tipos;
    },
  });
}
