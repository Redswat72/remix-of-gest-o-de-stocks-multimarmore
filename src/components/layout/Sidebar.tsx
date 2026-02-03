import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  History, 
  PlusCircle, 
  Users, 
  MapPin, 
  Settings,
  Boxes,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import logoMultimarmore from '@/assets/logo-multimarmore.png';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  superadminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/stock', label: 'Consultar Stock', icon: Package },
  { href: '/movimento/novo', label: 'Registar Movimento', icon: PlusCircle },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/produtos', label: 'Produtos', icon: Boxes, adminOnly: true },
  { href: '/clientes', label: 'Clientes', icon: Users, adminOnly: true },
  { href: '/superadmin', label: 'Superadmin', icon: MapPin, superadminOnly: true },
  { href: '/importar-stock', label: 'Importar Excel', icon: FileSpreadsheet, superadminOnly: true },
  { href: '/auditoria', label: 'Auditoria', icon: ClipboardList, superadminOnly: true },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { profile, isAdmin, isSuperadmin, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter((item) => {
    if (item.superadminOnly && !isSuperadmin) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header com Logo */}
      <div className="flex items-center justify-between h-16 px-3 border-b border-border">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={logoMultimarmore} 
              alt="Multimármore" 
              className="h-10 w-auto object-contain"
            />
          </Link>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">MM</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-8 w-8 shrink-0", collapsed && "absolute right-[-12px] bg-card border shadow-sm")}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary-foreground")} />
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info & Logout */}
      <div className="border-t border-border p-3">
        {!collapsed && profile && (
          <div className="mb-3 px-2">
            <p className="font-medium text-sm truncate text-foreground">{profile.nome}</p>
            <p className="text-xs text-muted-foreground truncate">
              {profile.email}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={signOut}
          className={cn(
            'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            !collapsed && 'w-full justify-start'
          )}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
