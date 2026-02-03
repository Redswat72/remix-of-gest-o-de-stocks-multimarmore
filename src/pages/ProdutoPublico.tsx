import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProdutoByIdmm } from '@/hooks/useProdutoByIdmm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Página pública para acesso via QR Code
 * 
 * Comportamento:
 * - Se não autenticado: redireciona para login com returnUrl
 * - Se autenticado: redireciona para ficha completa do produto
 */
export default function ProdutoPublico() {
  const { idmm } = useParams<{ idmm: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { data: produto, isLoading: produtoLoading, error } = useProdutoByIdmm(idmm);

  useEffect(() => {
    // Aguardar carregamento de auth e produto
    if (authLoading || produtoLoading) return;

    // Se não autenticado, redirecionar para login
    if (!user) {
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
      return;
    }

    // Se autenticado e produto existe, redirecionar para ficha completa
    if (produto) {
      navigate(`/produto/${produto.id}`, { replace: true });
    }
  }, [user, authLoading, produto, produtoLoading, navigate, location]);

  // Loading
  if (authLoading || produtoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-center">
            A carregar produto...
          </p>
          {idmm && (
            <p className="text-sm font-mono text-muted-foreground">
              {decodeURIComponent(idmm)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Erro ou produto não encontrado
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
              <Button onClick={() => navigate('/stock')}>
                Ver Stock
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Ir para Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback - nunca deve chegar aqui
  return null;
}
