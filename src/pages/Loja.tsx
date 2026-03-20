import { useState, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { StoreLayout } from '@/components/loja/StoreLayout';
import { StoreHero } from '@/components/loja/StoreHero';
import { StoreProductGrid } from '@/components/loja/StoreProductGrid';
import { StoreProductFilters } from '@/components/loja/StoreProductFilters';
import { StoreMobileFilters } from '@/components/loja/StoreMobileFilters';
import { StoreProductDetail } from '@/components/loja/StoreProductDetail';
import { StoreCartSheet } from '@/components/loja/StoreCartSheet';
import { useStoreProducts, useUniqueStoneNames } from '@/hooks/useStoreProducts';
import { useStoreCart, buildWhatsAppQuoteUrl } from '@/hooks/useStoreCart';
import { getStoreConfig } from '@/lib/store-configs';
import type { StoreProduct, StoreFilters, CompanySlug } from '@/types/store';
import { DEFAULT_STORE_FILTERS } from '@/types/store';

export default function Loja() {
  const { empresa } = useParams<{ empresa: string }>();
  const config = getStoreConfig(empresa ?? '');

  if (!config) return <Navigate to="/selecionar-empresa" replace />;

  return <LojaContent company={config.slug} />;
}

function LojaContent({ company }: { company: CompanySlug }) {
  const config = getStoreConfig(company)!;
  const { data: products = [], isLoading } = useStoreProducts(company);
  const { data: uniqueStones = [] } = useUniqueStoneNames(company);
  const cart = useStoreCart(company);

  const [filters, setFilters] = useState<StoreFilters>(DEFAULT_STORE_FILTERS);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (filters.search) {
        const term = filters.search.toLowerCase();
        if (!p.name.toLowerCase().includes(term) && !p.internal_id.toLowerCase().includes(term)) return false;
      }
      if (filters.types.length > 0 && !filters.types.includes(p.type)) return false;
      if (filters.stone && !p.name.toLowerCase().includes(filters.stone.toLowerCase())) return false;
      if (p.length != null && (p.length < filters.lengthRange[0] || p.length > filters.lengthRange[1])) return false;
      if (p.width != null && (p.width < filters.widthRange[0] || p.width > filters.widthRange[1])) return false;
      if (p.height != null && (p.height < filters.heightRange[0] || p.height > filters.heightRange[1])) return false;
      return true;
    });
  }, [products, filters]);

  const handleAddToCart = (p: StoreProduct) => {
    if (cart.isInCart(p.id)) {
      cart.removeFromCart(p.id);
      toast.info(`${p.name} removido do carrinho`);
    } else {
      cart.addToCart(p.id);
      toast.success(`${p.name} adicionado ao carrinho`);
    }
  };

  const handleRequestQuote = (p: StoreProduct) => {
    const url = buildWhatsAppQuoteUrl(config.whatsapp, config.displayName, [p]);
    window.open(url, '_blank');
  };

  return (
    <StoreLayout config={config} cartCount={cart.count} onCartClick={() => setCartOpen(true)}>
      <StoreHero config={config} />

      <div id="catalog-section" className="py-16 relative" style={{ background: 'linear-gradient(180deg, #1A1D21 0%, #1E2127 50%, #1A1D21 100%)' }}>
        <div className="container">
          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-medium text-[#1E5799] uppercase tracking-wider mb-2">{config.tagline}</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#F5F2ED]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Catálogo
              </h2>
              <p className="text-[#C9C3BA] mt-2 max-w-lg">Explore a nossa coleção de pedra natural premium.</p>
            </div>
            <StoreMobileFilters filters={filters} onFiltersChange={setFilters} uniqueStones={uniqueStones} />
          </div>

          {/* Results count */}
          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
              <p className="text-sm text-[#C9C3BA]">{filtered.length} produto(s) encontrado(s)</p>
              <div className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
            </div>
          )}

          <div className="flex gap-10">
            {/* Sidebar */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-28 p-6 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1E5799] mb-6">Filtros</h3>
                <StoreProductFilters filters={filters} onFiltersChange={setFilters} uniqueStones={uniqueStones} />
              </div>
            </aside>

            {/* Grid */}
            <main className="flex-1 min-w-0">
              <StoreProductGrid
                products={filtered}
                isLoading={isLoading}
                isInCart={cart.isInCart}
                onProductClick={p => { setSelectedProduct(p); setDetailOpen(true); }}
                onAddToCart={handleAddToCart}
                onRequestQuote={handleRequestQuote}
              />
            </main>
          </div>
        </div>
      </div>

      <StoreProductDetail
        product={selectedProduct}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        inCart={selectedProduct ? cart.isInCart(selectedProduct.id) : false}
        onAddToCart={handleAddToCart}
        onRequestQuote={handleRequestQuote}
      />

      <StoreCartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        products={cart.getCartProducts(products)}
        config={config}
        onRemove={cart.removeFromCart}
        onClear={cart.clearCart}
      />
    </StoreLayout>
  );
}
