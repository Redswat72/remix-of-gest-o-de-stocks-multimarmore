import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Ruler } from 'lucide-react';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface MedicaoPendenteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocoId: string;
  idMm: string;
}

export default function MedicaoPendenteModal({ open, onOpenChange, blocoId, idMm }: MedicaoPendenteModalProps) {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();

  const [comprimento, setComprimento] = useState('');
  const [largura, setLargura] = useState('');
  const [altura, setAltura] = useState('');
  const [quantidadeTons, setQuantidadeTons] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, unknown> = {
        medicao_pendente: false,
        comprimento: comprimento ? Number(comprimento) : null,
        largura: largura ? Number(largura) : null,
        altura: altura ? Number(altura) : null,
        quantidade_tons: quantidadeTons ? Number(quantidadeTons) : 0,
      };

      const { error } = await supabase
        .from('blocos')
        .update(updates)
        .eq('id', blocoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocos'] });
      queryClient.invalidateQueries({ queryKey: ['stock-unificado'] });
      toast.success('Medição atualizada com sucesso');
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error('Erro: ' + err.message);
    },
  });

  const canSave = comprimento || largura || altura || quantidadeTons;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Atualizar Medição — {idMm}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este bloco teve um corte parcial e aguarda novas medidas.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Comprimento</Label>
              <Input type="number" min={0} value={comprimento} onChange={e => setComprimento(e.target.value)} placeholder="cm" />
            </div>
            <div className="space-y-1">
              <Label>Largura</Label>
              <Input type="number" min={0} value={largura} onChange={e => setLargura(e.target.value)} placeholder="cm" />
            </div>
            <div className="space-y-1">
              <Label>Altura</Label>
              <Input type="number" min={0} value={altura} onChange={e => setAltura(e.target.value)} placeholder="cm" />
            </div>
            <div className="space-y-1">
              <Label>Toneladas</Label>
              <Input type="number" min={0} step="0.01" value={quantidadeTons} onChange={e => setQuantidadeTons(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => mutation.mutate()} disabled={!canSave || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar Medição
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
