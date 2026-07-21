import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Upload, X, Loader2, Image as ImageIcon, Trash2, Camera, Lock } from 'lucide-react';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAuth } from '@/hooks/useAuth';
import { useAppT } from '@/hooks/useAppT';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Bloco, Chapa, Ladrilho } from '@/types/inventario';

type FormaInventario = 'bloco' | 'chapa' | 'ladrilho';

interface PhotoSlot {
  label: string;
  field: string;
  currentUrl: string | null;
}

function getPhotoSlots(forma: FormaInventario, data: Bloco | Chapa | Ladrilho, t: (key: string, opts?: any) => string): PhotoSlot[] {
  if (forma === 'bloco') {
    const d = data as Bloco;
    return [
      { label: t('movements.fotoN', { n: 1 }), field: 'foto1_url', currentUrl: d.foto1_url },
      { label: t('movements.fotoN', { n: 2 }), field: 'foto2_url', currentUrl: d.foto2_url },
      { label: t('movements.fotoN', { n: 3 }), field: 'foto3_url', currentUrl: d.foto3_url },
      { label: t('movements.fotoN', { n: 4 }), field: 'foto4_url', currentUrl: d.foto4_url },
    ];
  }
  if (forma === 'chapa') {
    const d = data as Chapa;
    const slots: PhotoSlot[] = [];
    for (let i = 1; i <= 4; i++) {
      const nome = d[`parga${i}_nome` as keyof Chapa] as string | null;
      if (nome || i <= 2) {
        slots.push({
          label: t('inventory.detail.pargaFirst', { n: i }),
          field: `parga${i}_foto_primeira`,
          currentUrl: d[`parga${i}_foto_primeira` as keyof Chapa] as string | null,
        });
        slots.push({
          label: t('inventory.detail.pargaLast', { n: i }),
          field: `parga${i}_foto_ultima`,
          currentUrl: d[`parga${i}_foto_ultima` as keyof Chapa] as string | null,
        });
      }
    }
    return slots;
  }
  const d = data as Ladrilho;
  return [
    { label: t('inventory.detail.photoSample'), field: 'foto_amostra_url', currentUrl: d.foto_amostra_url },
  ];
}

type EditableField = { label: string; field: string; value: string | number | null; type: 'text' | 'number'; operadorEditable?: boolean };

function getEditableFields(forma: FormaInventario, data: Bloco | Chapa | Ladrilho, t: (key: string) => string): EditableField[] {
  if (forma === 'bloco') {
    const d = data as Bloco;
    return [
      { label: t('inventory.edit.fields.variety'), field: 'variedade', value: d.variedade, type: 'text' },
      { label: t('inventory.edit.fields.yard'), field: 'parque', value: d.parque, type: 'text' },
      { label: t('inventory.edit.fields.origin'), field: 'bloco_origem', value: d.bloco_origem, type: 'text' },
      { label: t('inventory.edit.fields.supplier'), field: 'fornecedor', value: d.fornecedor, type: 'text' },
      { label: t('inventory.edit.fields.lengthCm'), field: 'comprimento', value: d.comprimento, type: 'number', operadorEditable: true },
      { label: t('inventory.edit.fields.widthCm'), field: 'largura', value: d.largura, type: 'number', operadorEditable: true },
      { label: t('inventory.edit.fields.heightCm'), field: 'altura', value: d.altura, type: 'number', operadorEditable: true },
      { label: t('inventory.edit.fields.weightKg'), field: 'quantidade_kg', value: d.quantidade_kg, type: 'number', operadorEditable: true },
      { label: t('inventory.edit.fields.pricePerKg'), field: 'preco_unitario', value: d.preco_unitario, type: 'number' },
    ];
  }
  if (forma === 'chapa') {
    const d = data as Chapa;
    const base: EditableField[] = [
      { label: t('inventory.edit.fields.variety'), field: 'variedade', value: d.variedade, type: 'text' },
      { label: t('inventory.edit.fields.yard'), field: 'parque', value: d.parque, type: 'text' },
      { label: t('inventory.edit.fields.bundleId'), field: 'bundle_id', value: d.bundle_id, type: 'text' },
      { label: t('inventory.edit.fields.supplier'), field: 'fornecedor', value: d.fornecedor, type: 'text' },
      { label: t('inventory.edit.fields.numSlabs'), field: 'num_chapas', value: d.num_chapas, type: 'number' },
      { label: t('inventory.edit.fields.areaM2'), field: 'quantidade_m2', value: d.quantidade_m2, type: 'number' },
      { label: t('inventory.edit.fields.pricePerM2'), field: 'preco_unitario', value: d.preco_unitario, type: 'number' },
    ];
    const row = d as unknown as Record<string, unknown>;
    for (let i = 1; i <= 4; i++) {
      const nome = (row[`parga${i}_nome`] ?? null) as string | null;
      const qtd = (row[`parga${i}_quantidade`] ?? null) as number | null;
      const cmp = (row[`parga${i}_comprimento`] ?? null) as number | null;
      const alt = (row[`parga${i}_altura`] ?? null) as number | null;
      const esp = (row[`parga${i}_espessura`] ?? null) as number | null;
      if (nome || qtd != null || cmp != null || alt != null || esp != null) {
        base.push({
          label: `Parga ${i} — ${t('inventory.edit.fields.thicknessCm') || 'Espessura (cm)'}`,
          field: `parga${i}_espessura`,
          value: esp,
          type: 'number',
          operadorEditable: true,
        });
      }
    }
    return base;
  }
  const d = data as Ladrilho;
  return [
    { label: t('inventory.edit.fields.variety'), field: 'variedade', value: d.variedade, type: 'text' },
    { label: t('inventory.edit.fields.yard'), field: 'parque', value: d.parque, type: 'text' },
    { label: t('inventory.edit.fields.supplier'), field: 'fornecedor', value: (d as any).fornecedor ?? null, type: 'text' },
    { label: t('inventory.edit.fields.dimensions'), field: 'dimensoes', value: d.dimensoes, type: 'text' },
    { label: t('inventory.edit.fields.numPieces'), field: 'num_pecas', value: d.num_pecas, type: 'number' },
    { label: t('inventory.edit.fields.areaM2'), field: 'quantidade_m2', value: d.quantidade_m2, type: 'number' },
    { label: t('inventory.edit.fields.pricePerM2'), field: 'preco_unitario', value: d.preco_unitario, type: 'number' },
  ];
}

interface InventarioEditModalProps {
  forma: FormaInventario;
  data: Bloco | Chapa | Ladrilho;
  itemId: string;
}

export default function InventarioEditModal({ forma, data, itemId }: InventarioEditModalProps) {
  const t = useAppT();
  const [open, setOpen] = useState(false);
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();
  const { uploadImage, isUploading } = useImageUpload();
  const { hasRole, isAdmin } = useAuth();
  const isOperador = hasRole('operador') && !isAdmin && (forma === 'bloco' || forma === 'chapa');

  const tableName = forma === 'bloco' ? 'blocos' : forma === 'chapa' ? 'chapas' : 'ladrilho';

  const editableFields = getEditableFields(forma, data, t);
  const photoSlots = getPhotoSlots(forma, data, t);

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
      queryClient.invalidateQueries({ queryKey: ['blocos-unificado'] });
      queryClient.invalidateQueries({ queryKey: ['chapas-unificado'] });
      queryClient.invalidateQueries({ queryKey: ['ladrilho-unificado'] });
      queryClient.invalidateQueries({ queryKey: ['stock-unificado'] });
      toast.success(t('inventory.edit.updatedSuccess'));
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(t('inventory.edit.updateErrorPrefix') + err.message);
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
      toast.success(t('inventory.edit.uploadPhotoSuccess'));
    }
  };

  const handleSave = () => {
    const updates: Record<string, unknown> = {};

    editableFields.forEach(f => {
      if (isOperador && !f.operadorEditable) return;
      const newVal = fieldValues[f.field];
      if (f.type === 'number') {
        updates[f.field] = newVal != null && newVal !== '' ? Number(newVal) : null;
      } else {
        updates[f.field] = newVal || null;
      }
    });

    if (!isOperador) {
      photoSlots.forEach(s => {
        updates[s.field] = photoUrls[s.field] || null;
      });
    }

    updateMutation.mutate(updates);
  };

  const editTitle = forma === 'bloco'
    ? t('inventory.edit.editBlock')
    : forma === 'chapa'
    ? t('inventory.edit.editSlab')
    : t('inventory.edit.editTile');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          {t('actions.edit')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTitle}</DialogTitle>
          {isOperador && (
            <p className="text-xs text-muted-foreground">
              {t('inventory.edit.operatorNote')}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editableFields.map(f => {
              const locked = isOperador && !f.operadorEditable;
              return (
                <div key={f.field} className="space-y-1">
                  <Label className="flex items-center gap-1">
                    {f.label}
                    {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input
                    type={f.type}
                    value={fieldValues[f.field] ?? ''}
                    disabled={locked}
                    className={cn(locked && 'bg-muted cursor-not-allowed opacity-60')}
                    onChange={e => setFieldValues(prev => ({
                      ...prev,
                      [f.field]: f.type === 'number' ? (e.target.value === '' ? null : e.target.value) : e.target.value,
                    }))}
                  />
                </div>
              );
            })}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {t('inventory.edit.photos')}
              {isOperador && <Lock className="h-3 w-3 text-muted-foreground" />}
            </h3>
            {isOperador ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photoSlots.filter(s => photoUrls[s.field]).length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-full">{t('inventory.edit.noPhotos')}</p>
                ) : (
                  photoSlots
                    .filter(s => photoUrls[s.field])
                    .map(slot => (
                      <div key={slot.field} className="space-y-1">
                        <Label className="text-xs">{slot.label}</Label>
                        <img
                          src={photoUrls[slot.field] as string}
                          alt={slot.label}
                          className="w-full h-24 object-cover rounded-md border"
                        />
                      </div>
                    ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {photoSlots.map(slot => (
                  <PhotoUploadSlot
                    key={slot.field}
                    label={slot.label}
                    currentUrl={photoUrls[slot.field]}
                    onUpload={(file) => handlePhotoUpload(slot.field, file)}
                    onRemove={() => setPhotoUrls(prev => ({ ...prev, [slot.field]: null }))}
                    isUploading={isUploading}
                    cameraLabel={t('inventory.edit.camera')}
                    galleryLabel={t('inventory.edit.gallery')}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending || isUploading}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('actions.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PhotoUploadSlot({ label, currentUrl, onUpload, onRemove, isUploading, cameraLabel, galleryLabel }: {
  label: string;
  currentUrl: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading: boolean;
  cameraLabel: string;
  galleryLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

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
        <div className="grid grid-cols-2 gap-2 h-32">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={isUploading}
            className="border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            <span className="text-xs">{cameraLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs">{galleryLabel}</span>
          </button>
        </div>
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
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
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
