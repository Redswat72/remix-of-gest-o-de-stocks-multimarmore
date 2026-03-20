import { ShoppingCart, Trash2, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { StoreProduct, StoreConfig } from '@/types/store';
import { buildWhatsAppQuoteUrl } from '@/hooks/useStoreCart';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  products: StoreProduct[];
  config: StoreConfig;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function StoreCartSheet({ open, onOpenChange, products, config, onRemove, onClear }: Props) {
  const handleQuote = () => {
    if (products.length === 0) return;
    const url = buildWhatsAppQuoteUrl(config.whatsapp, config.displayName, products);
    window.open(url, '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[420px] overflow-y-auto flex flex-col"
        style={{ backgroundColor: '#1A1D21', borderColor: 'rgba(30,87,153,0.15)' }}
      >
        <SheetHeader>
          <SheetTitle className="text-[#F5F2ED] flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#1E5799]" />
            Carrinho ({products.length})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 mt-4 space-y-3">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-[#A8ADB5] mb-4" />
              <p className="text-[#A8ADB5]">O seu carrinho está vazio</p>
              <p className="text-sm text-[rgba(168,173,181,0.6)] mt-1">
                Adicione produtos para pedir cotação
              </p>
            </div>
          ) : (
            products.map(p => (
              <div key={p.id} className="flex gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <img src={p.images[0]} alt={p.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-[#F5F2ED] line-clamp-1">{p.name}</h4>
                  <p className="text-xs font-mono text-[#A8ADB5] mt-0.5">{p.internal_id}</p>
                  {p.length && p.width && p.height && (
                    <p className="text-xs text-[#C9C3BA] mt-1">{p.length}×{p.width}×{p.height} cm</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0 text-[#A8ADB5] hover:text-red-400 h-8 w-8"
                  onClick={() => onRemove(p.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {products.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)] space-y-3">
            <Button className="w-full gap-2 font-semibold py-6 text-base" style={{ background: 'linear-gradient(135deg, #F7941D, #FFA940)', color: '#1A1D21' }}
              onClick={handleQuote}
            >
              <FileText className="h-5 w-5" />
              Pedir Cotação via WhatsApp
            </Button>
            <Button variant="ghost" onClick={onClear} className="w-full gap-2 text-[#A8ADB5] hover:text-red-400">
              <Trash2 className="h-4 w-4" />
              Limpar carrinho
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
