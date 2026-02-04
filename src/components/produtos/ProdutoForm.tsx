import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin } from 'lucide-react';
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
} from '@/components/ui/form';
import { ProdutoFotos } from '@/components/produtos/ProdutoFotos';
import { ChapaFormSection, type PargaFotos } from '@/components/produtos/ChapaFormSection';
import type { Produto } from '@/types/database';

const produtoBaseSchema = z.object({
  idmm: z.string().min(1, 'IDMM é obrigatório').max(50, 'Máximo 50 caracteres'),
  tipo_pedra: z.string().min(1, 'Tipo de pedra é obrigatório').max(100, 'Máximo 100 caracteres'),
  nome_comercial: z.string().max(100, 'Máximo 100 caracteres').optional(),
  forma: z.enum(['bloco', 'chapa', 'ladrilho'] as const),
  origem_bloco: z.string().max(100, 'Máximo 100 caracteres').optional(),
  acabamento: z.string().max(50, 'Máximo 50 caracteres').optional(),
  comprimento_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  largura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  altura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  espessura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  peso_ton: z.number().positive('Deve ser positivo').optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  observacoes: z.string().max(500, 'Máximo 500 caracteres').optional(),
  // Campos de pargas (apenas para chapas)
  parga1_nome: z.string().max(50, 'Máximo 50 caracteres').optional().nullable(),
  parga1_quantidade: z.number().int().min(0, 'Não pode ser negativo').optional().nullable(),
  parga1_comprimento_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  parga1_altura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  parga1_espessura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  parga2_nome: z.string().max(50, 'Máximo 50 caracteres').optional().nullable(),
  parga2_quantidade: z.number().int().min(0, 'Não pode ser negativo').optional().nullable(),
  parga2_comprimento_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  parga2_altura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  parga2_espessura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  parga3_nome: z.string().max(50, 'Máximo 50 caracteres').optional().nullable(),
  parga3_quantidade: z.number().int().min(0, 'Não pode ser negativo').optional().nullable(),
  parga3_comprimento_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  parga3_altura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  parga3_espessura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  parga4_nome: z.string().max(50, 'Máximo 50 caracteres').optional().nullable(),
  parga4_quantidade: z.number().int().min(0, 'Não pode ser negativo').optional().nullable(),
  parga4_comprimento_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  parga4_altura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
  parga4_espessura_cm: z.number().positive('Deve ser positivo').optional().nullable(),
});

// Schema com refinamento para peso obrigatório em blocos e validação de chapas
const produtoSchema = produtoBaseSchema.superRefine((data, ctx) => {
  if (data.forma === 'bloco') {
    if (data.peso_ton === null || data.peso_ton === undefined || data.peso_ton <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Peso em toneladas é obrigatório para blocos',
        path: ['peso_ton'],
      });
    }
  }
  
  if (data.forma === 'chapa') {
    // Pelo menos uma parga com quantidade > 0
    const totalChapas = 
      (data.parga1_quantidade || 0) + 
      (data.parga2_quantidade || 0) + 
      (data.parga3_quantidade || 0) + 
      (data.parga4_quantidade || 0);
    
    if (totalChapas === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pelo menos uma parga deve ter quantidade > 0',
        path: ['parga1_quantidade'],
      });
    }
  }
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface ProdutoFormProps {
  produto?: Produto | null;
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

export function ProdutoForm({ produto, onSubmit, onCancel, isLoading, canUploadHd = false }: ProdutoFormProps) {
  const [fotoUrls, setFotoUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [fotoHdUrls, setFotoHdUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [pargaFotos, setPargaFotos] = useState<PargaFotos>(emptyPargaFotos);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Aceder ao peso_ton do produto com type assertion
  const produtoWithPeso = produto as (Produto & { peso_ton?: number | null }) | null | undefined;

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      idmm: produto?.idmm || '',
      tipo_pedra: produto?.tipo_pedra || '',
      nome_comercial: produto?.nome_comercial || '',
      forma: produto?.forma || 'bloco',
      origem_bloco: produto?.origem_bloco || '',
      acabamento: produto?.acabamento || '',
      comprimento_cm: produto?.comprimento_cm || null,
      largura_cm: produto?.largura_cm || null,
      altura_cm: produto?.altura_cm || null,
      espessura_cm: produto?.espessura_cm || null,
      peso_ton: produtoWithPeso?.peso_ton || null,
      latitude: produto?.latitude || null,
      longitude: produto?.longitude || null,
      observacoes: produto?.observacoes || '',
      // Campos de pargas
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

  // Carregar fotos existentes do produto
  useEffect(() => {
    if (produto) {
      setFotoUrls([
        produto.foto1_url || null,
        produto.foto2_url || null,
        produto.foto3_url || null,
        produto.foto4_url || null,
      ]);
      // Carregar fotos HD se existirem
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
      // Carregar fotos de pargas
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
  }, [produto]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador');
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
        alert('Não foi possível obter a localização');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (data: ProdutoFormData) => {
    const maxFotos = data.forma === 'bloco' ? 4 : 2;
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
                <FormLabel>IDMM *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: BL-001" className="touch-target" />
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
                <FormLabel>Forma *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="touch-target">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bloco">Bloco</SelectItem>
                    <SelectItem value="chapa">Chapa</SelectItem>
                    <SelectItem value="ladrilho">Ladrilho</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo_pedra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Pedra *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Mármore Branco" className="touch-target" />
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
                <FormLabel>Nome Comercial</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder="Ex: Estremoz Clássico" className="touch-target" />
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
              <FormLabel>Origem do Bloco</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="Ex: Portugal, Brasil, Espanha" className="touch-target" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Acabamento - apenas para chapas e ladrilhos (blocos não têm acabamento) */}
        {forma !== 'bloco' && (
          <FormField
            control={form.control}
            name="acabamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acabamento</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder="Ex: Polido, Amaciado" className="touch-target" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Conteúdo específico por forma */}
        {forma === 'chapa' ? (
          /* Formulário específico para chapas */
          <ChapaFormSection
            form={form}
            idmm={idmm || 'novo'}
            produto={produto}
            pargaFotos={pargaFotos}
            onPargaFotosChange={setPargaFotos}
          />
        ) : (
          /* Formulário padrão para blocos e ladrilhos */
          <>
            {/* Dimensões */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Dimensões (cm)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="comprimento_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comprimento</FormLabel>
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
                      <FormLabel>Largura</FormLabel>
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
                        <FormLabel>Altura</FormLabel>
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
                      <FormLabel>Peso (toneladas) *</FormLabel>
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
                Fotografias ({forma === 'bloco' ? 'máx. 4' : 'máx. 2'})
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

        {/* GPS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-muted-foreground">Localização GPS</h3>
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
              Obter Localização
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      inputMode="decimal"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      placeholder="-90 a 90"
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
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      inputMode="decimal"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      placeholder="-180 a 180"
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
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Notas adicionais sobre o produto..."
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
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="touch-target">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {produto ? 'Guardar Alterações' : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
