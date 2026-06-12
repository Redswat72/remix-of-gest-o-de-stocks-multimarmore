import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin, Warehouse, Rows3 } from 'lucide-react';
import { useAppT } from '@/hooks/useAppT';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { ProdutoFotos } from '@/components/produtos/ProdutoFotos';
import { ChapaFormSection, type PargaFotos } from '@/components/produtos/ChapaFormSection';
import { useLocaisAtivos } from '@/hooks/useLocais';
import { useEmpresa } from '@/context/EmpresaContext';
import type { Produto } from '@/types/database';

// Base schema for type inference only (no translated messages)
const produtoBaseSchema = z.object({
  idmm: z.string().min(1).max(50),
  tipo_pedra: z.string().min(1).max(100),
  nome_comercial: z.string().max(100).optional(),
  forma: z.enum(['bloco', 'chapa', 'ladrilho'] as const),
  local_id: z.string().optional().nullable(),
  linha: z.string().max(50).optional().nullable(),
  origem_bloco: z.string().max(100).optional(),
  acabamento: z.string().max(50).optional(),
  comprimento_cm: z.number().positive().optional().nullable(),
  largura_cm: z.number().positive().optional().nullable(),
  altura_cm: z.number().positive().optional().nullable(),
  espessura_cm: z.number().positive().optional().nullable(),
  peso_ton: z.number().positive().optional().nullable(),
  valorizacao: z.number().positive().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  observacoes: z.string().max(500).optional(),
  parga1_nome: z.string().max(50).optional().nullable(),
  parga1_quantidade: z.number().int().min(0).optional().nullable(),
  parga1_comprimento_cm: z.number().positive().optional().nullable(),
  parga1_altura_cm: z.number().positive().optional().nullable(),
  parga1_espessura_cm: z.number().positive().optional().nullable(),
  parga2_nome: z.string().max(50).optional().nullable(),
  parga2_quantidade: z.number().int().min(0).optional().nullable(),
  parga2_comprimento_cm: z.number().positive().optional().nullable(),
  parga2_altura_cm: z.number().positive().optional().nullable(),
  parga2_espessura_cm: z.number().positive().optional().nullable(),
  parga3_nome: z.string().max(50).optional().nullable(),
  parga3_quantidade: z.number().int().min(0).optional().nullable(),
  parga3_comprimento_cm: z.number().positive().optional().nullable(),
  parga3_altura_cm: z.number().positive().optional().nullable(),
  parga3_espessura_cm: z.number().positive().optional().nullable(),
  parga4_nome: z.string().max(50).optional().nullable(),
  parga4_quantidade: z.number().int().min(0).optional().nullable(),
  parga4_comprimento_cm: z.number().positive().optional().nullable(),
  parga4_altura_cm: z.number().positive().optional().nullable(),
  parga4_espessura_cm: z.number().positive().optional().nullable(),
});

type ProdutoFormData = z.infer<typeof produtoBaseSchema>;

interface ProdutoFormProps {
  produto?: Produto | null;
  currentLocalId?: string | null;
  onSubmit: (
    data: ProdutoFormData, 
    fotoUrls: (string | null)[], 
    fotoHdUrls: (string | null)[],
    pargaFotos?: PargaFotos
  ) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  canUploadHd?: boolean;
}

const emptyPargaFotos: PargaFotos = {
  parga1_foto1_url: null,
  parga1_foto2_url: null,
  parga2_foto1_url: null,
  parga2_foto2_url: null,
  parga3_foto1_url: null,
  parga3_foto2_url: null,
  parga4_foto1_url: null,
  parga4_foto2_url: null,
};

export function ProdutoForm({ produto, currentLocalId, onSubmit, onCancel, isLoading, canUploadHd = false }: ProdutoFormProps) {
  const t = useAppT();
  const { empresaConfig } = useEmpresa();
  const [fotoUrls, setFotoUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [fotoHdUrls, setFotoHdUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [pargaFotos, setPargaFotos] = useState<PargaFotos>(emptyPargaFotos);
  const [gettingLocation, setGettingLocation] = useState(false);

  const { data: locais = [] } = useLocaisAtivos();

  const produtoWithPeso = produto as (Produto & { peso_ton?: number | null }) | null | undefined;

  // Build schema with translated messages inside component
  const produtoSchema = useMemo(() => {
    const v = t('products.form.validation', { returnObjects: true }) as Record<string, string>;
    const base = z.object({
      idmm: z.string().min(1, v.idmmRequired).max(50, v.max50),
      tipo_pedra: z.string().min(1, v.idmmRequired).max(100, v.max100),
      nome_comercial: z.string().max(100, v.max100).optional(),
      forma: z.enum(['bloco', 'chapa', 'ladrilho'] as const),
      local_id: z.string().optional().nullable(),
      linha: z.string().max(50, v.max50).optional().nullable(),
      origem_bloco: z.string().max(100, v.max100).optional(),
      acabamento: z.string().max(50, v.max50).optional(),
      comprimento_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      largura_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      altura_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      espessura_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      peso_ton: z.number().positive(v.mustBePositive).optional().nullable(),
      valorizacao: z.number().positive(v.mustBePositive).optional().nullable(),
      latitude: z.number().min(-90).max(90).optional().nullable(),
      longitude: z.number().min(-180).max(180).optional().nullable(),
      observacoes: z.string().max(500, v.max500).optional(),
      parga1_nome: z.string().max(50, v.max50).optional().nullable(),
      parga1_quantidade: z.number().int().min(0, v.notNegative).optional().nullable(),
      parga1_comprimento_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      parga1_altura_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      parga1_espessura_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      parga2_nome: z.string().max(50, v.max50).optional().nullable(),
      parga2_quantidade: z.number().int().min(0, v.notNegative).optional().nullable(),
      parga2_comprimento_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      parga2_altura_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      parga2_espessura_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      parga3_nome: z.string().max(50, v.max50).optional().nullable(),
      parga3_quantidade: z.number().int().min(0, v.notNegative).optional().nullable(),
      parga3_comprimento_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      parga3_altura_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      parga3_espessura_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      parga4_nome: z.string().max(50, v.max50).optional().nullable(),
      parga4_quantidade: z.number().int().min(0, v.notNegative).optional().nullable(),
      parga4_comprimento_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      parga4_altura_cm: z.number().positive(v.mustBePositive).optional().nullable(),
      parga4_espessura_cm: z.number().positive(v.mustBePositive).optional().nullable(),
    });
    return base.superRefine((data, ctx) => {
      if (data.forma === 'bloco') {
        if (data.peso_ton === null || data.peso_ton === undefined || data.peso_ton <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.weightRequiredForBlocks, path: ['peso_ton'] });
        }
      }
      if (['bloco', 'chapa', 'ladrilho'].includes(data.forma)) {
        if (data.valorizacao === null || data.valorizacao === undefined || data.valorizacao <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.valuationRequired, path: ['valorizacao'] });
        }
      }
      if (data.forma === 'chapa') {
        const totalChapas = (data.parga1_quantidade || 0) + (data.parga2_quantidade || 0) + (data.parga3_quantidade || 0) + (data.parga4_quantidade || 0);
        if (totalChapas === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.atLeastOneParga, path: ['parga1_quantidade'] });
        }
      }
    });
  }, [t]);

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      idmm: produto?.idmm || '',
      tipo_pedra: produto?.tipo_pedra || '',
      nome_comercial: produto?.nome_comercial || '',
      forma: produto?.forma || 'bloco',
      local_id: null,
      linha: produto?.linha || '',
      origem_bloco: produto?.origem_bloco || '',
      acabamento: produto?.acabamento || '',
      comprimento_cm: produto?.comprimento_cm || null,
      largura_cm: produto?.largura_cm || null,
      altura_cm: produto?.altura_cm || null,
      espessura_cm: produto?.espessura_cm || null,
      peso_ton: produtoWithPeso?.peso_ton || null,
      valorizacao: (produto as any)?.valorizacao || null,
      latitude: produto?.latitude || null,
      longitude: produto?.longitude || null,
      observacoes: produto?.observacoes || '',
      parga1_nome: produto?.parga1_nome || '',
      parga1_quantidade: produto?.parga1_quantidade || null,
      parga1_comprimento_cm: produto?.parga1_comprimento_cm || null,
      parga1_altura_cm: produto?.parga1_altura_cm || null,
      parga1_espessura_cm: produto?.parga1_espessura_cm || null,
      parga2_nome: produto?.parga2_nome || '',
      parga2_quantidade: produto?.parga2_quantidade || null,
      parga2_comprimento_cm: produto?.parga2_comprimento_cm || null,
      parga2_altura_cm: produto?.parga2_altura_cm || null,
      parga2_espessura_cm: produto?.parga2_espessura_cm || null,
      parga3_nome: produto?.parga3_nome || '',
      parga3_quantidade: produto?.parga3_quantidade || null,
      parga3_comprimento_cm: produto?.parga3_comprimento_cm || null,
      parga3_altura_cm: produto?.parga3_altura_cm || null,
      parga3_espessura_cm: produto?.parga3_espessura_cm || null,
      parga4_nome: produto?.parga4_nome || '',
      parga4_quantidade: produto?.parga4_quantidade || null,
      parga4_comprimento_cm: produto?.parga4_comprimento_cm || null,
      parga4_altura_cm: produto?.parga4_altura_cm || null,
      parga4_espessura_cm: produto?.parga4_espessura_cm || null,
    },
  });

  const forma = form.watch('forma');
  const idmm = form.watch('idmm');

  useEffect(() => {
    if (produto) {
      const produtoWithPesoInner = produto as Produto & { peso_ton?: number | null };
      form.reset({
        idmm: produto.idmm || '',
        tipo_pedra: produto.tipo_pedra || '',
        nome_comercial: produto.nome_comercial || '',
        forma: produto.forma || 'bloco',
        local_id: currentLocalId || null,
        linha: produto.linha || '',
        origem_bloco: produto.origem_bloco || '',
        acabamento: produto.acabamento || '',
        comprimento_cm: produto.comprimento_cm || null,
        largura_cm: produto.largura_cm || null,
        altura_cm: produto.altura_cm || null,
        espessura_cm: produto.espessura_cm || null,
        peso_ton: produtoWithPesoInner?.peso_ton || null,
        valorizacao: (produto as any)?.valorizacao || null,
        latitude: produto.latitude || null,
        longitude: produto.longitude || null,
        observacoes: produto.observacoes || '',
        parga1_nome: produto.parga1_nome || '',
        parga1_quantidade: produto.parga1_quantidade || null,
        parga1_comprimento_cm: produto.parga1_comprimento_cm || null,
        parga1_altura_cm: produto.parga1_altura_cm || null,
        parga1_espessura_cm: produto.parga1_espessura_cm || null,
        parga2_nome: produto.parga2_nome || '',
        parga2_quantidade: produto.parga2_quantidade || null,
        parga2_comprimento_cm: produto.parga2_comprimento_cm || null,
        parga2_altura_cm: produto.parga2_altura_cm || null,
        parga2_espessura_cm: produto.parga2_espessura_cm || null,
        parga3_nome: produto.parga3_nome || '',
        parga3_quantidade: produto.parga3_quantidade || null,
        parga3_comprimento_cm: produto.parga3_comprimento_cm || null,
        parga3_altura_cm: produto.parga3_altura_cm || null,
        parga3_espessura_cm: produto.parga3_espessura_cm || null,
        parga4_nome: produto.parga4_nome || '',
        parga4_quantidade: produto.parga4_quantidade || null,
        parga4_comprimento_cm: produto.parga4_comprimento_cm || null,
        parga4_altura_cm: produto.parga4_altura_cm || null,
        parga4_espessura_cm: produto.parga4_espessura_cm || null,
      });

      setFotoUrls([
        produto.foto1_url || null,
        produto.foto2_url || null,
        produto.foto3_url || null,
        produto.foto4_url || null,
      ]);
      const produtoWithHd = produto as Produto & {
        foto1_hd_url?: string | null;
        foto2_hd_url?: string | null;
        foto3_hd_url?: string | null;
        foto4_hd_url?: string | null;
      };
      setFotoHdUrls([
        produtoWithHd.foto1_hd_url || null,
        produtoWithHd.foto2_hd_url || null,
        produtoWithHd.foto3_hd_url || null,
        produtoWithHd.foto4_hd_url || null,
      ]);
      setPargaFotos({
        parga1_foto1_url: produto.parga1_foto1_url || null,
        parga1_foto2_url: produto.parga1_foto2_url || null,
        parga2_foto1_url: produto.parga2_foto1_url || null,
        parga2_foto2_url: produto.parga2_foto2_url || null,
        parga3_foto1_url: produto.parga3_foto1_url || null,
        parga3_foto2_url: produto.parga3_foto2_url || null,
        parga4_foto1_url: produto.parga4_foto1_url || null,
        parga4_foto2_url: produto.parga4_foto2_url || null,
      });
    }
  }, [produto, currentLocalId, form]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('products.form.geolocationUnsupported'));
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('latitude', position.coords.latitude);
        form.setValue('longitude', position.coords.longitude);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        alert(t('products.form.geolocationError'));
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (data: ProdutoFormData) => {
    const maxFotos = 4;
    const urlsToSubmit = fotoUrls.slice(0, maxFotos);
    const hdUrlsToSubmit = fotoHdUrls.slice(0, maxFotos);
    await onSubmit(data, urlsToSubmit, hdUrlsToSubmit, data.forma === 'chapa' ? pargaFotos : undefined);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Identificação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="idmm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{empresaConfig?.idPrefix ?? 'IDMM'} *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('products.form.idmmPlaceholder')} className="touch-target" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="forma"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('products.form.shapeLabel')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="touch-target">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bloco">{t('enums.tipoProduto.bloco')}</SelectItem>
                    <SelectItem value="chapa">{t('enums.tipoProduto.chapa')}</SelectItem>
                    <SelectItem value="ladrilho">{t('enums.tipoProduto.ladrilho')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Parque MM */}
        <FormField
          control={form.control}
          name="local_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                {t('products.form.yardLabel')}
              </FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                value={field.value || '__none__'}
              >
                <FormControl>
                  <SelectTrigger className="touch-target">
                    <SelectValue placeholder={t('products.form.selectYardPlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">{t('products.form.noYard')}</SelectItem>
                  {locais.map((local) => (
                    <SelectItem key={local.id} value={local.id}>
                      {local.codigo} - {local.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {produto 
                  ? t('products.form.yardChangeDesc')
                  : t('products.form.yardCreateDesc')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Linha */}
        <FormField
          control={form.control}
          name="linha"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Rows3 className="h-4 w-4" />
                {t('products.form.lineLabel')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder={t('products.form.linePlaceholder')}
                  className="touch-target"
                />
              </FormControl>
              <FormDescription>
                {t('products.form.lineDesc')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo_pedra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('products.form.stonetype')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('products.form.stonetypePlaceholder')} className="touch-target" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nome_comercial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('products.form.commercialName')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder={t('products.form.commercialNamePlaceholder')} className="touch-target" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Origem do Bloco */}
        <FormField
          control={form.control}
          name="origem_bloco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('products.form.blockOrigin')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder={t('products.form.blockOriginPlaceholder')} className="touch-target" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Acabamento - apenas para chapas e ladrilhos */}
        {forma !== 'bloco' && (
          <FormField
            control={form.control}
            name="acabamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('products.form.finish')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder={t('products.form.finishPlaceholder')} className="touch-target" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Conteúdo específico por forma */}
        {forma === 'chapa' ? (
          <ChapaFormSection
            form={form}
            idmm={idmm || 'novo'}
            produto={produto}
            pargaFotos={pargaFotos}
            onPargaFotosChange={setPargaFotos}
          />
        ) : (
          <>
            {/* Dimensões */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">{t('products.form.dimensionsCm')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="comprimento_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('products.form.length')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          className="touch-target"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="largura_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('products.form.width')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          className="touch-target"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {forma === 'bloco' && (
                  <FormField
                    control={form.control}
                    name="altura_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('products.form.height')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            className="touch-target"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Peso - apenas para blocos */}
            {forma === 'bloco' && (
              <div>
                <FormField
                  control={form.control}
                  name="peso_ton"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('products.form.weightTon')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          placeholder="Ex: 12.5"
                          className="touch-target max-w-[200px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Fotografias para bloco/ladrilho */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                {t('products.form.photosSectionTitle')}
              </h3>
              <ProdutoFotos
                forma={forma}
                idmm={idmm || 'novo'}
                fotoUrls={fotoUrls}
                fotoHdUrls={fotoHdUrls}
                onFotosChange={setFotoUrls}
                onFotosHdChange={setFotoHdUrls}
                canUploadHd={canUploadHd}
              />
            </div>
          </>
        )}

        {/* Valorização */}
        <div>
          <FormField
            control={form.control}
            name="valorizacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('products.form.valuationLabel', { unit: forma === 'bloco' ? '€/ton' : '€/m²' })}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    placeholder="0.00"
                    className="touch-target max-w-[200px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* GPS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-muted-foreground">{t('products.form.gpsLabel')}</h3>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="touch-target"
            >
              {gettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              {t('products.form.getLocation')}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products.form.latitude')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      inputMode="decimal"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      placeholder={t('products.form.latitudePlaceholder')}
                      className="touch-target"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products.form.longitude')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      inputMode="decimal"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      placeholder={t('products.form.longitudePlaceholder')}
                      className="touch-target"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Observações */}
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('products.observations')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder={t('products.form.observationsPlaceholder')}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="touch-target">
            {t('products.form.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading} className="touch-target">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {produto ? t('products.form.saveChanges') : t('products.form.createProduct')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
