import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Upload, X, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { Bloco, Chapa, Ladrilho } from '@/types/inventario';

type FormaInventario = 'bloco' | 'chapa' | 'ladrilho';

interface PhotoSlot {
  label: string;
  field: string;
  currentUrl: string | null;
}

function getPhotoSlots(forma: FormaInventario, data: Bloco | Chapa | Ladrilho): PhotoSlot[] {
  if (forma === 'bloco') {
    const d = data as Bloco;
    return [
      { label: 'Foto 1', field: 'foto1_url', currentUrl: d.foto1_url },
      { label: 'Foto 2', field: 'foto2_url', currentUrl: d.foto2_url },
    ];
  }
  if (forma === 'chapa') {
    const d = data as Chapa;
    const slots: PhotoSlot[] = [];
    for (let i = 1; i <= 4; i++) {
      const nome = d[`parga${i}_nome` as keyof Chapa] as string | null;
      if (nome || i <= 2) {
        slots.push({
          label: `Parga ${i} - Primeira`,
          field: `parga${i}_foto_primeira`,
          currentUrl: d[`parga${i}_foto_primeira` as keyof Chapa] as string | null,
        });
        slots.push({
          label: `Parga ${i} - Última`,
          field: `parga${i}_foto_ultima`,
          currentUrl: d[`parga${i}_foto_ultima` as keyof Chapa] as string | null,
        });
      }
    }
    return slots;
  }
  // ladrilho
  const d = data as Ladrilho;
  return [
    { label: 'Foto Amostra', field: 'foto_amostra_url', currentUrl: d.foto_amostra_url },
  ];
}

function getEditableFields(forma: FormaInventario, data: Bloco | Chapa | Ladrilho): { label: string; field: string; value: string | number | null; type: 'text' | 'number' }[] {
  if (forma === 'bloco') {
    const d = data as Bloco;
    return [
      { label: 'Variedade', field: 'variedade', value: d.variedade, type: 'text' },
      { label: 'Parque', field: 'parque', value: d.parque, type: 'text' },
      { label: 'Origem', field: 'bloco_origem', value: d.bloco_origem, type: 'text' },
      { label: 'Fornecedor', field: 'fornecedor', value: d.fornecedor, type: 'text' },
      { label: 'Toneladas', field: 'quantidade_tons', value: d.quantidade_tons, type: 'number' },
      { label: 'Preço/ton', field: 'preco_unitario', value: d.preco_unitario, type: 'number' },
    ];
  }
  if (forma === 'chapa') {
    const d = data as Chapa;
    return [
      { label: 'Variedade', field: 'variedade', value: d.variedade, type: 'text' },
      { label: 'Parque', field: 'parque', value: d.parque, type: 'text' },
      { label: 'Bundle ID', field: 'bundle_id', value: d.bundle_id, type: 'text' },
      { label: 'Nº Chapas', field: 'num_chapas', value: d.num_chapas, type: 'number' },
      { label: 'Área (m²)', field: 'quantidade_m2', value: d.quantidade_m2, type: 'number' },
      { label: 'Preço/m²', field: 'preco_unitario', value: d.preco_unitario, type: 'number' },
    ];
  }
  const d = data as Ladrilho;
  return [
    { label: 'Variedade', field: 'variedade', value: d.variedade, type: 'text' },
    { label: 'Parque', field: 'parque', value: d.parque, type: 'text' },
    { label: 'Dimensões', field: 'dimensoes', value: d.dimensoes, type: 'text' },
    { label: 'Nº Peças', field: 'num_pecas', value: d.num_pecas, type: 'number' },
    { label: 'Área (m²)', field: 'quantidade_m2', value: d.quantidade_m2, type: 'number' },
    { label: 'Preço/m²', field: 'preco_unitario', value: d.preco_unitario, type: 'number' },
  ];
}

interface InventarioEditModalProps {
  forma: FormaInventario;
  data: Bloco | Chapa | Ladrilho;
  itemId: string;
}

export default function InventarioEditModal({ forma, data, itemId }: InventarioEditModalProps) {
  const [open, setOpen] = useState(false);
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();
  const { uploadImage, isUploading } = useImageUpload();

  const tableName = forma === 'bloco' ? 'blocos' : forma === 'chapa' ? 'chapas' : 'ladrilho';

  const editableFields = getEditableFields(forma, data);
  const photoSlots = getPhotoSlots(forma, data);

  const [fieldValues, setFieldValues] = useState<Record<string, string | number | null>>(() => {
    const vals: Record<string, string | number | null> = {};
    editableFields.forEach(f => { vals[f.field] = f.value; });
    return vals;
  });

  const [photoUrls, setPhotoUrls] = useState<Record<string, string | null>>(() => {
    const vals: Record<string, string | null> = {};
    photoSlots.forEach(s => { vals[s.field] = s.currentUrl; });
    return vals;
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-ficha', forma, itemId] });
      queryClient.invalidateQueries({ queryKey: ['stock-unificado'] });
      toast.success('Item atualizado com sucesso');
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error('Erro ao atualizar: ' + err.message);
    },
  });

  const handlePhotoUpload = async (field: string, file: File) => {
    const idRef = forma === 'bloco' ? (data as Bloco).id_mm : forma === 'chapa' ? (data as Chapa).id_mm : (data as Ladrilho).id_mm || itemId;
    
    const result = await uploadImage(file, {
      bucket: 'produtos',
      naming: { type: 'produto', idmm: `${forma}_${idRef}`, slot: 'F1' },
      imageMode: 'operacional',
    });

    if (result) {
      setPhotoUrls(prev => ({ ...prev, [field]: result.url }));
      toast.success('Foto carregada');
    }
  };

  const handleSave = () => {
    const updates: Record<string, unknown> = {};
    
    editableFields.forEach(f => {
      const newVal = fieldValues[f.field];
      if (f.type === 'number') {
        updates[f.field] = newVal != null && newVal !== '' ? Number(newVal) : null;
      } else {
        updates[f.field] = newVal || null;
      }
    });

    photoSlots.forEach(s => {
      updates[s.field] = photoUrls[s.field] || null;
    });

    updateMutation.mutate(updates);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar {forma === 'bloco' ? 'Bloco' : forma === 'chapa' ? 'Chapa' : 'Ladrilho'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editableFields.map(f => (
              <div key={f.field} className="space-y-1">
                <Label>{f.label}</Label>
                <Input
                  type={f.type}
                  value={fieldValues[f.field] ?? ''}
                  onChange={e => setFieldValues(prev => ({
                    ...prev,
                    [f.field]: f.type === 'number' ? (e.target.value === '' ? null : e.target.value) : e.target.value,
                  }))}
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Photo slots */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Fotografias
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {photoSlots.map(slot => (
                <PhotoUploadSlot
                  key={slot.field}
                  label={slot.label}
                  currentUrl={photoUrls[slot.field]}
                  onUpload={(file) => handlePhotoUpload(slot.field, file)}
                  onRemove={() => setPhotoUrls(prev => ({ ...prev, [slot.field]: null }))}
                  isUploading={isUploading}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending || isUploading}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PhotoUploadSlot({ label, currentUrl, onUpload, onRemove, isUploading }: {
  label: string;
  currentUrl: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      {currentUrl ? (
        <div className="relative group">
          <img src={currentUrl} alt={label} className="w-full h-32 object-cover rounded-md border" />
          <button
            onClick={onRemove}
            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-xs">Carregar foto</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
