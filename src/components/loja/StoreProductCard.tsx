import { Ruler, Box, Scale, FileText, ShoppingCart, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import type { StoreProduct } from '@/types/store';
import { STORE_TYPE_LABELS, STORE_STATUS_LABELS } from '@/types/store';

interface StoreProductCardProps {
  product: StoreProduct;
  index?: number;
  inCart?: boolean;
  onClick?: (p: StoreProduct) => void;
  onAddToCart?: (p: StoreProduct) => void;
  onRequestQuote?: (p: StoreProduct) => void;
}

export function StoreProductCard({ product, index = 0, inCart, onClick, onAddToCart, onRequestQuote }: StoreProductCardProps) {
  const imageUrl = product.images[0] ?? '/placeholder.svg';

  const statusClass =
    product.status === 'disponivel' ? 'bg-gradient-to-r from-[#39B54A] to-[#2E9F3E] text-white' :
    product.status === 'reservado' ? 'bg-gradient-to-r from-[#F7941D] to-[#E68A19] text-white' :
    'bg-gradient-to-r from-[#C62828] to-[#B71C1C] text-white';

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-0 transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.30)',
      }}
      onClick={() => onClick?.(product)}
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-t-[20px]">
        <AspectRatio ratio={1}>
          <img
            src={imageUrl}
            alt={product.name}
            loading={index < 6 ? 'eager' : 'lazy'}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        </AspectRatio>

        {/* Status badge */}
        <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${statusClass}`}>
          {STORE_STATUS_LABELS[product.status]}
        </span>

        {/* Type badge */}
        <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[rgba(30,87,153,0.15)] text-[#1E5799] border border-[rgba(30,87,153,0.3)]">
          {STORE_TYPE_LABELS[product.type]}
        </span>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Name */}
        <div>
          <h3 className="text-xl font-semibold line-clamp-1 text-[#F5F2ED] group-hover:text-[#1E5799] transition-colors duration-300" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {product.name}
          </h3>
          <p className="text-xs font-mono text-[#C9C3BA] mt-1.5 tracking-wider">
            ID: {product.internal_id}
          </p>
        </div>

        {/* Dimensions */}
        <div className="flex flex-wrap gap-3">
          {product.length && product.width && product.height && (
            <div className="flex items-center gap-2 text-[#C9C3BA]">
              <div className="w-7 h-7 rounded-lg bg-[rgba(30,87,153,0.15)] flex items-center justify-center">
                <Ruler className="h-3.5 w-3.5 text-[#1E5799]" />
              </div>
              <span className="text-xs font-medium">{product.length}×{product.width}×{product.height}</span>
            </div>
          )}
          {product.volume != null && product.volume > 0 && (
            <div className="flex items-center gap-2 text-[#C9C3BA]">
              <div className="w-7 h-7 rounded-lg bg-[rgba(30,87,153,0.15)] flex items-center justify-center">
                <Box className="h-3.5 w-3.5 text-[#1E5799]" />
              </div>
              <span className="text-xs font-medium">{product.volume} m³</span>
            </div>
          )}
          {product.weight != null && product.weight > 0 && (
            <div className="flex items-center gap-2 text-[#C9C3BA]">
              <div className="w-7 h-7 rounded-lg bg-[rgba(30,87,153,0.15)] flex items-center justify-center">
                <Scale className="h-3.5 w-3.5 text-[#1E5799]" />
              </div>
              <span className="text-xs font-medium">{product.weight} kg</span>
            </div>
          )}
        </div>

        <div className="h-px bg-[rgba(255,255,255,0.08)]" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); onRequestQuote?.(product); }}
            className="flex-1 font-semibold rounded-lg gap-2 px-4 py-2 text-sm"
            style={{ background: 'linear-gradient(135deg, #F7941D, #FFA940)', color: '#1A1D21' }}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Pedir Cotação</span>
            <span className="sm:hidden">Cotação</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
            className={`rounded-lg gap-2 px-3 py-2 text-sm transition-colors ${
              inCart
                ? 'bg-[rgba(57,181,74,0.15)] border-[#39B54A] text-[#39B54A]'
                : 'border-[#1E5799] text-[#1E5799] hover:bg-[rgba(30,87,153,0.15)]'
            }`}
            title={inCart ? 'No carrinho' : 'Adicionar ao carrinho'}
          >
            {inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
