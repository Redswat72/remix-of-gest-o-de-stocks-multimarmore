import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseEmpresa } from "./useSupabaseEmpresa";
import { useEmpresa } from "@/context/EmpresaContext";
import { toast } from "sonner";
import type { AppRole } from "@/types/database";

export interface User {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  local_id: string | null;
  ativo: boolean;
  created_at: string;
  // Joined data
  local?: { id: string; nome: string } | null;
  user_roles?: { role: AppRole }[];
}

export function useUsers() {
  const supabase = useSupabaseEmpresa();
  const { empresa } = useEmpresa();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", empresa],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, local:locais(id, nome), user_roles(role)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as User[];
    },
    enabled: !!empresa,
  });

  const atualizarRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Upsert into user_roles
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Permissão atualizada!");
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ userId, ativo }: { userId: string; ativo: boolean }) => {
      const { data, error } = await supabase.from("profiles").update({ ativo }).eq("user_id", userId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(variables.ativo ? "Utilizador ativado!" : "Utilizador desativado!");
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const convidarUser = useMutation({
    mutationFn: async ({
      email,
      nome,
      role,
    }: {
      email: string;
      nome: string;
      role: string;
    }) => {
      const tempPassword = Math.random().toString(36).slice(-12) + "A1!";

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: { nome },
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar utilizador");

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: authData.user.id,
          nome,
          email,
          ativo: true,
        });

      if (profileError) throw profileError;

      // Create role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role,
        });

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Convite enviado! O utilizador receberá um email de confirmação.");
    },
    onError: (error: any) => {
      toast.error("Erro ao enviar convite: " + error.message);
    },
  });

  return {
    users,
    isLoading,
    atualizarRole,
    toggleAtivo,
    convidarUser,
  };
}
