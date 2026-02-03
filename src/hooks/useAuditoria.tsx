import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditoriaRecord {
  id: string;
  data_hora: string;
  user_id: string;
  user_nome: string;
  user_email: string;
  user_role: string;
  tipo_acao: string;
  entidade: string;
  entidade_id: string | null;
  descricao: string;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditoriaFilters {
  dataInicio?: string;
  dataFim?: string;
  userId?: string;
  tipoAcao?: string;
  entidade?: string;
}

export function useAuditoria(filters: AuditoriaFilters = {}) {
  return useQuery({
    queryKey: ['auditoria', filters],
    queryFn: async () => {
      let query = supabase
        .from('auditoria')
        .select('*')
        .order('data_hora', { ascending: false });

      if (filters.dataInicio) {
        query = query.gte('data_hora', filters.dataInicio);
      }
      if (filters.dataFim) {
        query = query.lte('data_hora', filters.dataFim + 'T23:59:59');
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.tipoAcao) {
        query = query.eq('tipo_acao', filters.tipoAcao);
      }
      if (filters.entidade) {
        query = query.eq('entidade', filters.entidade);
      }

      const { data, error } = await query.limit(500);
      
      if (error) throw error;
      return data as AuditoriaRecord[];
    },
  });
}

export function useAuditoriaTiposAcao() {
  return useQuery({
    queryKey: ['auditoria-tipos-acao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auditoria')
        .select('tipo_acao')
        .limit(1000);
      
      if (error) throw error;
      
      const tipos = [...new Set(data?.map(d => d.tipo_acao) || [])];
      return tipos.sort();
    },
  });
}

export function useAuditoriaUsers() {
  return useQuery({
    queryKey: ['auditoria-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auditoria')
        .select('user_id, user_nome, user_email')
        .limit(1000);
      
      if (error) throw error;
      
      const usersMap = new Map<string, { id: string; nome: string; email: string }>();
      data?.forEach(d => {
        if (!usersMap.has(d.user_id)) {
          usersMap.set(d.user_id, { id: d.user_id, nome: d.user_nome, email: d.user_email });
        }
      });
      
      return Array.from(usersMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
    },
  });
}
