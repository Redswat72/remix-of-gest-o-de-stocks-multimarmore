import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import type { Profile, AppRole } from '@/types/database';

interface ProfileComRoles extends Profile {
  user_roles: { role: AppRole }[];
}

interface UseProfilesOptions {
  ativo?: boolean;
}

export function useProfiles(options: UseProfilesOptions = {}) {
  const supabase = useSupabaseEmpresa();
  const { ativo } = options;

  return useQuery({
    queryKey: ['profiles', options],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          local:locais(*),
          user_roles(role)
        `)
        .order('nome', { ascending: true });

      if (ativo !== undefined) {
        query = query.eq('ativo', ativo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as ProfileComRoles[];
    },
  });
}

export function useUpdateProfile() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      data 
    }: { 
      userId: string; 
      data: { 
        nome?: string; 
        local_id?: string | null; 
        ativo?: boolean;
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
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useUpdateUserRole() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  return useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}
