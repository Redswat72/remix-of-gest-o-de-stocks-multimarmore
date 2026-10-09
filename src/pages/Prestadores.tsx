import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Loader2, Check, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppT } from '@/hooks/useAppT';
import { useLocais, useCreateLocal, useUpdateLocal } from '@/hooks/useLocais';
import type { Local } from '@/types/database';

/** Diálogo partilhado para criar/editar prestadores. */
export function PrestadorDialog({
  open, onOpenChange, editing, onSaved,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing?: Local | null; onSaved?: (l: Local) => void }) {
  const t = useAppT();
  const { toast } = useToast();
  const createLocal = useCreateLocal();
  const updateLocal = useUpdateLocal();
  const [nome, setNome] = useState('');
  const [morada, setMorada] = useState('');
  const [lastKey, setLastKey] = useState<string | null>(null);

  const key = `${open}-${editing?.id ?? 'novo'}`;
  if (key !== lastKey) {
    setLastKey(key);
    setNome(editing?.nome ?? '');
    setMorada(editing?.morada ?? '');
  }

  const pending = createLocal.isPending || updateLocal.isPending;

  const handleSave = async () => {
    if (!nome.trim()) {
      toast({ title: t('toasts.errorTitle'), description: t('prestadores.nomeObrigatorio'), variant: 'destructive' });
      return;
    }
    try {
      if (editing) {
        const l = await updateLocal.mutateAsync({ id: editing.id, data: { nome: nome.trim(), morada: morada.trim(), tipo: 'prestador' } });
        toast({ title: t('prestadores.atualizado') });
        onSaved?.(l as Local);
      } else {
        const l = await createLocal.mutateAsync({ codigo: '', nome, morada, tipo: 'prestador' });
        toast({ title: t('prestadores.criado'), description: `${l.codigo} — ${l.nome}` });
        onSaved?.(l);
      }
      onOpenChange(false);
    } catch (error) {
      toast({ title: t('toasts.errorTitle'), description: error instanceof Error ? error.message : t('errors.unexpectedError'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t('prestadores.editar') : t('prestadores.novoTitulo')}</DialogTitle>
          {!editing && <DialogDescription>{t('prestadores.novoDesc')}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('prestadores.nome')} <span className="text-destructive">*</span></Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label>{t('prestadores.morada')}</Label>
            <Input value={morada} onChange={e => setMorada(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('actions.cancel')}</Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span className="ml-2">{t('actions.save')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Prestadores() {
  const t = useAppT();
  const { toast } = useToast();
  const { data: prestadores, isLoading } = useLocais({ tipo: 'prestador' });
  const updateLocal = useUpdateLocal();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Local | null>(null);

  const toggle = async (l: Local, ativo: boolean) => {
    try {
      await updateLocal.mutateAsync({ id: l.id, data: { ativo, tipo: 'prestador' } });
    } catch (error) {
      toast({ title: t('toasts.errorTitle'), description: error instanceof Error ? error.message : t('errors.unexpectedError'), variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>{t('prestadores.titulo')}</CardTitle>
          <CardDescription>{t('prestadores.subtitulo')}</CardDescription>
        </div>
        <Button className="gap-2" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4" />{t('prestadores.novo').replace('+ ', '')}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : prestadores && prestadores.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('superadmin.colCode')}</TableHead>
                <TableHead>{t('superadmin.colName')}</TableHead>
                <TableHead>{t('superadmin.colAddress')}</TableHead>
                <TableHead>{t('superadmin.colStatus')}</TableHead>
                <TableHead className="w-[80px]">{t('superadmin.colActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prestadores.map(l => (
                <TableRow key={l.id} className={!l.ativo ? 'opacity-50' : ''}>
                  <TableCell className="font-mono">{l.codigo}</TableCell>
                  <TableCell>{l.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{l.morada || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={l.ativo} onCheckedChange={c => toggle(l, c)} />
                      <span className="text-sm">{l.ativo ? t('superadmin.activeStatus') : t('superadmin.inactiveStatus')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(l); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('prestadores.vazio')}</p>
          </div>
        )}
      </CardContent>
      <PrestadorDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </Card>
  );
}
