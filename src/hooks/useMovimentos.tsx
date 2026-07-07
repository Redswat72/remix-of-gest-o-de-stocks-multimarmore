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
  cliente_nome: string | null;
  matricula_viatura: string | null;
  operador_id: string;
  cancelado: boolean;
  cancelado_por: string | null;
  cancelado_em: string | null;
  motivo_cancelamento: string | null;
  validado?: boolean | null;
  validado_por?: string | null;
  validado_em?: string | null;
  observacoes: string | null;
  data_movimento: string;
  created_at: string;
  updated_at: string;
  local_origem?: { id: string; nome: string; codigo: string } | null;
  local_destino?: { id: string; nome: string; codigo: string } | null;
  operador?: { id: string; nome: string; email: string } | null;
  adendas?: import('@/types/database').MovimentoAdenda[];
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
      let query = supabase
        .from('movimentos')
        .select('*', { count: 'exact' })
        .order('data_movimento', { ascending: false })
        .range(page * limit, page * limit + limit - 1);

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

      if (error) throw error;

      // Buscar adendas dos movimentos retornados
      const movIds = (data || []).map(m => m.id);
      let adendasMap = new Map<string, any[]>();

      if (movIds.length > 0) {
        const { data: adendasData } = await supabase
          .from('movimento_adendas')
          .select('*')
          .in('movimento_id', movIds)
          .order('created_at', { ascending: true });

        if (adendasData) {
          adendasData.forEach((adenda: any) => {
            const normalized = {
              ...adenda,
              estado_operacao: adenda.estado_operacao ?? adenda.estado_validacao,
              criado_por: adenda.criado_por ?? adenda.validado_por,
              documentos: Array.isArray(adenda.documentos) ? adenda.documentos : [],
            };
            const list = adendasMap.get(adenda.movimento_id) || [];
            list.push(normalized);
            adendasMap.set(adenda.movimento_id, list);
          });
        }
      }

      const enrichedData = (data || []).map(mov => ({
        ...mov,
        adendas: adendasMap.get(mov.id) || []
      }));

      return { data: enrichedData as unknown as MovimentoComDetalhes[], count: count ?? 0 };
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

      const clienteNome = formData.cliente_nome?.trim() || '';

      const insertPayload: Record<string, unknown> = {
          tipo: formData.tipo,
          tipo_documento: formData.tipo_documento,
          numero_documento: formData.numero_documento || null,
          origem_material: formData.origem_material || null,
          quantidade: formData.quantidade,
          local_origem_id: formData.local_origem_id || null,
          local_destino_id: formData.local_destino_id || null,
          cliente_id: formData.cliente_id || null,
          cliente_nome: clienteNome || null,
          matricula_viatura: formData.matricula_viatura || null,
          observacoes: formData.observacoes || null,
          operador_id: user.id,
        };

      // Always include id_mm and tipo_produto
      insertPayload.id_mm = formData.id_mm || null;
      insertPayload.tipo_produto = formData.tipo_produto || null;
      if (formData.produto_id) insertPayload.produto_id = formData.produto_id;

      let { data, error } = await supabase
        .from('movimentos')
        .insert(insertPayload as any)
        .select()
        .single();

      const errorMessage = error?.message || '';
      if (error && errorMessage.includes('cliente_nome')) {
        const fallbackPayload = { ...insertPayload };
        delete fallbackPayload.cliente_nome;
        const retry = await supabase
          .from('movimentos')
          .insert(fallbackPayload as any)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        const msg = error.message || '';
        if (formData.tipo === 'saida' && msg.includes('movimento_saida_cliente')) {
          throw new Error('Indique o nome do cliente em texto livre antes de registar a saída.');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentos'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock-agregado'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['ultimos-movimentos'] });
      queryClient.invalidateQueries({ queryKey: ['blocos-unificado'] });
      queryClient.invalidateQueries({ queryKey: ['chapas-unificado'] });
      queryClient.invalidateQueries({ queryKey: ['ladrilho-unificado'] });
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
      queryClient.invalidateQueries({ queryKey: ['blocos-unificado'] });
      queryClient.invalidateQueries({ queryKey: ['chapas-unificado'] });
      queryClient.invalidateQueries({ queryKey: ['ladrilho-unificado'] });
    },
  });
}

export function useValidarMovimento() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ movimentoId }: { movimentoId: string }) => {
      if (!user) throw new Error('Utilizador não autenticado');
      const { data, error } = await supabase
        .from('movimentos')
        .update({
          validado: true,
          validado_por: user.id,
          validado_em: new Date().toISOString(),
        } as any)
        .eq('id', movimentoId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentos'] });
      queryClient.invalidateQueries({ queryKey: ['movimentos-validar'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
    },
  });
}

export function useCreateAdenda() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      movimentoId,
      idMm,
      descricao,
      estadoOperacao,
      documentos,
    }: {
      movimentoId: string;
      idMm: string | null;
      descricao: string;
      estadoOperacao: import('@/types/database').EstadoAdenda;
      documentos: { url: string; nome: string; tipo?: string }[];
    }) => {
      if (!user) throw new Error('Utilizador não autenticado');

      const { data: adenda, error: errAdenda } = await supabase
        .from('movimento_adendas')
        .insert({
          movimento_id: movimentoId,
          id_mm: idMm,
          criado_por: user.id,
          descricao,
          estado_operacao: estadoOperacao,
          documentos: documentos ?? [],
        } as any)
        .select()
        .single();

      if (errAdenda || !adenda) throw errAdenda || new Error('Erro ao criar adenda');

      return adenda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentos'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
    },
  });
}

