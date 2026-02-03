import { Link } from 'react-router-dom';
import { 
  Package, 
  PlusCircle, 
  History, 
  TrendingUp,
  Boxes,
  ArrowRightLeft,
  ArrowDownToLine,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { profile, userLocal, isAdmin } = useAuth();

  // Estatísticas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Total de produtos com stock
      const { count: produtosCount } = await supabase
        .from('stock')
        .select('*', { count: 'exact', head: true })
        .gt('quantidade', 0);

      // Movimentos de hoje
      const { count: movimentosHoje } = await supabase
        .from('movimentos')
        .select('*', { count: 'exact', head: true })
        .gte('data_movimento', today)
        .eq('cancelado', false);

      // Total de clientes ativos
      const { count: clientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      return {
        produtosComStock: produtosCount || 0,
        movimentosHoje: movimentosHoje || 0,
        clientesAtivos: clientesCount || 0,
      };
    },
  });

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
        return <ArrowDownToLine className="w-4 h-4 text-success" />;
      case 'transferencia':
        return <ArrowRightLeft className="w-4 h-4 text-info" />;
      case 'saida':
        return <Package className="w-4 h-4 text-warning" />;
      default:
        return null;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <Badge className="bg-success text-success-foreground">Entrada</Badge>;
      case 'transferencia':
        return <Badge className="bg-info text-info-foreground">Transferência</Badge>;
      case 'saida':
        return <Badge className="bg-warning text-warning-foreground">Saída</Badge>;
      default:
        return null;
    }
  };

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

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos em Stock</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.produtosComStock}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentos Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.movimentosHoje}</div>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.clientesAtivos}</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Atalhos Rápidos */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link to="/movimento/novo" className="hidden sm:block">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <PlusCircle className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium text-center">Registar Movimento</span>
            </CardContent>
          </Card>
        </Link>

        <Link to="/stock">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium text-center">Ver Stock</span>
            </CardContent>
          </Card>
        </Link>

        <Link to="/historico">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <History className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium text-center">Histórico</span>
            </CardContent>
          </Card>
        </Link>

        {isAdmin && (
          <Link to="/produtos">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Boxes className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium text-center">Gerir Produtos</span>
              </CardContent>
            </Card>
          </Link>
        )}
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
