import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { pt } from 'date-fns/locale';

export interface MovimentoStats {
  entradas: number;
  saidas: number;
  transferencias: number;
  total: number;
}

export interface MovimentoDiario {
  data: string;
  dataFormatada: string;
  entradas: number;
  saidas: number;
  transferencias: number;
}

export interface StockPorLocal {
  localId: string;
  localNome: string;
  totalProdutos: number;
  totalQuantidade: number;
}

export interface ProdutoStockBaixo {
  produtoId: string;
  idmm: string;
  tipoPedra: string;
  forma: string;
  localNome: string;
  quantidade: number;
}

// Estatísticas gerais do dashboard
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats-extended'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje);
      const fimMes = endOfMonth(hoje);
      const mesAnteriorInicio = startOfMonth(subMonths(hoje, 1));
      const mesAnteriorFim = endOfMonth(subMonths(hoje, 1));

      // Movimentos do mês atual
      const { data: movimentosMes } = await supabase
        .from('movimentos')
        .select('tipo, quantidade')
        .gte('data_movimento', inicioMes.toISOString())
        .lte('data_movimento', fimMes.toISOString())
        .eq('cancelado', false);

      // Movimentos do mês anterior para comparação
      const { data: movimentosMesAnterior } = await supabase
        .from('movimentos')
        .select('tipo, quantidade')
        .gte('data_movimento', mesAnteriorInicio.toISOString())
        .lte('data_movimento', mesAnteriorFim.toISOString())
        .eq('cancelado', false);

      // Total de stock
      const { data: stockTotal } = await supabase
        .from('stock')
        .select('quantidade')
        .gt('quantidade', 0);

      // Produtos únicos com stock
      const { count: produtosComStock } = await supabase
        .from('stock')
        .select('produto_id', { count: 'exact', head: true })
        .gt('quantidade', 0);

      // Locais ativos
      const { count: locaisAtivos } = await supabase
        .from('locais')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      const calcStats = (movimentos: any[] | null): MovimentoStats => {
        if (!movimentos) return { entradas: 0, saidas: 0, transferencias: 0, total: 0 };
        
        return movimentos.reduce((acc, m) => {
          if (m.tipo === 'entrada') acc.entradas += m.quantidade;
          else if (m.tipo === 'saida') acc.saidas += m.quantidade;
          else if (m.tipo === 'transferencia') acc.transferencias += m.quantidade;
          acc.total += m.quantidade;
          return acc;
        }, { entradas: 0, saidas: 0, transferencias: 0, total: 0 });
      };

      const statsMesAtual = calcStats(movimentosMes);
      const statsMesAnterior = calcStats(movimentosMesAnterior);

      const totalStock = stockTotal?.reduce((acc, s) => acc + s.quantidade, 0) || 0;

      // Calcular variação percentual
      const calcVariacao = (atual: number, anterior: number) => {
        if (anterior === 0) return atual > 0 ? 100 : 0;
        return Math.round(((atual - anterior) / anterior) * 100);
      };

      return {
        mesAtual: statsMesAtual,
        mesAnterior: statsMesAnterior,
        variacaoEntradas: calcVariacao(statsMesAtual.entradas, statsMesAnterior.entradas),
        variacaoSaidas: calcVariacao(statsMesAtual.saidas, statsMesAnterior.saidas),
        totalStock,
        produtosComStock: produtosComStock || 0,
        locaisAtivos: locaisAtivos || 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Movimentos por dia (últimos 7 dias)
export function useMovimentosSemana() {
  return useQuery({
    queryKey: ['movimentos-semana'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 }); // Segunda-feira
      const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });

      const { data } = await supabase
        .from('movimentos')
        .select('tipo, quantidade, data_movimento')
        .gte('data_movimento', inicioSemana.toISOString())
        .lte('data_movimento', fimSemana.toISOString())
        .eq('cancelado', false);

      const dias = eachDayOfInterval({ start: inicioSemana, end: fimSemana });
      
      const resultado: MovimentoDiario[] = dias.map(dia => {
        const dataStr = format(dia, 'yyyy-MM-dd');
        const movimentosDia = data?.filter(m => 
          m.data_movimento.startsWith(dataStr)
        ) || [];

        return {
          data: dataStr,
          dataFormatada: format(dia, 'EEE', { locale: pt }),
          entradas: movimentosDia.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.quantidade, 0),
          saidas: movimentosDia.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.quantidade, 0),
          transferencias: movimentosDia.filter(m => m.tipo === 'transferencia').reduce((acc, m) => acc + m.quantidade, 0),
        };
      });

      return resultado;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Stock por local/parque
export function useStockPorLocal() {
  return useQuery({
    queryKey: ['stock-por-local'],
    queryFn: async () => {
      const { data } = await supabase
        .from('stock')
        .select(`
          quantidade,
          local:locais(id, nome)
        `)
        .gt('quantidade', 0);

      if (!data) return [];

      const porLocal = new Map<string, StockPorLocal>();

      data.forEach(item => {
        const local = item.local as { id: string; nome: string } | null;
        if (!local) return;

        if (!porLocal.has(local.id)) {
          porLocal.set(local.id, {
            localId: local.id,
            localNome: local.nome,
            totalProdutos: 0,
            totalQuantidade: 0,
          });
        }

        const entry = porLocal.get(local.id)!;
        entry.totalProdutos += 1;
        entry.totalQuantidade += item.quantidade;
      });

      return Array.from(porLocal.values()).sort((a, b) => b.totalQuantidade - a.totalQuantidade);
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Produtos com stock baixo (menos de 5 unidades)
export function useProdutosStockBaixo(limite: number = 5) {
  return useQuery({
    queryKey: ['produtos-stock-baixo', limite],
    queryFn: async () => {
      const { data } = await supabase
        .from('stock')
        .select(`
          quantidade,
          produto:produtos(id, idmm, tipo_pedra, forma),
          local:locais(nome)
        `)
        .gt('quantidade', 0)
        .lte('quantidade', limite)
        .order('quantidade', { ascending: true })
        .limit(10);

      if (!data) return [];

      return data.map(item => {
        const produto = item.produto as { id: string; idmm: string; tipo_pedra: string; forma: string } | null;
        const local = item.local as { nome: string } | null;
        
        return {
          produtoId: produto?.id || '',
          idmm: produto?.idmm || '',
          tipoPedra: produto?.tipo_pedra || '',
          forma: produto?.forma || '',
          localNome: local?.nome || '',
          quantidade: item.quantidade,
        };
      });
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Movimentos por mês (últimos 6 meses)
export function useMovimentosMensais() {
  return useQuery({
    queryKey: ['movimentos-mensais'],
    queryFn: async () => {
      const hoje = new Date();
      const meses: { inicio: Date; fim: Date; label: string }[] = [];

      for (let i = 5; i >= 0; i--) {
        const mes = subMonths(hoje, i);
        meses.push({
          inicio: startOfMonth(mes),
          fim: endOfMonth(mes),
          label: format(mes, 'MMM', { locale: pt }),
        });
      }

      const { data } = await supabase
        .from('movimentos')
        .select('tipo, quantidade, data_movimento')
        .gte('data_movimento', meses[0].inicio.toISOString())
        .eq('cancelado', false);

      return meses.map(mes => {
        const movimentosMes = data?.filter(m => {
          const dataMovimento = new Date(m.data_movimento);
          return dataMovimento >= mes.inicio && dataMovimento <= mes.fim;
        }) || [];

        return {
          mes: mes.label,
          entradas: movimentosMes.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.quantidade, 0),
          saidas: movimentosMes.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.quantidade, 0),
        };
      });
    },
    staleTime: 1000 * 60 * 10,
  });
}
