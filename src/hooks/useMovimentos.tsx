import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import type { MovimentoFormData, TipoMovimento, TipoDocumento, OrigemMaterial } from '@/types/database';
import { useAuth } from './useAuth';

export interface MovimentoComDetalhes {
  id: string;
  tipo: TipoMovimento;
  tipo_documento: TipoDocumento;
  numero_documento: string | null;
  origem_material: OrigemMaterial | null;
  produto_id: string | null;
  id_mm: string | null;
  tipo_produto: string | null;
  quantidade: number;
  local_origem_id: string | null;
  local_destino_id: string | null;
  cliente_id: string | null;
  matricula_viatura: string | null;
  operador_id: string;
  cancelado: boolean;
  cancelado_por: string | null;
  cancelado_em: string | null;
  motivo_cancelamento: string | null;
  observacoes: string | null;
  data_movimento: string;
  created_at: string;
  updated_at: string;
  local_origem: { id: string; nome: string; codigo: string } | null;
  local_destino: { id: string; nome: string; codigo: string } | null;
  operador: { id: string; nome: string; email: string } | null;
}

interface UseMovimentosOptions {
  dataInicio?: string;
  dataFim?: string;
  tipo?: string;
  localId?: string;
  produtoId?: string;
  idMm?: string;
  operadorId?: string;
  cancelados?: boolean;
  limit?: number;
  page?: number;
}

export function useMovimentos(options: UseMovimentosOptions = {}) {
  const supabase = useSupabaseEmpresa();
  const { dataInicio, dataFim, tipo, localId, produtoId, idMm, operadorId, cancelados, limit = 50, page = 0 } = options;

  return useQuery({
    queryKey: ['movimentos', options],
    queryFn: async () => {
      const from = page * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('movimentos')
        .select(`
          *,
          local_origem:locais!movimentos_local_origem_id_fkey(id, nome, codigo),
          local_destino:locais!movimentos_local_destino_id_fkey(id, nome, codigo),
          operador:profiles!movimentos_operador_id_fkey(id, nome, email)
        `, { count: 'exact' })
        .order('data_movimento', { ascending: false })
        .range(from, to);

      if (dataInicio) {
        query = query.gte('data_movimento', dataInicio);
      }
      if (dataFim) {
        query = query.lte('data_movimento', dataFim + 'T23:59:59');
      }
      if (tipo) {
        query = query.eq('tipo', tipo as TipoMovimento);
      }
      if (localId) {
        query = query.or(`local_origem_id.eq.${localId},local_destino_id.eq.${localId}`);
      }
      if (produtoId) {
        query = query.eq('produto_id', produtoId);
      }
      if (idMm) {
        query = query.eq('id_mm', idMm);
      }
      if (operadorId) {
        query = query.eq('operador_id', operadorId);
      }
      if (cancelados !== undefined) {
        query = query.eq('cancelado', cancelados);
      }

      const { data, error, count } = await query;

      console.log('[useMovimentos] Query result:', { 
        dataLength: data?.length, 
        count, 
        error, 
        filters: { dataInicio, dataFim, tipo, localId, produtoId, idMm, operadorId, cancelados },
        firstRow: data?.[0] ?? null 
      });

      if (error) throw error;
      return { data: data as unknown as MovimentoComDetalhes[], count: count ?? 0 };
    },
  });
}

export function useCreateMovimento() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: MovimentoFormData) => {
      if (!user) throw new Error('Utilizador não autenticado');

      const insertPayload: Record<string, unknown> = {
          tipo: formData.tipo,
          tipo_documento: formData.tipo_documento,
          numero_documento: formData.numero_documento || null,
          origem_material: formData.origem_material || null,
          quantidade: formData.quantidade,
          local_origem_id: formData.local_origem_id || null,
          local_destino_id: formData.local_destino_id || null,
          cliente_id: formData.cliente_id || null,
          matricula_viatura: formData.matricula_viatura || null,
          observacoes: formData.observacoes || null,
          operador_id: user.id,
        };

      // Always include id_mm and tipo_produto
      insertPayload.id_mm = formData.id_mm || null;
      insertPayload.tipo_produto = formData.tipo_produto || null;
      if (formData.produto_id) insertPayload.produto_id = formData.produto_id;

      const { data, error } = await supabase
        .from('movimentos')
        .insert(insertPayload as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentos'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock-agregado'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['ultimos-movimentos'] });
    },
  });
}

export function useCancelMovimento() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ movimentoId, motivo }: { movimentoId: string; motivo: string }) => {
      if (!user) throw new Error('Utilizador não autenticado');

      const { data, error } = await supabase
        .from('movimentos')
        .update({
          cancelado: true,
          cancelado_por: user.id,
          cancelado_em: new Date().toISOString(),
          motivo_cancelamento: motivo,
        })
        .eq('id', movimentoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentos'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock-agregado'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['ultimos-movimentos'] });
    },
  });
}
