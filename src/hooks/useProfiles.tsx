import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, AppRole } from '@/types/database';

interface ProfileComRoles extends Profile {
  user_roles: { role: AppRole }[];
}

interface UseProfilesOptions {
  ativo?: boolean;
}

export function useProfiles(options: UseProfilesOptions = {}) {
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      data 
    }: { 
      userId: string; 
      data: { nome?: string; local_id?: string | null; ativo?: boolean } 
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Primeiro, remover roles existentes
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Depois, adicionar a nova role
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
