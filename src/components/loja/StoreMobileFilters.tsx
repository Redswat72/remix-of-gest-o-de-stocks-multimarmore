import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { StoreProductFilters } from './StoreProductFilters';
import type { StoreFilters } from '@/types/store';

interface Props {
  filters: StoreFilters;
  onFiltersChange: (f: StoreFilters) => void;
  uniqueStones: string[];
}

export function StoreMobileFilters({ filters, onFiltersChange, uniqueStones }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden border-[rgba(255,255,255,0.12)] text-[#C9C3BA] hover:bg-[rgba(255,255,255,0.06)]">
          <Filter className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto" style={{ backgroundColor: '#1A1D21', borderColor: 'rgba(30,87,153,0.15)' }}>
        <SheetHeader>
          <SheetTitle className="text-[#F5F2ED]">Filtros</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <StoreProductFilters filters={filters} onFiltersChange={onFiltersChange} uniqueStones={uniqueStones} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
