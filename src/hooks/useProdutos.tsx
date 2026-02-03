import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Produto, ProdutoFormData, FormaProduto } from '@/types/database';

interface UseProdutosOptions {
  tipoPedra?: string;
  forma?: string;
  idmm?: string;
  ativo?: boolean;
}

export function useProdutos(options: UseProdutosOptions = {}) {
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

export function useCreateProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ProdutoFormData) => {
      const { data, error } = await supabase
        .from('produtos')
        .insert({
          idmm: formData.idmm,
          tipo_pedra: formData.tipo_pedra,
          nome_comercial: formData.nome_comercial || null,
          forma: formData.forma,
          acabamento: formData.acabamento || null,
          comprimento_cm: formData.comprimento_cm || null,
          largura_cm: formData.largura_cm || null,
          altura_cm: formData.altura_cm || null,
          espessura_cm: formData.espessura_cm || null,
          observacoes: formData.observacoes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
}

export function useUpdateProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: formData }: { id: string; data: Partial<ProdutoFormData> }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update({
          idmm: formData.idmm,
          tipo_pedra: formData.tipo_pedra,
          nome_comercial: formData.nome_comercial || null,
          forma: formData.forma,
          acabamento: formData.acabamento || null,
          comprimento_cm: formData.comprimento_cm || null,
          largura_cm: formData.largura_cm || null,
          altura_cm: formData.altura_cm || null,
          espessura_cm: formData.espessura_cm || null,
          observacoes: formData.observacoes || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
}

export function useDeleteProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - desativar o produto
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
  return useQuery({
    queryKey: ['tipos-pedra'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('tipo_pedra')
        .eq('ativo', true);

      if (error) throw error;

      // Remover duplicados
      const tipos = [...new Set(data.map(p => p.tipo_pedra))].sort();
      return tipos;
    },
  });
}
