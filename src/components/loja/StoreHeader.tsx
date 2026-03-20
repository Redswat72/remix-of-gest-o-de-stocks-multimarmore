import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StoreConfig } from '@/types/store';
import { STORE_TYPE_LABELS, STORE_PRODUCT_TYPE_KEYS } from '@/types/store';
import logoMultimarmoreWide from '@/assets/logo-multimarmore-wide.png';
import logoMagratex from '@/assets/logo-magratex.png';

interface StoreHeaderProps {
  config: StoreConfig;
  cartCount: number;
  onCartClick: () => void;
}

const logos: Record<string, string> = {
  multimarmore: logoMultimarmoreWide,
  magratex: logoMagratex,
};

export function StoreHeader({ config, cartCount, onCartClick }: StoreHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToCatalog = () => {
    setMobileOpen(false);
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-xl border-b ${
        scrolled
          ? 'shadow-[0_8px_40px_rgba(0,0,0,0.45)] border-[rgba(30,87,153,0.15)]'
          : 'border-transparent'
      }`}
      style={{ backgroundColor: 'rgba(26, 29, 33, 0.95)', height: 80 }}
    >
      <div className="container flex h-20 items-center justify-between">
        {/* Logo */}
        <Link to={`/loja/${config.slug}`} className="flex items-center">
          <div className="bg-white rounded-2xl px-5 py-2 flex items-center justify-center">
            <img
              src={logos[config.slug] ?? logoMultimarmoreWide}
              alt={config.displayName}
              className="h-10 w-auto object-contain max-w-[240px]"
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={scrollToCatalog}
            className="text-sm font-medium text-[#F7F5F2] hover:text-[#1E5799] transition-colors"
          >
            Catálogo
          </button>
          <a
            href={`mailto:${config.email}`}
            className="text-sm font-medium text-[#F7F5F2] hover:text-[#1E5799] transition-colors"
          >
            Contacto
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCartClick}
            className="relative text-[#1E5799] hover:bg-[rgba(255,255,255,0.08)] rounded-full w-11 h-11"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-[#1A1D21]"
                style={{ background: 'linear-gradient(135deg, #F7941D, #FFA940)' }}
              >
                {cartCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-[#1E5799] hover:bg-[rgba(255,255,255,0.08)] rounded-lg"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[rgba(255,255,255,0.08)] animate-in fade-in slide-in-from-top-2 duration-200" style={{ backgroundColor: 'rgba(26, 29, 33, 0.98)' }}>
          <div className="container py-4 space-y-2">
            <button
              onClick={scrollToCatalog}
              className="block w-full text-left px-4 py-3 rounded-lg text-[#F7F5F2] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            >
              Catálogo
            </button>
            {STORE_PRODUCT_TYPE_KEYS.map(type => (
              <button
                key={type}
                onClick={() => { scrollToCatalog(); setMobileOpen(false); }}
                className="block w-full text-left px-8 py-2 text-sm text-[#A8ADB5] hover:text-[#1E5799] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
              >
                {STORE_TYPE_LABELS[type]}
              </button>
            ))}
            <div className="h-px bg-[rgba(30,87,153,0.2)] my-3" />
            <a
              href={`mailto:${config.email}`}
              className="block px-4 py-3 rounded-lg text-[#F7F5F2] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            >
              Contacto
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
