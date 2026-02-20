import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-external';
import { supabaseMagratex } from '@/lib/supabase-magratex';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Produto } from '@/types/database';

export default function ProdutoPublico() {
  const { idmm } = useParams<{ idmm: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Detect company by ID prefix
  const client = useMemo(() => {
    const isMagratex = idmm?.toUpperCase().startsWith('IDMTX');
    return isMagratex ? supabaseMagratex : supabase;
  }, [idmm]);

  const { data: produto, isLoading: produtoLoading, error } = useQuery({
    queryKey: ['produto-publico', idmm],
    queryFn: async () => {
      if (!idmm) return null;
      const { data, error } = await client
        .from('produtos')
        .select('*')
        .eq('idmm', idmm)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Produto;
    },
    enabled: !!idmm,
  });

  useEffect(() => {
    if (authLoading || produtoLoading) return;
    if (!user) {
      navigate('/login', { state: { from: location }, replace: true });
      return;
    }
    if (produto) {
      navigate(`/produto/${produto.id}`, { replace: true });
    }
  }, [user, authLoading, produto, produtoLoading, navigate, location]);

  if (authLoading || produtoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-center">A carregar produto...</p>
          {idmm && <p className="text-sm font-mono text-muted-foreground">{decodeURIComponent(idmm)}</p>}
        </div>
      </div>
    );
  }

  if (error || !produto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <div>
              <h1 className="text-xl font-bold mb-2">Produto não encontrado</h1>
              <p className="text-muted-foreground">
                O produto com IDMM <span className="font-mono">{idmm ? decodeURIComponent(idmm) : 'desconhecido'}</span> não foi encontrado no sistema.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/stock')}>Ver Stock</Button>
              <Button variant="outline" onClick={() => navigate('/')}>Ir para Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
