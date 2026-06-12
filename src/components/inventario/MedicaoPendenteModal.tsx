import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Ruler } from 'lucide-react';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAppT } from '@/hooks/useAppT';

interface MedicaoPendenteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocoId: string;
  idMm: string;
}

export default function MedicaoPendenteModal({ open, onOpenChange, blocoId, idMm }: MedicaoPendenteModalProps) {
  const t = useAppT();
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  const [comprimento, setComprimento] = useState('');
  const [largura, setLargura] = useState('');
  const [altura, setAltura] = useState('');
  const [quantidadeKg, setQuantidadeKg] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, unknown> = {
        medicao_pendente: false,
        comprimento: comprimento ? Number(comprimento) : null,
        largura: largura ? Number(largura) : null,
        altura: altura ? Number(altura) : null,
        quantidade_kg: quantidadeKg ? Number(quantidadeKg) : null,
      };
      const { error } = await supabase.from('blocos').update(updates).eq('id', blocoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocos'] });
      queryClient.invalidateQueries({ queryKey: ['stock-unificado'] });
      toast.success(t('inventory.measurement.successMsg'));
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(t('toasts.errorTitle') + ': ' + err.message);
    },
  });

  const canSave = comprimento || largura || altura || quantidadeKg;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            {t('inventory.measurement.title')} — {idMm}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('inventory.measurement.desc')}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('inventory.measurement.length')}</Label>
              <Input type="number" min={0} value={comprimento} onChange={e => setComprimento(e.target.value)} placeholder="cm" />
            </div>
            <div className="space-y-1">
              <Label>{t('inventory.measurement.width')}</Label>
              <Input type="number" min={0} value={largura} onChange={e => setLargura(e.target.value)} placeholder="cm" />
            </div>
            <div className="space-y-1">
              <Label>{t('inventory.measurement.height')}</Label>
              <Input type="number" min={0} value={altura} onChange={e => setAltura(e.target.value)} placeholder="cm" />
            </div>
            <div className="space-y-1">
              <Label>{t('inventory.measurement.weight')}</Label>
              <Input type="number" min={0} step="0.01" value={quantidadeKg} onChange={e => setQuantidadeKg(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('actions.cancel')}</Button>
            <Button onClick={() => mutation.mutate()} disabled={!canSave || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('inventory.measurement.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
