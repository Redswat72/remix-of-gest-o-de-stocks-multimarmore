import { Badge } from '@/components/ui/badge';
import { useLocaisInfo } from '@/lib/locais';
import { useAppT } from '@/hooks/useAppT';

/** Mostra o parque; se o material estiver num prestador, assinala-o com cor distinta. */
export function ParqueBadge({ parque }: { parque: string | null | undefined }) {
  const { isPrestador, nome } = useLocaisInfo();
  const t = useAppT();
  if (parque && isPrestador(parque)) {
    return (
      <Badge variant="outline" className="badge-prestador whitespace-nowrap" title={parque}>
        {t('prestadores.noPrestador', { nome: nome(parque) })}
      </Badge>
    );
  }
  return <Badge variant="outline">{parque || '—'}</Badge>;
}

export default ParqueBadge;
