import { useState, useCallback, useEffect } from 'react';
import type { CompanySlug, StoreProduct } from '@/types/store';

interface CartItem {
  productId: string;
  addedAt: number;
}

function getCartKey(company: CompanySlug) {
  return `store-cart-${company}`;
}

function loadCart(company: CompanySlug): CartItem[] {
  try {
    const raw = localStorage.getItem(getCartKey(company));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(company: CompanySlug, cart: CartItem[]) {
  localStorage.setItem(getCartKey(company), JSON.stringify(cart));
}

export function useStoreCart(company: CompanySlug) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart(company));

  useEffect(() => {
    setItems(loadCart(company));
  }, [company]);

  useEffect(() => {
    saveCart(company, items);
  }, [items, company]);

  const addToCart = useCallback((productId: string) => {
    setItems(prev => {
      if (prev.some(i => i.productId === productId)) return prev;
      return [...prev, { productId, addedAt: Date.now() }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const isInCart = useCallback((productId: string) => {
    return items.some(i => i.productId === productId);
  }, [items]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getCartProducts = useCallback((allProducts: StoreProduct[]) => {
    const productMap = new Map(allProducts.map(p => [p.id, p]));
    return items
      .map(i => productMap.get(i.productId))
      .filter((p): p is StoreProduct => !!p);
  }, [items]);

  return {
    items,
    count: items.length,
    addToCart,
    removeFromCart,
    isInCart,
    clearCart,
    getCartProducts,
  };
}

export function buildWhatsAppQuoteUrl(
  whatsappNumber: string,
  companyName: string,
  products: StoreProduct[],
) {
  const lines = products.map((p, i) => {
    const details: string[] = [];
    if (p.dimensoes) details.push(p.dimensoes);
    if (p.quantidade != null && p.unidade) details.push(`${p.quantidade} ${p.unidade}`);
    if (p.acabamento) details.push(p.acabamento);
    const suffix = details.length > 0 ? ` — ${details.join(', ')}` : '';
    return `${i + 1}. *${p.name}* (${p.internal_id})${suffix}`;
  });

  const message = `*Pedido de Cotação — ${companyName}*

Gostaria de solicitar cotação para os seguintes produtos:

${lines.join('\n')}

Total: ${products.length} produto(s)

Aguardo a vossa resposta. Obrigado!`;

  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
