import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Paperclip, Upload, Loader2, CheckCircle, ExternalLink, ShieldCheck, ImageIcon, Pencil, X } from 'lucide-react';
import { useAppT } from '@/hooks/useAppT';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { useCreateAdenda, useUpdateAdenda, type MovimentoComDetalhes } from '@/hooks/useMovimentos';
import { useAuth } from '@/hooks/useAuth';
import { formatDateTime } from '@/lib/format';
import type { EstadoAdenda } from '@/types/database';

const ADENDA_EDITOR_NAMES = ['ana', 'vanessa', 'manuel castanho'];

function canEditAdendas(email?: string | null, nome?: string | null): boolean {
  const e = (email || '').toLowerCase();
  const n = (nome || '').toLowerCase();
  if (ADENDA_EDITOR_NAMES.some(x => n.includes(x))) return true;
  if (/(^|\W)(ana|vanessa|manuel\.?castanho|manuelcastanho)(@|\W)/.test(e)) return true;
  return false;
}

interface AddendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimento: MovimentoComDetalhes | null;
  initialEditAdendaId?: string | null;
}

export function MovimentoAddendaModal({ open, onOpenChange, movimento, initialEditAdendaId }: AddendaModalProps) {
  const t = useAppT();
  const { toast } = useToast();
  const supabase = useSupabaseEmpresa();
  const createAdenda = useCreateAdenda();
  const updateAdenda = useUpdateAdenda();
  const { user, profile, isSuperadmin, isAdmin } = useAuth();
  const canEdit = isSuperadmin || isAdmin || canEditAdendas(user?.email, profile?.nome);

  const [estado, setEstado] = useState<EstadoAdenda>('faturado');
  const [descricao, setDescricao] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEstado, setEditEstado] = useState<EstadoAdenda>('faturado');
  const [editDescricao, setEditDescricao] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  if (!movimento) return null;

  const startEdit = (ad: any) => {
    setEditingId(ad.id);
    setEditEstado((ad.estado_operacao ?? ad.estado_validacao) as EstadoAdenda);
    setEditDescricao(ad.descricao ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (ad: any) => {
    if (!editDescricao.trim()) {
      toast({ title: 'Descrição obrigatória', variant: 'destructive' });
      return;
    }
    try {
      setSavingEdit(true);
      await updateAdenda.mutateAsync({
        adendaId: ad.id,
        descricao: editDescricao.trim(),
        estadoOperacao: editEstado,
        documentos: ad.documentos ?? [],
      });
      toast({ title: 'Adenda atualizada' });
      setEditingId(null);
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!descricao.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Por favor explique detalhadamente o que foi feito.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      const uploadedAnexos: { url: string; nome: string; tipo?: string }[] = [];

      // Carregar ficheiros para o Supabase Storage
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${movimento.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('documentos-adendas')
          .upload(fileName, file, { contentType: file.type || undefined, upsert: false });

        if (uploadErr) throw uploadErr;

        const { data: pub } = supabase.storage.from('documentos-adendas').getPublicUrl(fileName);

        uploadedAnexos.push({
          url: fileName,
          caminho: fileName,
          public_url: pub?.publicUrl,
          nome: file.name,
          tipo: file.type || undefined,
        } as any);
      }

      await createAdenda.mutateAsync({
        movimentoId: movimento.id,
        idMm: movimento.id_mm ?? null,
        descricao: descricao.trim(),
        estadoOperacao: estado,
        documentos: uploadedAnexos,
      });

      toast({
        title: t('movements.history.addendaSuccessTitle'),
        description: t('movements.history.addendaSuccessDesc'),
      });

      setDescricao('');
      setFiles([]);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao gravar adenda:', err);
      toast({
        title: 'Erro ao gravar',
        description: err.message || 'Ocorreu um erro ao registar a adenda.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (st: EstadoAdenda) => {
    switch (st) {
      case 'pendente':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{t('movements.history.addendaStatusPendente')}</Badge>;
      case 'consumido_parcial':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t('movements.history.addendaStatusConsumidoParcial')}</Badge>;
      case 'consumido_total':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">{t('movements.history.addendaStatusConsumidoTotal')}</Badge>;
      case 'faturado':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t('movements.history.addendaStatusFaturado')}</Badge>;
      case 'stock_mtx':
        return <Badge variant="outline" className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20">Stock MTX</Badge>;
      case 'stock_mm':
        return <Badge variant="outline" className="bg-blue-600/10 text-blue-600 border-blue-600/20">Stock MM</Badge>;
      default:
        return null;
    }
  };

  const handleOpenFile = async (anexo: any) => {
    try {
      if (anexo?.public_url) {
        window.open(anexo.public_url, '_blank', 'noopener,noreferrer');
        return;
      }
      const path = anexo?.caminho || anexo?.url || anexo;
      const { data, error } = await supabase.storage
        .from('documentos-adendas')
        .createSignedUrl(path, 3600);

      if (error || !data?.signedUrl) throw error || new Error('URL indisponível');
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast({
        title: 'Erro ao abrir documento',
        description: 'Não foi possível gerar o link de acesso ao ficheiro.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheck className="w-6 h-6 text-primary" />
            {t('movements.history.addendaTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t('movements.history.addendaSubtitle')} — <span className="font-mono font-medium text-foreground">{movimento.id_mm || movimento.produto_id}</span> ({movimento.quantidade} un)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Secção de Nova Adenda */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Registar Nova Adenda</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">{t('movements.history.addendaStatusLabel')}</Label>
                  <Select value={estado} onValueChange={(val: EstadoAdenda) => setEstado(val)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faturado">{t('movements.history.addendaStatusFaturado')}</SelectItem>
                      <SelectItem value="stock_mtx">{t('movements.history.addendaStatusStockMtx') || 'Stock MTX'}</SelectItem>
                      <SelectItem value="stock_mm">{t('movements.history.addendaStatusStockMm') || 'Stock MM'}</SelectItem>
                      <SelectItem value="consumido_total">{t('movements.history.addendaStatusConsumidoTotal')}</SelectItem>
                      <SelectItem value="consumido_parcial">{t('movements.history.addendaStatusConsumidoParcial')}</SelectItem>
                      <SelectItem value="pendente">{t('movements.history.addendaStatusPendente')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('movements.history.addendaFilesLabel')}</Label>
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" type="button" className="w-full gap-2 cursor-pointer" asChild>
                        <span>
                          <Paperclip className="w-4 h-4" /> Anexar Ficheiros...
                        </span>
                      </Button>
                    </label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{t('movements.history.addendaFilesHint')}</p>
                </div>
              </div>

              {/* Ficheiros selecionados para upload */}
              {files.length > 0 && (
                <div className="space-y-2 bg-muted/40 p-3 rounded-lg border border-border/60">
                  <span className="text-xs font-medium text-muted-foreground">Prontos a carregar ({files.length}):</span>
                  <div className="flex flex-wrap gap-2">
                    {files.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-background border border-border px-2.5 py-1 rounded-md text-xs font-medium">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <span className="max-w-[180px] truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="desc">{t('movements.history.addendaDescLabel')}</Label>
                <Textarea
                  id="desc"
                  rows={4}
                  placeholder={t('movements.history.addendaDescPlaceholder')}
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={uploading || createAdenda.isPending} className="gap-2 px-6">
                  {uploading || createAdenda.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('movements.history.addendaSavingBtn')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {t('movements.history.addendaSaveBtn')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Trilho de Auditoria / Histórico de Adendas */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
                {t('movements.history.addendaHistoryTitle')} ({movimento.adendas?.length || 0})
              </h3>

              {!movimento.adendas || movimento.adendas.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-xl bg-muted/20 text-muted-foreground text-sm">
                  {t('movements.history.addendaEmpty')}
                </div>
              ) : (
                <div className="space-y-3">
                  {movimento.adendas.map((ad, index) => (
                    <div key={ad.id || index} className="border border-border rounded-xl p-4 bg-card/60 space-y-2 text-sm">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          {editingId === ad.id ? (
                            <Select value={editEstado} onValueChange={(v: EstadoAdenda) => setEditEstado(v)}>
                              <SelectTrigger className="h-7 text-xs w-[180px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="faturado">{t('movements.history.addendaStatusFaturado')}</SelectItem>
                                <SelectItem value="stock_mtx">Stock MTX</SelectItem>
                                <SelectItem value="stock_mm">Stock MM</SelectItem>
                                <SelectItem value="consumido_total">{t('movements.history.addendaStatusConsumidoTotal')}</SelectItem>
                                <SelectItem value="consumido_parcial">{t('movements.history.addendaStatusConsumidoParcial')}</SelectItem>
                                <SelectItem value="pendente">{t('movements.history.addendaStatusPendente')}</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            getStatusBadge((ad.estado_operacao ?? ad.estado_validacao) as EstadoAdenda)
                          )}
                          <span className="text-xs text-muted-foreground">
                            registado em {formatDateTime(ad.created_at)}
                          </span>
                        </div>
                        {canEdit && ad.id && (
                          editingId === ad.id ? (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={cancelEdit} disabled={savingEdit}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" className="h-7 px-2 gap-1" onClick={() => saveEdit(ad)} disabled={savingEdit}>
                                {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                Guardar
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs" onClick={() => startEdit(ad)}>
                              <Pencil className="w-3.5 h-3.5" /> Editar
                            </Button>
                          )
                        )}
                      </div>

                      {editingId === ad.id ? (
                        <Textarea
                          rows={4}
                          value={editDescricao}
                          onChange={e => setEditDescricao(e.target.value)}
                          className="resize-none"
                        />
                      ) : (
                        <p className="text-foreground whitespace-pre-wrap py-1 leading-relaxed">{ad.descricao}</p>
                      )}

                      {ad.documentos && ad.documentos.length > 0 && (
                        <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Paperclip className="w-3 h-3" /> Anexos ({ad.documentos.length}):
                          </span>
                          {ad.documentos.map((ax, aIdx) => (
                            <Button
                              key={ax.id || aIdx}
                              variant="secondary"
                              size="sm"
                              className="h-7 text-xs gap-1.5 font-normal"
                              onClick={() => handleOpenFile(ax)}
                            >
                              {(ax.tipo?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(ax.nome || '')) ? (
                                <ImageIcon className="w-3 h-3 text-primary" />
                              ) : (
                                <FileText className="w-3 h-3 text-primary" />
                              )}
                              <span className="max-w-[150px] truncate">{ax.nome}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
