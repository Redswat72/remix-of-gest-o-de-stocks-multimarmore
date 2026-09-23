import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PackageX } from 'lucide-react';
import type { ItemUnificado } from '@/hooks/useStockUnificado';
import { useEnumLabel } from '@/lib/enumLabels';
import { getAppLanguage } from '@/lib/appLanguage';

/** Mostra produtos inativos encontrados por número exato — para ninguém pensar que o número está livre. */
export function SemStockAviso({ items }: { items: ItemUnificado[] }) {
  const navigate = useNavigate();
  const enumLabel = useEnumLabel();
  if (!items.length) return null;
  const en = getAppLanguage?.() === 'en';
  const label = en ? 'out of stock — consumed/sold' : 'sem stock — consumido/vendido';

  return (
    <Card className="border-dashed">
      <CardContent className="py-3 space-y-2">
        {items.map(i => (
          <button
            key={`${i.forma}-${i.id}`}
            type="button"
            onClick={() => navigate(`/inventario/${i.forma}/${i.id}`)}
            className="flex w-full flex-wrap items-center gap-2 text-left text-sm hover:underline"
          >
            <PackageX className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono font-medium">{i.idMm}</span>
            <span className="text-muted-foreground">{enumLabel('tipoProduto', i.forma)}</span>
            <Badge variant="outline">{i.parque}</Badge>
            <Badge variant="secondary">{label}</Badge>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
