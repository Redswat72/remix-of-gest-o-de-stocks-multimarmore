import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmpresa } from '@/context/EmpresaContext';
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
import { useProdutos } from '@/hooks/useProdutos';
import { useClientes } from '@/hooks/useClientes';
import { useLocaisAtivos } from '@/hooks/useLocais';
import { useStockProdutoLocal } from '@/hooks/useStock';
import { useCreateMovimento } from '@/hooks/useMovimentos';
import type { TipoMovimento, TipoDocumento, OrigemMaterial, MovimentoFormData } from '@/types/database';

const STEPS = [
  { id: 1, title: 'Tipo', description: 'Tipo de movimento' },
  { id: 2, title: 'Documento', description: 'Informação documental' },
  { id: 3, title: 'Produto', description: 'Produto e quantidade' },
  { id: 4, title: 'Locais', description: 'Origem e destino' },
  { id: 5, title: 'Transporte', description: 'Dados de transporte' },
  { id: 6, title: 'Confirmação', description: 'Rever e confirmar' },
];

const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'guia_transporte', label: 'Guia de Transporte' },
  { value: 'guia_transferencia', label: 'Guia de Transferência' },
  { value: 'factura', label: 'Fatura' },
  { value: 'sem_documento', label: 'Sem Documento' },
];

export default function NovoMovimento() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { empresaConfig } = useEmpresa();
  const { user, userLocal, isAdmin } = useAuth();
  const createMovimento = useCreateMovimento();

  const [step, setStep] = useState(1);
  
  // Form state
  const [tipo, setTipo] = useState<TipoMovimento | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('sem_documento');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [origemMaterial, setOrigemMaterial] = useState<OrigemMaterial>('adquirido');
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [localOrigemId, setLocalOrigemId] = useState('');
  const [localDestinoId, setLocalDestinoId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [matriculaViatura, setMatriculaViatura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [searchProduto, setSearchProduto] = useState('');

  // Data queries
  const { data: produtos } = useProdutos({ idmm: searchProduto || undefined });
  const { data: clientes } = useClientes();
  const { data: locais } = useLocaisAtivos();
  
  // Stock validation
  const { data: stockDisponivel } = useStockProdutoLocal(
    produtoId,
    tipo === 'entrada' ? undefined : localOrigemId
  );

  const selectedProduto = produtos?.find(p => p.id === produtoId);
  const selectedLocalOrigem = locais?.find(l => l.id === localOrigemId);
  const selectedLocalDestino = locais?.find(l => l.id === localDestinoId);
  const selectedCliente = clientes?.find(c => c.id === clienteId);

  // Validações por step
  // Validação para entradas: se material adquirido (não MM), exige documento
  const isDocumentoObrigatorioEntrada = tipo === 'entrada' && origemMaterial === 'adquirido';

  // Validações por step
  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!tipo;
      case 2:
        // Transferência e saída: documento obrigatório
        if (tipo === 'transferencia' || tipo === 'saida') {
          if (tipoDocumento === 'sem_documento') return false;
          // Número do documento também obrigatório
          if (!numeroDocumento.trim()) return false;
          return true;
        }
        // Entrada: origem_material sempre obrigatória
        if (tipo === 'entrada') {
          if (!origemMaterial) return false;
          // Se adquirido, exige documento e número
          if (origemMaterial === 'adquirido') {
            if (tipoDocumento === 'sem_documento') return false;
            if (!numeroDocumento.trim()) return false;
          }
          return true;
        }
        return true;
      case 3:
        return !!produtoId && quantidade > 0;
      case 4:
        if (tipo === 'entrada') {
          return !!localDestinoId;
        }
        if (tipo === 'transferencia') {
          return !!localOrigemId && !!localDestinoId && localOrigemId !== localDestinoId;
        }
        if (tipo === 'saida') {
          return !!localOrigemId && !!clienteId;
        }
        return false;
      case 5:
        return true; // Transporte é opcional
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
    if (canProceed() && step < 6) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!tipo || !produtoId || !user) return;

    if (isStockInsuficiente()) {
      toast({
        title: 'Stock insuficiente',
        description: `Não há stock suficiente para esta operação. Disponível: ${stockDisponivel}`,
        variant: 'destructive',
      });
      return;
    }

    const formData: MovimentoFormData = {
      tipo,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento || undefined,
      origem_material: tipo === 'entrada' ? origemMaterial : undefined,
      produto_id: produtoId,
      quantidade,
      local_origem_id: tipo !== 'entrada' ? localOrigemId : undefined,
      local_destino_id: tipo !== 'saida' ? localDestinoId : undefined,
      cliente_id: tipo === 'saida' ? clienteId : undefined,
      matricula_viatura: matriculaViatura || undefined,
      observacoes: observacoes || undefined,
    };

    try {
      await createMovimento.mutateAsync(formData);
      toast({
        title: 'Movimento registado!',
        description: 'O movimento foi registado com sucesso e o stock foi atualizado.',
      });
      navigate('/historico');
    } catch (error) {
      toast({
        title: 'Erro ao registar movimento',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    }
  };

  // Quando o tipo muda, redefinir locais
  const handleTipoChange = (newTipo: TipoMovimento) => {
    setTipo(newTipo);
    setLocalOrigemId('');
    setLocalDestinoId('');
    setClienteId('');
    
    // Definir local por defeito após mudança de tipo
    setTimeout(() => {
      if (userLocal && !isAdmin) {
        if (newTipo === 'entrada') {
          setLocalDestinoId(userLocal.id);
        } else {
          setLocalOrigemId(userLocal.id);
        }
      }
    }, 0);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Registar Movimento</h1>
        <p className="text-muted-foreground">Preencha os dados do movimento passo a passo</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {STEPS.map((s, index) => (
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
            {index < STEPS.length - 1 && (
              <div className={`w-8 sm:w-16 h-1 mx-2 rounded ${step > s.id ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
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
                <span>Entrada</span>
              </Button>
              <Button
                variant={tipo === 'transferencia' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => handleTipoChange('transferencia')}
              >
                <ArrowRightLeft className="w-8 h-8" />
                <span>Transferência</span>
              </Button>
              <Button
                variant={tipo === 'saida' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => handleTipoChange('saida')}
              >
                <Package className="w-8 h-8" />
                <span>Saída</span>
              </Button>
            </div>
          )}

          {/* Step 2: Documento */}
          {step === 2 && (
            <div className="space-y-6">
              {tipo === 'entrada' && (
                <div className="space-y-3">
                  <Label>Origem do Material <span className="text-destructive">*</span></Label>
                  <RadioGroup 
                    value={origemMaterial} 
                    onValueChange={(v) => {
                      setOrigemMaterial(v as OrigemMaterial);
                      // Se produção própria, pode ser sem documento
                      if (v === 'producao_propria') {
                        setTipoDocumento('sem_documento');
                        setNumeroDocumento('');
                      }
                    }}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <div className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 ${origemMaterial === 'adquirido' ? 'ring-2 ring-primary' : ''}`}>
                      <RadioGroupItem value="adquirido" id="adquirido" />
                      <Label htmlFor="adquirido" className="cursor-pointer flex-1">
                        <span className="font-medium">Adquirido</span>
                        <p className="text-sm text-muted-foreground">Material comprado a fornecedor</p>
                      </Label>
                    </div>
                    <div className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 ${origemMaterial === 'producao_propria' ? 'ring-2 ring-primary' : ''}`}>
                      <RadioGroupItem value="producao_propria" id="producao_propria" />
                      <Label htmlFor="producao_propria" className="cursor-pointer flex-1">
                        <span className="font-medium">Produção Própria ({empresaConfig?.idPrefix ?? 'MM'})</span>
                        <p className="text-sm text-muted-foreground">Material produzido internamente</p>
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-sm text-muted-foreground">
                    A origem do material é obrigatória para entradas
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Label>
                  Tipo de Documento 
                  {(tipo === 'transferencia' || tipo === 'saida' || isDocumentoObrigatorioEntrada) && (
                    <span className="text-destructive"> *</span>
                  )}
                </Label>
                <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as TipoDocumento)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map(td => (
                      <SelectItem 
                        key={td.value} 
                        value={td.value}
                        disabled={
                          ((tipo === 'transferencia' || tipo === 'saida' || isDocumentoObrigatorioEntrada) && 
                          td.value === 'sem_documento')
                        }
                      >
                        {td.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(tipo === 'transferencia' || tipo === 'saida') && (
                  <p className="text-sm text-muted-foreground">
                    Documento obrigatório para {tipo === 'transferencia' ? 'transferências' : 'saídas'}
                  </p>
                )}
                {isDocumentoObrigatorioEntrada && (
                  <p className="text-sm text-muted-foreground">
                    Documento obrigatório para material adquirido
                  </p>
                )}
                {tipo === 'entrada' && origemMaterial === 'producao_propria' && (
                  <p className="text-sm text-muted-foreground">
                    Documento opcional para produção própria
                  </p>
                )}
              </div>

              {(tipoDocumento !== 'sem_documento' || isDocumentoObrigatorioEntrada || tipo === 'transferencia' || tipo === 'saida') && tipoDocumento !== 'sem_documento' && (
                <div className="space-y-2">
                  <Label>Número do Documento <span className="text-destructive">*</span></Label>
                  <Input 
                    placeholder="Ex: GT-2024/0001"
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                  />
                  {!numeroDocumento.trim() && (
                    <p className="text-sm text-destructive">
                      Número do documento é obrigatório
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Produto */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Pesquisar Produto ({empresaConfig?.idPrefix ?? 'IDMM'})</Label>
                <Input 
                  placeholder={`Digite o ${empresaConfig?.idPrefix ?? 'IDMM'} para pesquisar...`}
                  value={searchProduto}
                  onChange={(e) => setSearchProduto(e.target.value)}
                />
              </div>

              {produtos && produtos.length > 0 && (
                <div className="space-y-2">
                  <Label>Selecionar Produto</Label>
                  <Select value={produtoId} onValueChange={setProdutoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="font-mono">{p.idmm}</span>
                          <span className="ml-2 text-muted-foreground">
                            - {p.tipo_pedra} ({p.forma})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedProduto && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IDMM:</span>
                        <span className="font-mono font-medium">{selectedProduto.idmm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span>{selectedProduto.tipo_pedra}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Forma:</span>
                        <Badge variant="outline">{selectedProduto.forma}</Badge>
                      </div>
                      {selectedProduto.nome_comercial && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nome:</span>
                          <span>{selectedProduto.nome_comercial}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label>Quantidade</Label>
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
              {tipo === 'entrada' && (
                <div className="space-y-2">
                  <Label>Parque de Destino</Label>
                  <Select 
                    value={localDestinoId} 
                    onValueChange={setLocalDestinoId}
                    disabled={!isAdmin && !!userLocal}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o parque" />
                    </SelectTrigger>
                    <SelectContent>
                      {locais?.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isAdmin && userLocal && (
                    <p className="text-sm text-muted-foreground">
                      Está associado ao parque: {userLocal.nome}
                    </p>
                  )}
                </div>
              )}

              {tipo === 'transferencia' && (
                <>
                  <div className="space-y-2">
                    <Label>Parque de Origem</Label>
                    <Select 
                      value={localOrigemId} 
                      onValueChange={setLocalOrigemId}
                      disabled={!isAdmin && !!userLocal}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o parque de origem" />
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
                    <Label>Parque de Destino</Label>
                    <Select 
                      value={localDestinoId} 
                      onValueChange={setLocalDestinoId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o parque de destino" />
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
                        Stock disponível na origem: <strong>{stockDisponivel}</strong> unidades
                        {isStockInsuficiente() && ' (insuficiente)'}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {tipo === 'saida' && (
                <>
                  <div className="space-y-2">
                    <Label>Parque de Origem</Label>
                    <Select 
                      value={localOrigemId} 
                      onValueChange={setLocalOrigemId}
                      disabled={!isAdmin && !!userLocal}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o parque" />
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
                        Stock disponível: <strong>{stockDisponivel}</strong> unidades
                        {isStockInsuficiente() && ' (insuficiente)'}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={clienteId} onValueChange={setClienteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 5: Transporte */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Matrícula da Viatura (opcional)</Label>
                <Input 
                  placeholder="Ex: 00-AA-00"
                  value={matriculaViatura}
                  onChange={(e) => setMatriculaViatura(e.target.value.toUpperCase())}
                />
              </div>

              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea 
                  placeholder="Notas adicionais sobre o movimento..."
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
                <h3 className="font-semibold text-lg">Resumo do Movimento</h3>
                
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Tipo:</span>
                    <Badge variant={tipo === 'entrada' ? 'default' : tipo === 'saida' ? 'secondary' : 'outline'}>
                      {tipo === 'entrada' ? 'Entrada' : tipo === 'saida' ? 'Saída' : 'Transferência'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Produto:</span>
                    <span className="font-mono font-medium">{selectedProduto?.idmm}</span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Quantidade:</span>
                    <span className="font-semibold">{quantidade}</span>
                  </div>
                  
                  {tipo === 'entrada' && (
                    <>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Origem Material:</span>
                        <span>{origemMaterial === 'adquirido' ? 'Adquirido' : 'Produção Própria'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Destino:</span>
                        <span>{selectedLocalDestino?.nome}</span>
                      </div>
                    </>
                  )}
                  
                  {tipo === 'transferencia' && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Percurso:</span>
                      <span>{selectedLocalOrigem?.nome} → {selectedLocalDestino?.nome}</span>
                    </div>
                  )}
                  
                  {tipo === 'saida' && (
                    <>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Origem:</span>
                        <span>{selectedLocalOrigem?.nome}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Cliente:</span>
                        <span>{selectedCliente?.nome}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Documento:</span>
                    <span>
                      {TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label}
                      {numeroDocumento && ` (${numeroDocumento})`}
                    </span>
                  </div>
                  
                  {matriculaViatura && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Matrícula:</span>
                      <span>{matriculaViatura}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Impacto no Stock */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Impacto no stock:</strong>
                  {tipo === 'entrada' && ` +${quantidade} em ${selectedLocalDestino?.nome}`}
                  {tipo === 'saida' && ` -${quantidade} em ${selectedLocalOrigem?.nome}`}
                  {tipo === 'transferencia' && ` -${quantidade} em ${selectedLocalOrigem?.nome}, +${quantidade} em ${selectedLocalDestino?.nome}`}
                </AlertDescription>
              </Alert>

              {isStockInsuficiente() && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Stock insuficiente! Disponível: {stockDisponivel}
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
          {step === 1 ? 'Cancelar' : 'Anterior'}
        </Button>

        {step < 6 ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="gap-2"
          >
            Seguinte
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createMovimento.isPending || isStockInsuficiente()}
            className="gap-2"
          >
            {createMovimento.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                A registar...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirmar Movimento
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
