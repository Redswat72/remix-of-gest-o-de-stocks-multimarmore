import { useState } from 'react';
import { ShoppingCart, Ruler, Box, Scale, ChevronLeft, ChevronRight, FileText, ZoomIn, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import type { StoreProduct } from '@/types/store';
import { STORE_TYPE_LABELS } from '@/types/store';
import { StoreLightbox } from './StoreLightbox';

interface Props {
  product: StoreProduct | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  inCart?: boolean;
  onAddToCart?: (p: StoreProduct) => void;
  onRequestQuote?: (p: StoreProduct) => void;
}

export function StoreProductDetail({ product, open, onOpenChange, inCart, onAddToCart, onRequestQuote }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!product) return null;

  const images = product.images.length > 0 ? product.images : ['/placeholder.svg'];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1E2127', borderColor: 'rgba(255,255,255,0.08)' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#F5F2ED]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {product.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-5 gap-6">
            {/* Gallery */}
            <div className="md:col-span-3 space-y-3">
              <div className="relative group cursor-pointer" onClick={() => setLightbox(true)}>
                <AspectRatio ratio={4 / 3}>
                  <img src={images[imgIdx]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                  <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.3)] opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                    <div className="flex items-center gap-2 text-white bg-[rgba(0,0,0,0.6)] px-4 py-2 rounded-full">
                      <ZoomIn className="h-5 w-5" />
                      <span className="text-sm font-medium">Ver em HD</span>
                    </div>
                  </div>
                </AspectRatio>
                {images.length > 1 && (
                  <>
                    <Button variant="secondary" size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[rgba(26,23,20,0.9)] text-[#C9C3BA] border border-[rgba(255,255,255,0.1)]"
                      onClick={e => { e.stopPropagation(); setImgIdx((imgIdx - 1 + images.length) % images.length); }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[rgba(26,23,20,0.9)] text-[#C9C3BA] border border-[rgba(255,255,255,0.1)]"
                      onClick={e => { e.stopPropagation(); setImgIdx((imgIdx + 1) % images.length); }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => setImgIdx(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                        idx === imgIdx ? 'border-[#1E5799]' : 'border-transparent hover:border-[rgba(30,87,153,0.5)]'
                      }`}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-[rgba(30,87,153,0.15)] text-[#1E5799] border-[rgba(30,87,153,0.3)]">
                  {STORE_TYPE_LABELS[product.type]}
                </Badge>
                <span className="text-sm font-mono text-[#C9C3BA]">{product.internal_id}</span>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {product.length && product.width && product.height && (
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 text-[#C9C3BA] mb-1">
                      <Ruler className="h-4 w-4 text-[#1E5799]" />
                      <span className="text-xs uppercase">Dimensões</span>
                    </div>
                    <p className="font-medium text-[#F5F2ED]">{product.length} × {product.width} × {product.height} cm</p>
                  </div>
                )}
                {product.volume != null && product.volume > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-[#C9C3BA] mb-1">
                      <Box className="h-4 w-4 text-[#1E5799]" />
                      <span className="text-xs uppercase">Volume</span>
                    </div>
                    <p className="font-medium text-[#F5F2ED]">{product.volume} m³</p>
                  </div>
                )}
                {product.weight != null && product.weight > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-[#C9C3BA] mb-1">
                      <Scale className="h-4 w-4 text-[#1E5799]" />
                      <span className="text-xs uppercase">Peso</span>
                    </div>
                    <p className="font-medium text-[#F5F2ED]">{product.weight} kg</p>
                  </div>
                )}
              </div>

              {product.observations && (
                <div>
                  <h4 className="text-sm font-medium text-[#C9C3BA] mb-2">Observações</h4>
                  <p className="text-sm text-[#F5F2ED]">{product.observations}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <Button size="lg" className="w-full gap-2 font-semibold" style={{ background: 'linear-gradient(135deg, #F7941D, #FFA940)', color: '#1A1D21' }}
                  onClick={() => { onRequestQuote?.(product); onOpenChange(false); }}
                >
                  <FileText className="h-5 w-5" /> Pedir Cotação
                </Button>
                <Button size="lg" variant="outline"
                  className={`w-full gap-2 font-semibold ${
                    inCart
                      ? 'bg-[rgba(57,181,74,0.15)] border-[#39B54A] text-[#39B54A]'
                      : 'border-[#1E5799] text-[#1E5799] hover:bg-[rgba(30,87,153,0.15)]'
                  }`}
                  onClick={() => { onAddToCart?.(product); }}
                >
                  {inCart ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
                  {inCart ? 'No Carrinho' : 'Adicionar ao Carrinho'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <StoreLightbox
        images={images}
        currentIndex={imgIdx}
        isOpen={lightbox}
        onClose={() => setLightbox(false)}
        onIndexChange={setImgIdx}
        productName={product.name}
      />
    </>
  );
}
