import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Grid3x3,
  Square,
  Layers,
  Boxes,
  History, 
  PlusCircle, 
  User,
  Scissors,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const inventarioItems = [
  { href: '/blocos', label: 'Blocos', icon: Package },
  { href: '/chapas', label: 'Chapas', icon: Grid3x3 },
  { href: '/ladrilho', label: 'Ladrilho', icon: Square },
  { href: '/bandas', label: 'Bandas', icon: Layers },
  { href: '/producao', label: 'Produção', icon: Scissors },
  { href: '/stock', label: 'Consultar Stock', icon: Boxes },
];

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { type: 'inventario' as const, label: 'Inventário', icon: Package },
  { href: '/movimento/novo', label: 'Novo', icon: PlusCircle, primary: true },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/perfil', label: 'Perfil', icon: User },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [inventarioOpen, setInventarioOpen] = useState(false);

  const inventarioActive = inventarioItems.some(i => location.pathname === i.href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;

          if ('type' in item && item.type === 'inventario') {
            return (
              <Sheet key="inventario" open={inventarioOpen} onOpenChange={setInventarioOpen}>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 px-3 py-2 touch-target transition-colors',
                      inventarioActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', inventarioActive && 'text-primary')} />
                    <span className={cn('text-xs font-medium', inventarioActive && 'text-primary')}>{item.label}</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle>Inventário</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-2 gap-3 mt-4 pb-6">
                    {inventarioItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isActive = location.pathname === sub.href;
                      return (
                        <button
                          key={sub.href}
                          onClick={() => {
                            setInventarioOpen(false);
                            navigate(sub.href);
                          }}
                          className={cn(
                            'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-colors touch-target',
                            isActive
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/40 border-border hover:bg-muted'
                          )}
                        >
                          <SubIcon className="w-6 h-6" />
                          <span className="text-sm font-medium">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            );
          }

          const isActive = location.pathname === item.href;
          const isPrimary = 'primary' in item && item.primary;

          if (isPrimary) {
            return (
              <Link
                key={item.href}
                to={item.href!}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 touch-target">
                  <Icon className="w-6 h-6" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href!}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 touch-target transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className={cn("text-xs font-medium", isActive && "text-primary")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
