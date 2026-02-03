import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  History, 
  PlusCircle, 
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/stock', label: 'Stock', icon: Package },
  { href: '/movimento/novo', label: 'Novo', icon: PlusCircle, primary: true },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/perfil', label: 'Perfil', icon: User },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          const isPrimary = item.primary;

          if (isPrimary) {
            return (
              <Link
                key={item.href}
                to={item.href}
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
              to={item.href}
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
