import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocaisInfo, FILTRO_TODOS, FILTRO_PRESTADORES } from '@/lib/locais';
import { useAppT } from '@/hooks/useAppT';

/** Filtro por parque com grupo de prestadores de serviços. */
export function ParqueFiltroSelect({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const { parques, prestadores } = useLocaisInfo();
  const t = useAppT();
  return (
    <Select value={value || FILTRO_TODOS} onValueChange={onChange}>
      <SelectTrigger className={className ?? 'w-full sm:w-[220px]'}>
        <SelectValue placeholder={t('inventory.filterByYard')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={FILTRO_TODOS}>{t('inventory.allYards')}</SelectItem>
        <SelectGroup>
          <SelectLabel>{t('prestadores.grupoParques')}</SelectLabel>
          {parques.map(l => (
            <SelectItem key={l.id} value={l.codigo}>{l.codigo} — {l.nome}</SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>{t('prestadores.grupoPrestadores')}</SelectLabel>
          <SelectItem value={FILTRO_PRESTADORES}>{t('prestadores.emPrestadores')}</SelectItem>
          {prestadores.map(l => (
            <SelectItem key={l.id} value={l.codigo}>{l.nome}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default ParqueFiltroSelect;
