import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { ArrowLeft, ArrowRight, Check, ArrowDownToLine, ArrowRightLeft, Package, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSearchInventario, type InventarioItem } from '@/hooks/useSearchInventario';
import { useClientes } from '@/hooks/useClientes';
import { useLocaisAtivos } from '@/hooks/useLocais';
import { useStockProdutoLocal } from '@/hooks/useStock';
import { useCreateMovimento } from '@/hooks/useMovimentos';
import type { TipoMovimento, TipoDocumento, OrigemMaterial, FormaProduto, MovimentoFormData } from '@/types/database';
import { PhotoUploadField } from '@/components/movimentos/PhotoUploadField';
import { useAppT } from '@/hooks/useAppT';
import { useEnumLabel } from '@/lib/enumLabels';

const PEDREIRAS = ['Del Rey', 'Mol', 'Olival do Pires'];

export default function NovoMovimento() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userLocal, hasRole, isAdmin, isSuperadmin } = useAuth();
  const createMovimento = useCreateMovimento();
  const supabaseEmpresa = useSupabaseEmpresa();
  const t = useAppT();
  const enumLabel = useEnumLabel();

  const STEPS = [
    { id: 1, title: t('movements.steps.tipo.title'), description: t('movements.steps.tipo.description') },
    { id: 2, title: t('movements.steps.documento.title'), description: t('movements.steps.documento.description') },
    { id: 3, title: t('movements.steps.produto.title'), description: t('movements.steps.produto.description') },
    { id: 4, title: t('movements.steps.locais.title'), description: t('movements.steps.locais.description') },
    { id: 5, title: t('movements.steps.transporte.title'), description: t('movements.steps.transporte.description') },
    { id: 6, title: t('movements.steps.confirmacao.title'), description: t('movements.steps.confirmacao.description') },
  ];

  // Apenas operadores e superadmins podem registar movimentos
  if (!hasRole('operador') && !isSuperadmin) {
    return <Navigate to="/" replace />;
  }

  const [step, setStep] = useState(1);

  // Form state
  const [tipo, setTipo] = useState<TipoMovimento | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('sem_documento');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [origemMaterial, setOrigemMaterial] = useState<OrigemMaterial>('adquirido');
  const [fornecedor, setFornecedor] = useState('');
  const [pedreiraOrigem, setPedreiraOrigem] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState<number | ''>('');
  const [localOrigemId, setLocalOrigemId] = useState('');
  const [localDestinoId, setLocalDestinoId] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [matriculaViatura, setMatriculaViatura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [searchProduto, setSearchProduto] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);

  // New product form state (for Entrada)
  const [novoProdutoForma, setNovoProdutoForma] = useState<FormaProduto>('bloco');
  const [novoProdutoIdMM, setNovoProdutoIdMM] = useState('');
  const [novoProdutoVariedade, setNovoProdutoVariedade] = useState('');
  const [novoProdutoComprimento, setNovoProdutoComprimento] = useState<number | ''>('');
  const [novoProdutoLargura, setNovoProdutoLargura] = useState<number | ''>('');
  const [novoProdutoAltura, setNovoProdutoAltura] = useState<number | ''>('');
  const [novoProdutoPeso, setNovoProdutoPeso] = useState<number | ''>('');
  const [novoProdutoParqueDestinoId, setNovoProdutoParqueDestinoId] = useState('');
  const [novoProdutoNumChapas, setNovoProdutoNumChapas] = useState<number | ''>('');
  const [novoProdutoNumPecas, setNovoProdutoNumPecas] = useState<number | ''>('');

  // Photo URL fields
  const [blocoFoto1, setBlocoFoto1] = useState('');
  const [blocoFoto2, setBlocoFoto2] = useState('');
  const [blocoFoto3, setBlocoFoto3] = useState('');
  const [ladrilhoFoto1, setLadrilhoFoto1] = useState('');
  const [ladrilhoFoto2, setLadrilhoFoto2] = useState('');
  const [pargaFotos, setPargaFotos] = useState<{ primeira: string; ultima: string }[]>([
    { primeira: '', ultima: '' },
    { primeira: '', ultima: '' },
    { primeira: '', ultima: '' },
    { primeira: '', ultima: '' },
  ]);

  // Data queries
  const { data: inventarioResults } = useSearchInventario(
    tipo !== 'entrada' ? searchProduto || undefined : undefined
  );
  const { data: clientes } = useClientes();
  const { data: locais } = useLocaisAtivos();

  // Stock validation
  const { data: stockDisponivel } = useStockProdutoLocal(
    selectedItem?.id_mm,
    selectedItem?.tipo,
    tipo === 'entrada' ? undefined : localOrigemId
  );

  const selectedLocalOrigem = locais?.find(l => l.id === localOrigemId);
  const selectedLocalDestino = locais?.find(l => l.id === (tipo === 'entrada' ? novoProdutoParqueDestinoId : localDestinoId));

  // Set default local for entrada
  useEffect(() => {
    if (tipo === 'entrada' && userLocal && !isAdmin && !novoProdutoParqueDestinoId) {
      setNovoProdutoParqueDestinoId(userLocal.id);
    }
  }, [tipo, userLocal, isAdmin]);

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!tipo;
      case 2:
        if (tipo === 'transferencia' || tipo === 'saida') {
          if (tipoDocumento === 'sem_documento') return false;
          if (!numeroDocumento.trim()) return false;
          return true;
        }
        if (tipo === 'entrada') {
          if (!origemMaterial) return false;
          if (origemMaterial === 'producao_propria') {
            if (!pedreiraOrigem) return false;
            return true;
          }
          if (origemMaterial === 'adquirido') {
            if (tipoDocumento === 'sem_documento') return false;
            if (!numeroDocumento.trim()) return false;
            return true;
          }
          return true;
        }
        return true;
      case 3:
        if (tipo === 'entrada') {
          return !!novoProdutoIdMM.trim() && !!novoProdutoParqueDestinoId && typeof quantidade === 'number' && quantidade > 0;
        }
        return !!produtoId && typeof quantidade === 'number' && quantidade > 0;
      case 4:
        if (tipo === 'entrada') return true;
        if (tipo === 'transferencia') {
          return !!localOrigemId && !!localDestinoId && localOrigemId !== localDestinoId;
        }
        if (tipo === 'saida') {
          return !!localOrigemId && !!clienteNome.trim();
        }
        return false;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const isStockInsuficiente = (): boolean => {
    if (tipo === 'entrada') return false;
    if (!produtoId || !localOrigemId) return false;
    return (stockDisponivel ?? 0) < quantidade;
  };

  const nextStep = () => {
    if (tipo === 'entrada' && step === 3) {
      setStep(5);
      return;
    }
    if (!canProceed()) {
      if (tipo === 'saida' && step === 2 && !numeroDocumento.trim()) {
        toast({ title: t('movements.campoObrigatorio'), description: t('movements.documentoObrigatorio'), variant: 'destructive' });
        return;
      }
      if (tipo === 'saida' && step === 4 && !clienteNome.trim()) {
        toast({ title: t('movements.campoObrigatorio'), description: t('movements.cliente.required'), variant: 'destructive' });
        return;
      }
      return;
    }
    if (step < 6) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (tipo === 'entrada' && step === 5) {
      setStep(3);
      return;
    }
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!tipo || !user) return;
    setIsSubmitting(true);

    try {
      if (tipo === 'entrada') {
        const parqueCodigo = locais?.find(l => l.id === novoProdutoParqueDestinoId)?.codigo || '';
        const today = new Date().toISOString().split('T')[0];
        let insertedId: string | null = null;

        if (novoProdutoForma === 'bloco') {
          const { data: blocoData, error: blocoErr } = await supabaseEmpresa
            .from('blocos')
            .insert({
              id_mm: novoProdutoIdMM,
              parque: parqueCodigo,
              variedade: novoProdutoVariedade || null,
              comprimento: novoProdutoComprimento || null,
              largura: novoProdutoLargura || null,
              altura: novoProdutoAltura || null,
              quantidade_kg: novoProdutoPeso || null,
              fornecedor: origemMaterial === 'adquirido' ? fornecedor || null : null,
              pedreira_origem: origemMaterial === 'producao_propria' ? pedreiraOrigem : null,
              sem_documento: origemMaterial === 'producao_propria',
              entrada_stock: today,
              ativo: true,
              foto1_url: blocoFoto1 || null,
              foto2_url: blocoFoto2 || null,
              foto3_url: blocoFoto3 || null,
            } as any)
            .select('id')
            .single();
          if (blocoErr) throw blocoErr;
          insertedId = blocoData?.id;
        } else if (novoProdutoForma === 'chapa') {
          const chapaInsert: Record<string, unknown> = {
            id_mm: novoProdutoIdMM,
            parque: parqueCodigo,
            variedade: novoProdutoVariedade || null,
            largura: novoProdutoLargura || null,
            altura: novoProdutoAltura || null,
            num_chapas: novoProdutoNumChapas || null,
            fornecedor: origemMaterial === 'adquirido' ? fornecedor || null : null,
            entrada_stock: today,
          };
          for (let i = 0; i < 4; i++) {
            const n = i + 1;
            if (pargaFotos[i].primeira) chapaInsert[`parga${n}_foto_primeira`] = pargaFotos[i].primeira;
            if (pargaFotos[i].ultima) chapaInsert[`parga${n}_foto_ultima`] = pargaFotos[i].ultima;
          }
          const { data: chapaData, error: chapaErr } = await supabaseEmpresa
            .from('chapas')
            .insert(chapaInsert as any)
            .select('id')
            .single();
          if (chapaErr) throw chapaErr;
          insertedId = chapaData?.id;
        } else if (novoProdutoForma === 'ladrilho') {
          const { data: ladrilhoData, error: ladrilhoErr } = await supabaseEmpresa
            .from('ladrilho')
            .insert({
              id_mm: novoProdutoIdMM,
              parque: parqueCodigo,
              variedade: novoProdutoVariedade || null,
              comprimento: novoProdutoComprimento || null,
              largura: novoProdutoLargura || null,
              altura: novoProdutoAltura || null,
              num_pecas: novoProdutoNumPecas || null,
              fornecedor: origemMaterial === 'adquirido' ? fornecedor || null : null,
              entrada_stock: today,
              foto1_url: ladrilhoFoto1 || null,
              foto2_url: ladrilhoFoto2 || null,
            } as any)
            .select('id')
            .single();
          if (ladrilhoErr) throw ladrilhoErr;
          insertedId = ladrilhoData?.id;
        }

        let stockInserted = false;
        try {
          const { error: stockErr } = await supabaseEmpresa
            .from('stock')
            .insert({
              id_mm: novoProdutoIdMM,
              tipo_produto: novoProdutoForma,
              local_id: novoProdutoParqueDestinoId,
              quantidade: 1,
            } as any);
          if (stockErr) throw stockErr;
          stockInserted = true;
        } catch (stockErr) {
          if (insertedId) {
            const table = novoProdutoForma === 'bloco' ? 'blocos' : novoProdutoForma === 'chapa' ? 'chapas' : 'ladrilho';
            await supabaseEmpresa.from(table).delete().eq('id', insertedId);
          }
          throw stockErr;
        }

        try {
          const formData: MovimentoFormData = {
            tipo,
            tipo_documento: tipoDocumento,
            numero_documento: numeroDocumento || undefined,
            origem_material: origemMaterial,
            id_mm: novoProdutoIdMM,
            tipo_produto: novoProdutoForma,
            quantidade,
            local_destino_id: novoProdutoParqueDestinoId,
            matricula_viatura: matriculaViatura || undefined,
            observacoes: observacoes || undefined,
          };
          await createMovimento.mutateAsync(formData);
        } catch (movErr) {
          if (stockInserted) {
            await supabaseEmpresa
              .from('stock')
              .delete()
              .eq('id_mm', novoProdutoIdMM)
              .eq('tipo_produto', novoProdutoForma)
              .eq('local_id', novoProdutoParqueDestinoId);
          }
          if (insertedId) {
            const table = novoProdutoForma === 'bloco' ? 'blocos' : novoProdutoForma === 'chapa' ? 'chapas' : 'ladrilho';
            await supabaseEmpresa.from(table).delete().eq('id', insertedId);
          }
          throw movErr;
        }

        toast({
          title: t('movements.registado.title'),
          description: t('movements.registado.desc'),
        });
        navigate('/historico');
        return;
      }

      // Transferência / Saída flow
      if (isStockInsuficiente()) {
        toast({
          title: t('movements.stockInsuficienteToastTitle'),
          description: t('movements.stockInsuficienteToastDesc', { n: stockDisponivel }),
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const itemIdMm = selectedItem?.id_mm || '';
      const itemTipo = selectedItem?.tipo || '';

      if (tipo === 'transferencia') {
        const destCodigo = locais?.find(l => l.id === localDestinoId)?.codigo || '';
        const { error: updateErr } = await supabaseEmpresa.rpc('transferir_produto', {
          p_id_mm: itemIdMm,
          p_tipo: itemTipo,
          p_parque_destino: destCodigo,
        });
        if (updateErr) throw updateErr;
      }

      const formData: MovimentoFormData = {
        tipo,
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento || undefined,
        id_mm: itemIdMm,
        tipo_produto: itemTipo,
        quantidade,
        local_origem_id: localOrigemId || undefined,
        local_destino_id: tipo !== 'saida' ? localDestinoId : undefined,
        cliente_nome: tipo === 'saida' ? clienteNome.trim() : undefined,
        matricula_viatura: matriculaViatura || undefined,
        observacoes: observacoes || undefined,
      };

      await createMovimento.mutateAsync(formData);

      if (tipo === 'saida') {
        const table = itemTipo === 'bloco' ? 'blocos' : itemTipo === 'chapa' ? 'chapas' : 'ladrilho';
        const { error: updateErr } = await supabaseEmpresa
          .from(table)
          .update({ ativo: false } as any)
          .eq('id_mm', itemIdMm);
        if (updateErr) {
          console.error('Movimento registado, mas falhou marcar produto como inactivo:', updateErr);
        }
      }

      toast({
        title: t('movements.registado.title'),
        description: t('movements.registado.desc'),
      });
      navigate('/historico');

    } catch (error) {
      const msg = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as any).message)
          : JSON.stringify(error);
      console.error('Erro ao registar movimento:', error);
      toast({
        title: t('movements.erroRegistar'),
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTipoChange = (newTipo: TipoMovimento) => {
    setTipo(newTipo);
    setLocalOrigemId('');
    setLocalDestinoId('');
    setClienteNome('');
    setProdutoId('');
    setSelectedItem(null);
    setSearchProduto('');

    if (newTipo === 'entrada') {
      setOrigemMaterial('adquirido');
      setTipoDocumento('guia_transporte');
      setNovoProdutoIdMM('');
    } else {
      setTipoDocumento('sem_documento');
    }

    setTimeout(() => {
      if (userLocal && !isAdmin) {
        if (newTipo === 'entrada') {
          setNovoProdutoParqueDestinoId(userLocal.id);
        } else {
          setLocalOrigemId(userLocal.id);
        }
      }
    }, 0);
  };

  const formaLabel = (f: FormaProduto) => enumLabel('tipoProduto', f);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('movements.pageTitle')}</h1>
        <p className="text-muted-foreground">{t('movements.pageSubtitle')}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {STEPS.map((s, index) => {
          if (tipo === 'entrada' && s.id === 4) return null;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step > s.id
                      ? 'bg-primary text-primary-foreground'
                      : step === s.id
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s.id ? <Check className="w-5 h-5" /> : s.id}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${step >= s.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.title}
                </span>
              </div>
              {index < STEPS.length - 1 && !(tipo === 'entrada' && s.id === 4) && (
                <div className={`w-8 sm:w-16 h-1 mx-2 rounded ${step > s.id ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step - 1].title}</CardTitle>
          <CardDescription>{STEPS[step - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Tipo */}
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Button
                variant={tipo === 'entrada' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => handleTipoChange('entrada')}
              >
                <ArrowDownToLine className="w-8 h-8" />
                <span>{enumLabel('tipoMovimento', 'entrada')}</span>
              </Button>
              <Button
                variant={tipo === 'transferencia' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => handleTipoChange('transferencia')}
              >
                <ArrowRightLeft className="w-8 h-8" />
                <span>{enumLabel('tipoMovimento', 'transferencia')}</span>
              </Button>
              <Button
                variant={tipo === 'saida' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => handleTipoChange('saida')}
              >
                <Package className="w-8 h-8" />
                <span>{enumLabel('tipoMovimento', 'saida')}</span>
              </Button>
            </div>
          )}

          {/* Step 2: Documento */}
          {step === 2 && (
            <div className="space-y-6">
              {tipo === 'entrada' && (
                <>
                  <div className="space-y-3">
                    <Label>{t('movements.origemMaterial.label')} <span className="text-destructive">*</span></Label>
                    <RadioGroup
                      value={origemMaterial}
                      onValueChange={(v) => {
                        const val = v as OrigemMaterial;
                        setOrigemMaterial(val);
                        if (val === 'producao_propria') {
                          setTipoDocumento('sem_documento');
                          setNumeroDocumento('');
                          setFornecedor('');
                        } else {
                          setTipoDocumento('guia_transporte');
                          setPedreiraOrigem('');
                        }
                      }}
                      className="grid gap-3 sm:grid-cols-2"
                    >
                      <div className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 ${origemMaterial === 'adquirido' ? 'ring-2 ring-primary' : ''}`}>
                        <RadioGroupItem value="adquirido" id="adquirido" />
                        <Label htmlFor="adquirido" className="cursor-pointer flex-1">
                          <span className="font-medium">{t('movements.origemMaterial.adquirido')}</span>
                          <p className="text-sm text-muted-foreground">{t('movements.origemMaterial.adquiridoDesc')}</p>
                        </Label>
                      </div>
                      <div className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 ${origemMaterial === 'producao_propria' ? 'ring-2 ring-primary' : ''}`}>
                        <RadioGroupItem value="producao_propria" id="producao_propria" />
                        <Label htmlFor="producao_propria" className="cursor-pointer flex-1">
                          <span className="font-medium">{t('movements.origemMaterial.producaoPropria')}</span>
                          <p className="text-sm text-muted-foreground">{t('movements.origemMaterial.producaoPrpriaDesc')}</p>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {origemMaterial === 'producao_propria' && (
                    <div className="space-y-2">
                      <Label>{t('movements.pedreiraOrigem.label')} <span className="text-destructive">*</span></Label>
                      <Select value={pedreiraOrigem} onValueChange={setPedreiraOrigem}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('movements.pedreiraOrigem.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {PEDREIRAS.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {t('movements.origemMaterial.semDocumento')}
                      </p>
                    </div>
                  )}

                  {origemMaterial === 'adquirido' && (
                    <>
                      <div className="space-y-2">
                        <Label>{t('movements.tipoDocumento')} <span className="text-destructive">*</span></Label>
                        <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as TipoDocumento)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="guia_transporte">{enumLabel('tipoDocumento', 'guia_transporte')}</SelectItem>
                            <SelectItem value="factura">{enumLabel('tipoDocumento', 'factura')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t('movements.numeroDocumento.label')} <span className="text-destructive">*</span></Label>
                        <Input
                          placeholder={t('movements.numeroDocumento.placeholder')}
                          value={numeroDocumento}
                          onChange={(e) => setNumeroDocumento(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t('movements.fornecedor.label')}</Label>
                        <Input
                          placeholder={t('movements.fornecedor.placeholder')}
                          value={fornecedor}
                          onChange={(e) => setFornecedor(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {(tipo === 'transferencia' || tipo === 'saida') && (
                <>
                  <div className="space-y-2">
                    <Label>{t('movements.tipoDocumento')} <span className="text-destructive">*</span></Label>
                    <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as TipoDocumento)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guia_transporte">{enumLabel('tipoDocumento', 'guia_transporte')}</SelectItem>
                        <SelectItem value="guia_transferencia">{enumLabel('tipoDocumento', 'guia_transferencia')}</SelectItem>
                        <SelectItem value="factura">{enumLabel('tipoDocumento', 'factura')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('movements.numeroDocumento.label')} <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder={t('movements.numeroDocumento.placeholder')}
                      value={numeroDocumento}
                      onChange={(e) => setNumeroDocumento(e.target.value)}
                    />
                    {!numeroDocumento.trim() && (
                      <p className="text-sm text-destructive">
                        {tipo === 'saida' ? t('movements.numeroDocumento.requiredSaida') : t('movements.numeroDocumento.required')}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Produto (entrada) */}
          {step === 3 && tipo === 'entrada' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>{t('movements.tipoProduto')} <span className="text-destructive">*</span></Label>
                <Select value={novoProdutoForma} onValueChange={(v) => setNovoProdutoForma(v as FormaProduto)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bloco">{enumLabel('tipoProduto', 'bloco')}</SelectItem>
                    <SelectItem value="chapa">{enumLabel('tipoProduto', 'chapa')}</SelectItem>
                    <SelectItem value="ladrilho">{enumLabel('tipoProduto', 'ladrilho')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('movements.idMM.label')} <span className="text-destructive">*</span></Label>
                <Input
                  value={novoProdutoIdMM}
                  onChange={(e) => setNovoProdutoIdMM(e.target.value)}
                  placeholder={t('movements.idMM.placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('movements.variedade.label')}</Label>
                <Input
                  value={novoProdutoVariedade}
                  onChange={(e) => setNovoProdutoVariedade(e.target.value)}
                  placeholder={t('movements.variedade.placeholder')}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {(novoProdutoForma === 'bloco' || novoProdutoForma === 'ladrilho') && (
                  <div className="space-y-2">
                    <Label>{t('movements.comprimento')}</Label>
                    <Input
                      type="number"
                      value={novoProdutoComprimento}
                      onChange={(e) => setNovoProdutoComprimento(e.target.value ? Number(e.target.value) : '')}
                      placeholder="cm"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{t('movements.largura')}</Label>
                  <Input
                    type="number"
                    value={novoProdutoLargura}
                    onChange={(e) => setNovoProdutoLargura(e.target.value ? Number(e.target.value) : '')}
                    placeholder="cm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('movements.altura')}</Label>
                  <Input
                    type="number"
                    value={novoProdutoAltura}
                    onChange={(e) => setNovoProdutoAltura(e.target.value ? Number(e.target.value) : '')}
                    placeholder="cm"
                  />
                </div>
                {novoProdutoForma === 'bloco' && (
                  <div className="space-y-2">
                    <Label>{t('movements.peso')}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={novoProdutoPeso}
                      onChange={(e) => setNovoProdutoPeso(e.target.value ? Number(e.target.value) : '')}
                      placeholder="kg"
                    />
                  </div>
                )}
                {novoProdutoForma === 'chapa' && (
                  <div className="space-y-2">
                    <Label>{t('movements.numChapas')}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={novoProdutoNumChapas}
                      onChange={(e) => setNovoProdutoNumChapas(e.target.value ? Number(e.target.value) : '')}
                      placeholder={t('movements.numChapasFill')}
                    />
                  </div>
                )}
                {novoProdutoForma === 'ladrilho' && (
                  <div className="space-y-2">
                    <Label>{t('movements.numPecas')}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={novoProdutoNumPecas}
                      onChange={(e) => setNovoProdutoNumPecas(e.target.value ? Number(e.target.value) : '')}
                      placeholder={t('movements.numPecasFill')}
                    />
                  </div>
                )}
              </div>

              {/* Photo upload fields */}
              {novoProdutoForma === 'bloco' && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">{t('movements.fotografias')}</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="space-y-1">
                        <Label className="text-sm">{t('movements.fotoN', { n })}</Label>
                        <PhotoUploadField
                          value={n === 1 ? blocoFoto1 : n === 2 ? blocoFoto2 : blocoFoto3}
                          onChange={n === 1 ? setBlocoFoto1 : n === 2 ? setBlocoFoto2 : setBlocoFoto3}
                          idMM={novoProdutoIdMM}
                          fileLabel={`foto${n}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {novoProdutoForma === 'chapa' && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">{t('movements.fotografiasPargas')}</Label>
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="space-y-2 border rounded-lg p-3">
                      <Label className="text-sm font-medium">{t('production.parga', { n })}</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{t('movements.fotoPrimeira')}</Label>
                          <PhotoUploadField
                            value={pargaFotos[n - 1].primeira}
                            onChange={(url) => {
                              const updated = [...pargaFotos];
                              updated[n - 1] = { ...updated[n - 1], primeira: url };
                              setPargaFotos(updated);
                            }}
                            idMM={novoProdutoIdMM}
                            fileLabel={`parga${n}_primeira`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{t('movements.fotoUltima')}</Label>
                          <PhotoUploadField
                            value={pargaFotos[n - 1].ultima}
                            onChange={(url) => {
                              const updated = [...pargaFotos];
                              updated[n - 1] = { ...updated[n - 1], ultima: url };
                              setPargaFotos(updated);
                            }}
                            idMM={novoProdutoIdMM}
                            fileLabel={`parga${n}_ultima`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {novoProdutoForma === 'ladrilho' && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">{t('movements.fotografias')}</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2].map((n) => (
                      <div key={n} className="space-y-1">
                        <Label className="text-sm">{t('movements.fotoN', { n })}</Label>
                        <PhotoUploadField
                          value={n === 1 ? ladrilhoFoto1 : ladrilhoFoto2}
                          onChange={n === 1 ? setLadrilhoFoto1 : setLadrilhoFoto2}
                          idMM={novoProdutoIdMM}
                          fileLabel={`foto${n}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t('movements.parqueDestino.label')} <span className="text-destructive">*</span></Label>
                <Select
                  value={novoProdutoParqueDestinoId}
                  onValueChange={setNovoProdutoParqueDestinoId}
                  disabled={!isAdmin && !!userLocal}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('movements.parqueDestino.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {locais?.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isAdmin && userLocal && (
                  <p className="text-sm text-muted-foreground">
                    {t('movements.parqueDestino.associado', { nome: userLocal.nome })}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('movements.quantidade')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                  className="text-lg font-semibold"
                />
              </div>
            </div>
          )}

          {/* Step 3: Produto (não entrada) */}
          {step === 3 && tipo !== 'entrada' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>{t('movements.searchProduto.label')}</Label>
                <Input
                  placeholder={t('movements.searchProduto.placeholder')}
                  value={searchProduto}
                  onChange={(e) => setSearchProduto(e.target.value)}
                />
              </div>

              {inventarioResults && inventarioResults.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('movements.selecionarProduto.label')}</Label>
                  <Select value={produtoId} onValueChange={(val) => {
                    setProdutoId(val);
                    const item = inventarioResults.find(r => r.id === val);
                    setSelectedItem(item || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('movements.selecionarProduto.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {inventarioResults.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          <span className="font-mono">{item.id_mm}</span>
                          <span className="ml-2 text-muted-foreground">
                            — {enumLabel('tipoProduto', item.tipo)}
                            {item.variedade ? ` (${item.variedade})` : ''}
                            {` — ${item.parque}`}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedItem && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('movements.idMM.label')}:</span>
                        <span className="font-mono font-medium">{selectedItem.id_mm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('movements.resumo.tipo')}</span>
                        <Badge variant="outline">
                          {enumLabel('tipoProduto', selectedItem.tipo)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('movements.parque')}:</span>
                        <span>{selectedItem.parque}</span>
                      </div>
                      {selectedItem.variedade && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('movements.variedade.label')}:</span>
                          <span>{selectedItem.variedade}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label>{t('movements.quantidade')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                  className="text-lg font-semibold"
                />
              </div>
            </div>
          )}

          {/* Step 4: Locais */}
          {step === 4 && (
            <div className="space-y-6">
              {tipo === 'transferencia' && (
                <>
                  <div className="space-y-2">
                    <Label>{t('movements.parqueOrigem.label')}</Label>
                    <Select
                      value={localOrigemId}
                      onValueChange={setLocalOrigemId}
                      disabled={!isAdmin && !!userLocal}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('movements.parqueOrigem.placeholderOrigem')} />
                      </SelectTrigger>
                      <SelectContent>
                        {locais?.map(l => (
                          <SelectItem key={l.id} value={l.id} disabled={l.id === localDestinoId}>
                            {l.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRightLeft className="w-6 h-6 text-muted-foreground" />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('movements.parqueDestino.label')}</Label>
                    <Select value={localDestinoId} onValueChange={setLocalDestinoId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('movements.parqueOrigem.placeholderDestino')} />
                      </SelectTrigger>
                      <SelectContent>
                        {locais?.map(l => (
                          <SelectItem key={l.id} value={l.id} disabled={l.id === localOrigemId}>
                            {l.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {stockDisponivel !== undefined && localOrigemId && (
                    <Alert variant={isStockInsuficiente() ? 'destructive' : 'default'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('movements.stockDisponivelOrigem', { n: stockDisponivel })}
                        {isStockInsuficiente() && ` ${t('movements.stockInsuficiente')}`}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {tipo === 'saida' && (
                <>
                  <div className="space-y-2">
                    <Label>{t('movements.parqueOrigem.label')}</Label>
                    <Select
                      value={localOrigemId}
                      onValueChange={setLocalOrigemId}
                      disabled={!isAdmin && !!userLocal}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('movements.parqueOrigem.placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {locais?.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {stockDisponivel !== undefined && localOrigemId && (
                    <Alert variant={isStockInsuficiente() ? 'destructive' : 'default'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('movements.stockDisponivel', { n: stockDisponivel })}
                        {isStockInsuficiente() && ` ${t('movements.stockInsuficiente')}`}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>{t('movements.cliente.label')} <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder={t('movements.cliente.placeholder')}
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                    />
                    {!clienteNome.trim() && (
                      <p className="text-sm text-destructive">{t('movements.cliente.required')}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 5: Transporte */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>{t('movements.matricula.label')}</Label>
                <Input
                  placeholder={t('movements.matricula.placeholder')}
                  value={matriculaViatura}
                  onChange={(e) => setMatriculaViatura(e.target.value.toUpperCase())}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('movements.observacoes.label')}</Label>
                <Textarea
                  placeholder={t('movements.observacoes.placeholder')}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 6: Confirmação */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="bg-muted rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-lg">{t('movements.resumo.title')}</h3>

                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{t('movements.resumo.tipo')}</span>
                    <Badge variant={tipo === 'entrada' ? 'default' : tipo === 'saida' ? 'secondary' : 'outline'}>
                      {enumLabel('tipoMovimento', tipo)}
                    </Badge>
                  </div>

                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{t('movements.resumo.produto')}</span>
                    <span className="font-mono font-medium">
                      {tipo === 'entrada' ? `${novoProdutoIdMM} (${formaLabel(novoProdutoForma)})` : selectedItem?.id_mm}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{t('movements.resumo.quantidade')}</span>
                    <span className="font-semibold">{quantidade}</span>
                  </div>

                  {tipo === 'entrada' && (
                    <>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">{t('movements.resumo.origemMaterial')}</span>
                        <span>{origemMaterial === 'adquirido' ? t('movements.origemMaterial.adquirido') : t('movements.origemMaterial.producaoPropria')}</span>
                      </div>
                      {origemMaterial === 'producao_propria' && pedreiraOrigem && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">{t('movements.resumo.pedreira')}</span>
                          <span>{pedreiraOrigem}</span>
                        </div>
                      )}
                      {origemMaterial === 'adquirido' && fornecedor && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">{t('movements.resumo.fornecedor')}</span>
                          <span>{fornecedor}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">{t('movements.resumo.destino')}</span>
                        <span>{selectedLocalDestino?.nome}</span>
                      </div>
                    </>
                  )}

                  {tipo === 'transferencia' && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{t('movements.resumo.percurso')}</span>
                      <span>{selectedLocalOrigem?.nome} → {selectedLocalDestino?.nome}</span>
                    </div>
                  )}

                  {tipo === 'saida' && (
                    <>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">{t('movements.resumo.origem')}</span>
                        <span>{selectedLocalOrigem?.nome}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">{t('movements.resumo.cliente')}</span>
                        <span>{clienteNome}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{t('movements.resumo.documento')}</span>
                    <span>
                      {enumLabel('tipoDocumento', tipoDocumento)}
                      {numeroDocumento && ` (${numeroDocumento})`}
                    </span>
                  </div>

                  {matriculaViatura && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{t('movements.resumo.matricula')}</span>
                      <span>{matriculaViatura}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Impacto no Stock */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{t('movements.resumo.stockImpacto')}</strong>
                  {tipo === 'entrada' && ` +${quantidade} em ${selectedLocalDestino?.nome}`}
                  {tipo === 'saida' && ` -${quantidade} em ${selectedLocalOrigem?.nome}`}
                  {tipo === 'transferencia' && ` -${quantidade} em ${selectedLocalOrigem?.nome}, +${quantidade} em ${selectedLocalDestino?.nome}`}
                </AlertDescription>
              </Alert>

              {isStockInsuficiente() && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('movements.stockInsuficienteAlert', { n: stockDisponivel })}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={step === 1 ? () => navigate(-1) : prevStep}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? t('movements.botaoCancelar') : t('actions.previous')}
        </Button>

        {step < 6 ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="gap-2"
          >
            {t('movements.botaoSeguinte')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isStockInsuficiente()}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('movements.botaoRegistar')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {t('movements.botaoConfirmar')}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
