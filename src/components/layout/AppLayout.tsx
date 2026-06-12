import { ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { UpdateBanner } from '@/components/pwa/UpdateBanner';
import { applyAppLanguage } from '@/lib/appLanguage';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Restaura o idioma da app interna ao montar (independente da loja pública).
  useEffect(() => {
    applyAppLanguage();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop only */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Update banner (only when new version detected) */}
        <UpdateBanner />

        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-6">
          <div className="container mx-auto px-4 py-6 lg:px-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile navigation */}
      <MobileNav />
    </div>
  );
}
