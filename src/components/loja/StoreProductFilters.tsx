import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StoreFilters } from '@/types/store';
import { STORE_PRODUCT_TYPE_KEYS, DEFAULT_STORE_FILTERS } from '@/types/store';

interface StoreProductFiltersProps {
  filters: StoreFilters;
  onFiltersChange: (f: StoreFilters) => void;
  uniqueStones: string[];
}

export function StoreProductFilters({ filters, onFiltersChange, uniqueStones }: StoreProductFiltersProps) {
  const { t } = useTranslation();

  const update = <K extends keyof StoreFilters>(key: K, value: StoreFilters[K]) =>
    onFiltersChange({ ...filters, [key]: value });

  const toggleType = (type: string) => {
    const current = filters.types;
    const next = current.includes(type as any)
      ? current.filter(t => t !== type)
      : [...current, type as any];
    update('types', next);
  };

  const clearFilters = () => onFiltersChange(DEFAULT_STORE_FILTERS);

  const hasActive =
    filters.search || filters.types.length > 0 || filters.stone ||
    filters.lengthRange[0] !== 0 || filters.lengthRange[1] !== 500 ||
    filters.widthRange[0] !== 0 || filters.widthRange[1] !== 300 ||
    filters.heightRange[0] !== 0 || filters.heightRange[1] !== 300;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#F5F2ED]">{t('filters.search')}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8ADB5]" />
          <Input
            placeholder={t('filters.searchPlaceholder')}
            value={filters.search}
            onChange={e => update('search', e.target.value)}
            className="pl-10 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)] text-[#F7F5F2] placeholder:text-[rgba(168,173,181,0.5)] focus:border-[#1E5799]"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#F5F2ED]">{t('filters.type')}</Label>
        <div className="space-y-2">
          {STORE_PRODUCT_TYPE_KEYS.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`stype-${type}`}
                checked={filters.types.includes(type)}
                onCheckedChange={() => toggleType(type)}
              />
              <Label htmlFor={`stype-${type}`} className="text-sm cursor-pointer text-[#C9C3BA]">
                {t(`productTypes.${type}`)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#F5F2ED]">{t('filters.stone')}</Label>
        <Select
          value={filters.stone || 'all'}
          onValueChange={v => update('stone', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)] text-[#F7F5F2]">
            <SelectValue placeholder={t('filters.allStones')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStones')}</SelectItem>
            {uniqueStones.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {[
        { label: t('filters.length'), key: 'lengthRange' as const, max: 500 },
        { label: t('filters.width'), key: 'widthRange' as const, max: 300 },
        { label: t('filters.height'), key: 'heightRange' as const, max: 300 },
      ].map(({ label, key, max }) => (
        <div key={key} className="space-y-3">
          <div className="flex justify-between">
            <Label className="text-sm font-medium text-[#F5F2ED]">{label} (cm)</Label>
            <span className="text-xs text-[#A8ADB5]">{filters[key][0]} - {filters[key][1]}</span>
          </div>
          <Slider
            value={filters[key]}
            min={0}
            max={max}
            step={10}
            onValueChange={v => update(key, v as [number, number])}
          />
        </div>
      ))}

      {hasActive && (
        <Button variant="outline" onClick={clearFilters} className="w-full gap-2 border-[rgba(255,255,255,0.12)] text-[#C9C3BA] hover:bg-[rgba(255,255,255,0.06)]">
          <X className="h-4 w-4" />
          {t('filters.clearFilters')}
        </Button>
      )}
    </div>
  );
}
