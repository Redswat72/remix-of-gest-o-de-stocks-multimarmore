import { useState } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

export function UpdateBanner() {
  const { needRefresh, updateApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!needRefresh || dismissed) return null;

  const handleUpdate = async () => {
    setUpdating(true);
    await updateApp();
  };

  return (
    <div
      className={cn(
        'sticky top-0 z-50 w-full border-b border-primary/30',
        'bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15',
        'backdrop-blur supports-[backdrop-filter]:bg-primary/10'
      )}
      role="status"
      aria-live="polite"
    >
      <div className="container mx-auto px-4 py-2.5 flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            Nova versão disponível
          </p>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Atualize para receber as últimas melhorias e correções.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleUpdate}
          disabled={updating}
          className="shrink-0 h-8"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', updating && 'animate-spin')} />
          {updating ? 'A atualizar...' : 'Atualizar'}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setDismissed(true)}
          aria-label="Dispensar"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
