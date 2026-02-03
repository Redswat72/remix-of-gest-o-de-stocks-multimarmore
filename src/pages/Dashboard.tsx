import { Link } from 'react-router-dom';
import { 
  Package, 
  PlusCircle, 
  History, 
  TrendingUp,
  TrendingDown,
  Boxes,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  MapPin,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useDashboardStats, 
  useMovimentosSemana, 
  useStockPorLocal, 
  useProdutosStockBaixo,
  useMovimentosMensais
} from '@/hooks/useDashboard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const CORES_GRAFICO = {
  entradas: 'hsl(142, 76%, 36%)',
  saidas: 'hsl(38, 92%, 50%)',
  transferencias: 'hsl(217, 91%, 60%)',
};

const CORES_PIE = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(0, 84%, 60%)',
  'hsl(199, 89%, 48%)',
];

export default function Dashboard() {
  const { profile, userLocal, isAdmin, isSuperadmin } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: movimentosSemana, isLoading: semanaLoading } = useMovimentosSemana();
  const { data: stockPorLocal } = useStockPorLocal();
  const { data: produtosStockBaixo } = useProdutosStockBaixo(5);
  const { data: movimentosMensais, isLoading: mensalLoading } = useMovimentosMensais();

  // Últimos movimentos
  const { data: ultimosMovimentos, isLoading: movimentosLoading } = useQuery({
    queryKey: ['ultimos-movimentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimentos')
        .select(`
          id,
          tipo,
          quantidade,
          data_movimento,
          cancelado,
          produto:produtos(idmm, tipo_pedra),
          local_origem:locais!movimentos_local_origem_id_fkey(nome),
          local_destino:locais!movimentos_local_destino_id_fkey(nome),
          cliente:clientes(nome)
        `)
        .order('data_movimento', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <ArrowDownToLine className="w-4 h-4 text-green-600" />;
      case 'transferencia':
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      case 'saida':
        return <ArrowUpFromLine className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Entrada</Badge>;
      case 'transferencia':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Transferência</Badge>;
      case 'saida':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Saída</Badge>;
      default:
        return null;
    }
  };

  const pieData = stockPorLocal?.map((item, index) => ({
    name: item.localNome,
    value: item.totalQuantidade,
    color: CORES_PIE[index % CORES_PIE.length],
  })) || [];

  return (
    <div className="space-y-6">
      {/* Boas vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Olá, {profile?.nome?.split(' ')[0] || 'Utilizador'}! 👋
          </h1>
          <p className="text-muted-foreground">
            {userLocal 
              ? `Local: ${userLocal.nome}`
              : 'Bem-vindo à plataforma de gestão de stock'
            }
          </p>
        </div>
        
        {/* CTA Principal - Mobile destaque */}
        <Link to="/movimento/novo" className="sm:hidden">
          <Button size="lg" className="w-full h-14 text-lg gap-2">
            <PlusCircle className="w-6 h-6" />
            Registar Movimento
          </Button>
        </Link>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Entradas do Mês */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas (Mês)</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.mesAtual.entradas || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stats?.variacaoEntradas !== undefined && stats.variacaoEntradas !== 0 && (
                    <>
                      {stats.variacaoEntradas > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                      )}
                      <span className={stats.variacaoEntradas > 0 ? 'text-green-600' : 'text-red-600'}>
                        {stats.variacaoEntradas > 0 ? '+' : ''}{stats.variacaoEntradas}%
                      </span>
                      <span className="ml-1">vs mês anterior</span>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Saídas do Mês */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas (Mês)</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.mesAtual.saidas || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stats?.variacaoSaidas !== undefined && stats.variacaoSaidas !== 0 && (
                    <>
                      {stats.variacaoSaidas > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                      )}
                      <span className={stats.variacaoSaidas > 0 ? 'text-green-600' : 'text-red-600'}>
                        {stats.variacaoSaidas > 0 ? '+' : ''}{stats.variacaoSaidas}%
                      </span>
                      <span className="ml-1">vs mês anterior</span>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalStock || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.produtosComStock} produtos diferentes
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Locais Ativos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parques Ativos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.locaisAtivos || 0}</div>
                <p className="text-xs text-muted-foreground">
                  locais de armazenamento
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Movimentos da Semana */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Movimentos da Semana
            </CardTitle>
            <CardDescription>Entradas e saídas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            {semanaLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : movimentosSemana && movimentosSemana.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={movimentosSemana}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dataFormatada" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="entradas" name="Entradas" fill={CORES_GRAFICO.entradas} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill={CORES_GRAFICO.saidas} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {mensalLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : movimentosMensais && movimentosMensais.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={movimentosMensais}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="mes" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="entradas" 
                    name="Entradas"
                    stroke={CORES_GRAFICO.entradas} 
                    strokeWidth={2}
                    dot={{ fill: CORES_GRAFICO.entradas }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saidas" 
                    name="Saídas"
                    stroke={CORES_GRAFICO.saidas} 
                    strokeWidth={2}
                    dot={{ fill: CORES_GRAFICO.saidas }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de gráficos/info */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stock por Local - Pie Chart */}
        {(isAdmin || isSuperadmin) && pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Stock por Parque</CardTitle>
              <CardDescription>Distribuição do stock</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} un.`, 'Quantidade']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend 
                    formatter={(value: string) => <span className="text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Produtos com Stock Baixo */}
        <Card className={pieData.length > 0 && (isAdmin || isSuperadmin) ? '' : 'lg:col-span-2'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Stock Baixo
            </CardTitle>
            <CardDescription>Produtos com menos de 5 unidades</CardDescription>
          </CardHeader>
          <CardContent>
            {produtosStockBaixo && produtosStockBaixo.length > 0 ? (
              <div className="space-y-3">
                {produtosStockBaixo.slice(0, 5).map((item) => (
                  <div key={`${item.produtoId}-${item.localNome}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{item.idmm}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.tipoPedra} • {item.localNome}
                      </p>
                    </div>
                    <Badge 
                      variant={item.quantidade <= 2 ? 'destructive' : 'secondary'}
                      className="ml-2"
                    >
                      {item.quantidade} un.
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum produto com stock baixo</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atalhos Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link to="/movimento/novo">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <PlusCircle className="h-5 w-5" />
                <span className="text-xs">Novo Movimento</span>
              </Button>
            </Link>
            <Link to="/stock">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Package className="h-5 w-5" />
                <span className="text-xs">Ver Stock</span>
              </Button>
            </Link>
            <Link to="/historico">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <History className="h-5 w-5" />
                <span className="text-xs">Histórico</span>
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/produtos">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <Boxes className="h-5 w-5" />
                  <span className="text-xs">Produtos</span>
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimos Movimentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Últimos Movimentos</CardTitle>
            <CardDescription>Os 5 movimentos mais recentes</CardDescription>
          </div>
          <Link to="/historico">
            <Button variant="outline" size="sm">
              Ver todos
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {movimentosLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : ultimosMovimentos && ultimosMovimentos.length > 0 ? (
            <div className="space-y-4">
              {ultimosMovimentos.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <div className="p-2 rounded-full bg-background">
                    {getTipoIcon(mov.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTipoBadge(mov.tipo)}
                      {mov.cancelado && (
                        <Badge variant="destructive">Cancelado</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate mt-1">
                      {(mov.produto as { idmm: string; tipo_pedra: string })?.idmm} - {(mov.produto as { idmm: string; tipo_pedra: string })?.tipo_pedra}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mov.quantidade} un. • {new Date(mov.data_movimento).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum movimento registado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
