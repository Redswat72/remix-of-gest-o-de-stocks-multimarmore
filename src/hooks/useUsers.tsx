import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseEmpresa } from './useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import { toast } from 'sonner';
import type { AppRole } from '@/types/database';

export interface UserComRole {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  avatar_url: string | null;
  local_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  local: { id: string; nome: string; codigo: string } | null;
  user_roles: { role: AppRole }[];
}

export function useUsers() {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', empresa],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          local:locais(*),
          user_roles(role)
        `)
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as unknown as UserComRole[];
    },
    enabled: !!empresa,
  });

  // Atualizar role (delete + insert na tabela user_roles)
  const atualizarRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Permissão atualizada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar permissão: ' + error.message);
    },
  });

  // Desativar/Ativar user
  const toggleAtivo = useMutation({
    mutationFn: async ({ userId, ativo }: { userId: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success(variables.ativo ? 'Utilizador ativado!' : 'Utilizador desativado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar estado: ' + error.message);
    },
  });

  // Atualizar perfil (local, nome, telefone, etc.)
  const atualizarPerfil = useMutation({
    mutationFn: async ({ userId, data }: { 
      userId: string; 
      data: { 
        nome?: string; 
        local_id?: string | null; 
        telefone?: string | null;
        avatar_url?: string | null;
      } 
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Perfil atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    },
  });

  return {
    users,
    isLoading,
    atualizarRole,
    toggleAtivo,
    atualizarPerfil,
  };
}
