import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import type { Local, LocalFormData, TipoLocal } from '@/types/database';

interface UseLocaisOptions {
  ativo?: boolean;
  tipo?: TipoLocal;
}

export function useLocais(options: UseLocaisOptions = {}) {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();
  const { ativo, tipo } = options;

  return useQuery({
    queryKey: ['locais', empresa, options],
    queryFn: async () => {
      let query = supabase
        .from('locais')
        .select('*')
        .order('codigo', { ascending: true });

      if (ativo !== undefined) query = query.eq('ativo', ativo);
      if (tipo) query = query.eq('tipo', tipo);

      const { data, error } = await query;
      if (error) throw error;
      // Locais sem tipo (registos antigos) são parques.
      return ((data ?? []) as Local[]).map(l => ({ ...l, tipo: l.tipo ?? 'parque' }));
    },
    enabled: !!empresa,
  });
}

export function useLocaisAtivos() {
  return useLocais({ ativo: true });
}

export function useLocal(id?: string) {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();

  return useQuery({
    queryKey: ['local', empresa, id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('locais').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Local;
    },
    enabled: !!id && !!empresa,
  });
}

export function useCreateLocal() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: LocalFormData) => {
      const isPrestador = formData.tipo === 'prestador';
      const payload: Record<string, unknown> = {
        nome: formData.nome.trim(),
        morada: formData.morada?.trim() || null,
        ativo: true,
      };
      if (isPrestador) {
        // A base de dados gera o código (PS001, PS002, ...).
        payload.tipo = 'prestador';
      } else {
        payload.codigo = formData.codigo;
      }
      const { data, error } = await supabase.from('locais').insert(payload).select().single();
      if (error) throw error;
      return data as Local;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locais'] });
    },
  });
}

export function useUpdateLocal() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: formData }: { id: string; data: Partial<LocalFormData & { ativo: boolean }> }) => {
      const payload: Record<string, unknown> = {};
      if (formData.codigo !== undefined && formData.tipo !== 'prestador') payload.codigo = formData.codigo;
      if (formData.nome !== undefined) payload.nome = formData.nome;
      if (formData.morada !== undefined) payload.morada = formData.morada || null;
      if (formData.ativo !== undefined) payload.ativo = formData.ativo;
      const { data, error } = await supabase.from('locais').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locais'] });
    },
  });
}

export function useDeleteLocal() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('locais').update({ ativo: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locais'] });
    },
  });
}
