import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info } from 'lucide-react';
import type { IdMmExistente, TipoIdMm } from '@/lib/idMmExistente';

const NOME: Record<TipoIdMm, string> = { bloco: 'bloco', chapa: 'chapa', ladrilho: 'ladrilho' };

interface Props {
  open: boolean;
  idMm: string;
  tipoNovo: TipoIdMm;
  parqueNovo?: string;
  existentes: IdMmExistente[];
  onOutraNumeracao: () => void;
  onContinuar: () => void;
  onCancelar: () => void;
}

export function IdMmDuplicadoDialog({ open, idMm, tipoNovo, parqueNovo, existentes, onOutraNumeracao, onContinuar, onCancelar }: Props) {
  const forte = existentes.some(e => e.tipo === tipoNovo && (!parqueNovo || e.parque === parqueNovo));
  const principal = existentes.find(e => e.tipo === tipoNovo && (!parqueNovo || e.parque === parqueNovo)) ?? existentes[0];

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onCancelar(); }}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {forte ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Info className="h-5 w-5 text-primary" />}
            {forte ? 'Número já usado — provável engano' : 'Número já existe noutro artigo'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {principal && (forte
              ? `Já existe um ${NOME[principal.tipo]} ${idMm} no parque ${principal.parque}.`
              : `Existe um ${NOME[principal.tipo]} ${idMm} em ${principal.parque}; está a registar um(a) ${NOME[tipoNovo]} ${idMm}.`)}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {existentes.map(e => (
            <div key={`${e.tipo}-${e.id}`} className="rounded-md border p-2 text-sm space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{NOME[e.tipo]}</Badge>
                <span className="font-mono font-medium">{e.id_mm}</span>
                <Badge variant="outline">{e.parque}</Badge>
                <Badge variant={e.ativo ? 'secondary' : 'outline'}>
                  {e.ativo ? 'Em stock' : 'sem stock — consumido/vendido'}
                </Badge>
              </div>
              <div className="text-muted-foreground">
                {[e.variedade, e.dimensoes, e.quantidade].filter(Boolean).join(' · ')}
              </div>
            </div>
          ))}
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button onClick={onOutraNumeracao}>É o mesmo artigo — vou usar outra numeração</Button>
          <Button variant={forte ? 'destructive' : 'outline'} onClick={onContinuar}>
            É um artigo diferente com o mesmo número
          </Button>
          <Button variant="ghost" onClick={onCancelar}>Cancelar</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
