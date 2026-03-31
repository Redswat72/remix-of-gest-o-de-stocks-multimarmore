import { useMemo } from 'react';
import { Grid3X3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StoreProduct } from '@/types/store';
import { StoreProductCard } from './StoreProductCard';
import { StoreProductCardSkeleton } from './StoreProductCardSkeleton';

interface StoreProductGridProps {
  products: StoreProduct[];
  isLoading?: boolean;
  isInCart: (id: string) => boolean;
  onProductClick?: (p: StoreProduct) => void;
  onAddToCart?: (p: StoreProduct) => void;
  onRequestQuote?: (p: StoreProduct) => void;
  isSuperadmin?: boolean;
}

export function StoreProductGrid({ products, isLoading, isInCart, onProductClick, onAddToCart, onRequestQuote, isSuperadmin }: StoreProductGridProps) {
  const { t } = useTranslation();

  const grouped = useMemo(() => {
    const map = new Map<string, StoreProduct[]>();
    for (const p of products) {
      const key = p.variety || t('grid.otherVariety', 'Outros');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    // Sort groups alphabetically, "Outros" last
    const other = t('grid.otherVariety', 'Outros');
    return [...map.entries()].sort((a, b) => {
      if (a[0] === other) return 1;
      if (b[0] === other) return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [products, t]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
        {Array.from({ length: 9 }).map((_, i) => <StoreProductCardSkeleton key={i} />)}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 rounded-2xl bg-[rgba(30,87,153,0.1)] flex items-center justify-center mb-6">
          <Grid3X3 className="h-12 w-12 text-[#1E5799]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#F5F2ED] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {t('grid.noProducts')}
        </h2>
        <p className="text-[#A8ADB5] max-w-md">
          {t('grid.noProductsHint')}
        </p>
      </div>
    );
  }

  let globalIndex = 0;

  return (
    <div className="space-y-12">
      {grouped.map(([variety, items]) => (
        <section key={variety}>
          <div className="flex items-center gap-4 mb-6">
            <h3
              className="text-2xl font-semibold text-[#F5F2ED] whitespace-nowrap"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {variety}
            </h3>
            <div className="h-px flex-1 bg-[rgba(255,255,255,0.1)]" />
            <span className="text-sm text-[#A8ADB5] whitespace-nowrap">
              {items.length} {items.length === 1 ? t('grid.product', 'produto') : t('grid.products', 'produtos')}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {items.map((product) => {
              const idx = globalIndex++;
              return (
                <StoreProductCard
                  key={product.id}
                  product={product}
                  index={idx}
                  inCart={isInCart(product.id)}
                  onClick={onProductClick}
                  onAddToCart={onAddToCart}
                  onRequestQuote={onRequestQuote}
                  isSuperadmin={isSuperadmin}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
