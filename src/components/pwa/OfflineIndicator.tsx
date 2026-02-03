import { WifiOff } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-destructive text-destructive-foreground',
        'px-4 py-2 text-center text-sm font-medium',
        'flex items-center justify-center gap-2',
        'animate-in slide-in-from-top duration-300'
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>Modo offline - Algumas funcionalidades podem estar indisponíveis</span>
    </div>
  );
}
