import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWA } from '@/hooks/usePWA';

export function UpdatePrompt() {
  const { needRefresh, updateApp } = usePWA();

  if (!needRefresh) return null;

  return (
    <Card className="fixed top-20 left-4 right-4 z-40 lg:left-auto lg:right-4 lg:w-80 shadow-lg border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">Atualização disponível</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Uma nova versão está pronta para ser instalada
            </p>
            <Button size="sm" className="mt-3" onClick={updateApp}>
              Atualizar agora
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
