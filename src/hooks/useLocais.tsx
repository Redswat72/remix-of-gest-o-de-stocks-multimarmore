import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Local, LocalFormData } from '@/types/database';

interface UseLocaisOptions {
  ativo?: boolean;
}

export function useLocais(options: UseLocaisOptions = {}) {
  const { ativo } = options;

  return useQuery({
    queryKey: ['locais', options],
    queryFn: async () => {
      let query = supabase
        .from('locais')
        .select('*')
        .order('codigo', { ascending: true });

      if (ativo !== undefined) {
        query = query.eq('ativo', ativo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Local[];
    },
  });
}

export function useLocaisAtivos() {
  return useLocais({ ativo: true });
}

export function useLocal(id?: string) {
  return useQuery({
    queryKey: ['local', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('locais')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Local;
    },
    enabled: !!id,
  });
}

export function useCreateLocal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: LocalFormData) => {
      const { data, error } = await supabase
        .from('locais')
        .insert({
          codigo: formData.codigo,
          nome: formData.nome,
          morada: formData.morada || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locais'] });
    },
  });
}

export function useUpdateLocal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: formData }: { id: string; data: Partial<LocalFormData & { ativo: boolean }> }) => {
      const { data, error } = await supabase
        .from('locais')
        .update({
          codigo: formData.codigo,
          nome: formData.nome,
          morada: formData.morada || null,
          ativo: formData.ativo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locais'] });
    },
  });
}

export function useDeleteLocal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - desativar o local
      const { error } = await supabase
        .from('locais')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locais'] });
    },
  });
}
