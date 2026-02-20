import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import type { Cliente, ClienteFormData } from '@/types/database';

interface UseClientesOptions {
  nome?: string;
  ativo?: boolean;
}

export function useClientes(options: UseClientesOptions = {}) {
  const supabase = useSupabaseEmpresa();
  const { nome, ativo = true } = options;

  return useQuery({
    queryKey: ['clientes', options],
    queryFn: async () => {
      let query = supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (ativo !== undefined) {
        query = query.eq('ativo', ativo);
      }

      if (nome) {
        query = query.ilike('nome', `%${nome}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Cliente[];
    },
  });
}

export function useCliente(id?: string) {
  const supabase = useSupabaseEmpresa();

  return useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Cliente;
    },
    enabled: !!id,
  });
}

export function useCreateCliente() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ClienteFormData) => {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: formData.nome,
          nif: formData.nif || null,
          morada: formData.morada || null,
          codigo_postal: formData.codigo_postal || null,
          localidade: formData.localidade || null,
          telefone: formData.telefone || null,
          email: formData.email || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useUpdateCliente() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: formData }: { id: string; data: Partial<ClienteFormData> }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update({
          nome: formData.nome,
          nif: formData.nif || null,
          morada: formData.morada || null,
          codigo_postal: formData.codigo_postal || null,
          localidade: formData.localidade || null,
          telefone: formData.telefone || null,
          email: formData.email || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useDeleteCliente() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clientes')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}
