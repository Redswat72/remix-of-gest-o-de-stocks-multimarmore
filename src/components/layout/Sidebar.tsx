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
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

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
        'hidden lg:flex flex-col h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Multimármore</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
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
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info & Logout */}
      <div className="border-t border-sidebar-border p-4">
        {!collapsed && profile && (
          <div className="mb-3">
            <p className="font-medium text-sm truncate">{profile.nome}</p>
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
            'text-muted-foreground hover:text-destructive',
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
