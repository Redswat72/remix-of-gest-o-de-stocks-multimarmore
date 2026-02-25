import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseEmpresa } from "./useSupabaseEmpresa";
import { useEmpresa } from "@/context/EmpresaContext";
import { toast } from "sonner";

export interface User {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: "superadmin" | "admin" | "user";
  empresa_id: string | null;
  aprovado: boolean;
  aprovado_por: string | null;
  aprovado_em: string | null;
  ativo: boolean;
  created_at: string;
}

export function useUsers() {
  const supabase = useSupabaseEmpresa();
  const { empresaAtiva } = useEmpresa();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", empresaAtiva?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

      if (error) throw error;
      return data as User[];
    },
    enabled: !!empresaAtiva,
  });

  const aprovarUser = useMutation({
    mutationFn: async ({ userId, role, empresaId }: { userId: string; role: string; empresaId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("profiles")
        .update({
          aprovado: true,
          aprovado_por: user?.id,
          aprovado_em: new Date().toISOString(),
          role: role,
          empresa_id: empresaId,
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilizador aprovado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao aprovar: " + error.message);
    },
  });

  const rejeitarUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data: profile } = await supabase.from("profiles").select("user_id").eq("id", userId).single();

      if (!profile) throw new Error("Profile não encontrado");

      const { error: authError } = await supabase.auth.admin.deleteUser(profile.user_id);
      if (authError) throw authError;

      const { error } = await supabase.from("profiles").delete().eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilizador rejeitado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao rejeitar: " + error.message);
    },
  });

  const atualizarRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data, error } = await supabase.from("profiles").update({ role }).eq("id", userId).select().single();

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase.from("profiles").update({ ativo }).eq("id", userId).select().single();

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
      empresaId,
    }: {
      email: string;
      nome: string;
      role: string;
      empresaId: string;
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

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: authData.user.id,
          nome,
          email,
          role,
          empresa_id: empresaId,
          aprovado: true,
          ativo: true,
        })
        .select()
        .single();

      if (profileError) throw profileError;
      return profileData;
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
    aprovarUser,
    rejeitarUser,
    atualizarRole,
    toggleAtivo,
    convidarUser,
  };
}
