import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileDown,
  Info,
  Package,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAppT } from '@/hooks/useAppT';
import { useParseExcel, useExecutarImportacao, type LinhaExcel, type LinhaExcelBlocos, type LinhaExcelChapas, type LinhaExcelLadrilhos, type ResultadoImportacao } from '@/hooks/useImportarExcel';
import { gerarModeloExcel, type TipoImportacao } from '@/lib/excelTemplateGenerator';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

type Step = 'upload' | 'preview' | 'confirmar' | 'resultado';

export default function ImportarInventario() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useAppT();
  
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  
  const { linhas, isLoading: isParsing, erro: parseErro, parseFile, limpar } = useParseExcel();
  const executarImportacao = useExecutarImportacao();

  const STEPS: { id: Step; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'upload', label: t('import.steps.upload'), icon: Upload },
    { id: 'preview', label: t('import.steps.preview'), icon: FileSpreadsheet },
    { id: 'confirmar', label: t('import.steps.confirmar'), icon: CheckCircle2 },
    { id: 'resultado', label: t('import.steps.resultado'), icon: Package },
  ];

  // Estatísticas das linhas
  const stats = {
    total: linhas.length,
    validas: linhas.filter(l => l.erros.length === 0).length,
    comErros: linhas.filter(l => l.erros.length > 0).length,
    comAvisos: linhas.filter(l => l.avisos.length > 0 && l.erros.length === 0).length,
    produtosNovos: linhas.filter(l => !l.produtoExiste && l.erros.length === 0).length,
    movimentosNovos: linhas.filter(l => l.erros.length === 0).length,
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast({
        title: t('import.ficheiroInvalido'),
        description: t('import.ficheiroInvalidoDesc'),
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    await parseFile(selectedFile);
    setStep('preview');
  }, [parseFile, toast, t]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      await parseFile(droppedFile);
      setStep('preview');
    }
  }, [parseFile]);

  const handleDownloadTemplate = () => {
    try {
      gerarModeloExcel({ incluirExemplos: true, tipo: 'blocos' });
      toast({
        title: t('import.modeloDescarregado'),
        description: t('import.modeloDescarregadoDesc'),
      });
    } catch (err) {
      console.error('Erro ao gerar modelo Excel:', err);
      const msg = err instanceof Error ? err.message : t('errors.unexpectedError');
      toast({
        title: t('toasts.errorTitle'),
        description: t('errors.generateTemplate', { msg }),
        variant: 'destructive',
      });
    }
  };

  const handleConfirmar = async () => {
    try {
      const result = await executarImportacao.mutateAsync({ linhas, tipo: 'blocos' });
      setResultado(result);
      setStep('resultado');
      toast({
        title: t('import.importacaoConcluida'),
        description: t('import.importacaoConcluidaDesc', { produtos: result.produtosCriados, movimentos: result.movimentosCriados }),
      });
    } catch (error) {
      toast({
        title: t('import.erroImportacao'),
        description: error instanceof Error ? error.message : t('errors.unexpectedError'),
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultado(null);
    limpar();
    setStep('upload');
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/superadmin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('import.inventarioPageTitle')}</h1>
            <p className="text-muted-foreground">{t('import.inventarioPageSubtitle')}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
          <FileDown className="w-4 h-4" />
          <span className="hidden sm:inline">{t('import.modeloExcel')}</span>
        </Button>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isCompleted = idx < currentStepIndex;
              const isCurrent = s.id === step;
              
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isCompleted && "bg-primary text-primary-foreground",
                      isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm mt-2 font-medium",
                      (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-4",
                      idx < currentStepIndex ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {step === 'upload' && (
        <StepUpload 
          onFileChange={handleFileChange}
          onDrop={handleDrop}
          isParsing={isParsing}
          parseErro={parseErro}
        />
      )}

      {step === 'preview' && (
        <StepPreview 
          linhas={linhas}
          stats={stats}
          file={file}
          onBack={handleReset}
          onNext={() => setStep('confirmar')}
          isParsing={isParsing}
        />
      )}

      {step === 'confirmar' && (
        <StepConfirmar 
          stats={stats}
          onBack={() => setStep('preview')}
          onConfirm={handleConfirmar}
          isProcessing={executarImportacao.isPending}
        />
      )}

      {step === 'resultado' && resultado && (
        <StepResultado 
          resultado={resultado}
          onReset={handleReset}
          onGoToStock={() => navigate('/stock')}
        />
      )}
    </div>
  );
}

// === Step Components ===

interface StepUploadProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  isParsing: boolean;
  parseErro: string | null;
}

function StepUpload({ onFileChange, onDrop, isParsing, parseErro }: StepUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const t = useAppT();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('import.carregarFicheiroTitle')}</CardTitle>
        <CardDescription>
          {t('import.carregarFicheiroDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            isParsing && "opacity-50 pointer-events-none"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { setIsDragOver(false); onDrop(e); }}
        >
          {isParsing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg font-medium">{t('import.processando')}</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {t('import.arrastarFicheiro')}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {t('import.cliqueSelecionar')}
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={onFileChange}
                className="hidden"
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  {t('import.selecionarFicheiro')}
                </label>
              </Button>
            </>
          )}
        </div>

        {parseErro && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('import.erroProcesarFicheiro')}</AlertTitle>
            <AlertDescription>{parseErro}</AlertDescription>
          </Alert>
        )}

        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertTitle>{t('import.estruturaEsperada')}</AlertTitle>
          <AlertDescription>
            {t('import.estruturaDesc')}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

interface StepPreviewProps {
  linhas: LinhaExcel[];
  stats: {
    total: number;
    validas: number;
    comErros: number;
    comAvisos: number;
    produtosNovos: number;
    movimentosNovos: number;
  };
  file: File | null;
  onBack: () => void;
  onNext: () => void;
  isParsing: boolean;
}

function StepPreview({ linhas, stats, file, onBack, onNext, isParsing }: StepPreviewProps) {
  const [filtro, setFiltro] = useState<'todas' | 'validas' | 'erros' | 'avisos'>('todas');
  const t = useAppT();

  const linhasFiltradas = linhas.filter(l => {
    if (filtro === 'validas') return l.erros.length === 0;
    if (filtro === 'erros') return l.erros.length > 0;
    if (filtro === 'avisos') return l.avisos.length > 0 && l.erros.length === 0;
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{t('import.previewTitle')}</CardTitle>
            <CardDescription>
              {file?.name} • {t('import.linhasEncontradas', { n: stats.total })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('import.statsTotal')}</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </Card>
          <Card className="p-4 border-primary/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">{t('import.statsValidas')}</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-primary">{stats.validas}</p>
          </Card>
          <Card className="p-4 border-destructive/50">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm text-muted-foreground">{t('import.statsComErros')}</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-destructive">{stats.comErros}</p>
          </Card>
          <Card className="p-4 border-accent/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent-foreground" />
              <span className="text-sm text-muted-foreground">{t('import.statsAvisos')}</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-accent-foreground">{stats.comAvisos}</p>
          </Card>
        </div>

        {/* Filtro Tabs */}
        <Tabs value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
          <TabsList>
            <TabsTrigger value="todas">{t('import.tabTodasN', { n: stats.total })}</TabsTrigger>
            <TabsTrigger value="validas">{t('import.tabValidasN', { n: stats.validas })}</TabsTrigger>
            <TabsTrigger value="erros">{t('import.tabErrosN', { n: stats.comErros })}</TabsTrigger>
            <TabsTrigger value="avisos">{t('import.tabAvisosN', { n: stats.comAvisos })}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tabela de Linhas */}
        <ScrollArea className="h-[400px] border rounded-lg">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-16">{t('import.colLinha')}</TableHead>
                <TableHead>{t('import.colIdmm')}</TableHead>
                <TableHead>{t('import.colVariedade')}</TableHead>
                <TableHead>{t('import.colForma')}</TableHead>
                <TableHead>{t('import.colParqueMM')}</TableHead>
                <TableHead className="w-16 text-center">{t('import.colQtd')}</TableHead>
                <TableHead>{t('import.colEstado')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhasFiltradas.map((linha) => (
                <TableRow 
                  key={linha.rowIndex}
                  className={cn(
                    linha.erros.length > 0 && "bg-destructive/10",
                    linha.avisos.length > 0 && linha.erros.length === 0 && "bg-accent/10"
                  )}
                >
                  <TableCell className="font-mono text-muted-foreground">
                    {linha.rowIndex}
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {linha.idmm}
                  </TableCell>
                  <TableCell>{linha.variedade}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{linha.forma}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-sm">{linha.parqueMM}</span>
                      {linha.linha && (
                        <span className="text-muted-foreground text-xs">({linha.linha})</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{(linha as LinhaExcelBlocos).quantidade ?? (linha as LinhaExcelChapas).quantidadeTotal ?? '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {linha.erros.length > 0 ? (
                        linha.erros.map((erro, i) => (
                          <div key={i} className="flex items-center gap-1 text-sm text-destructive">
                            <XCircle className="w-3 h-3 flex-shrink-0" />
                            <span>{erro}</span>
                          </div>
                        ))
                      ) : linha.avisos.length > 0 ? (
                        linha.avisos.map((aviso, i) => (
                          <div key={i} className="flex items-center gap-1 text-sm text-accent-foreground">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span>{aviso}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-primary">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>OK</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {stats.comErros > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('import.linhasComErros', { n: stats.comErros })}</AlertTitle>
            <AlertDescription>
              {t('import.linhasErrosDesc')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('actions.back')}
        </Button>
        <Button 
          onClick={onNext} 
          disabled={stats.validas === 0 || isParsing}
        >
          {t('import.continuar')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}

interface StepConfirmarProps {
  stats: {
    total: number;
    validas: number;
    comErros: number;
    produtosNovos: number;
    movimentosNovos: number;
  };
  onBack: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

function StepConfirmar({ stats, onBack, onConfirm, isProcessing }: StepConfirmarProps) {
  const t = useAppT();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('import.confirmarTitle')}</CardTitle>
        <CardDescription>
          {t('import.confirmarDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg">{t('import.resumoImportacao')}</h3>
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('import.linhasTotais')}</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('import.linhasValidas')}</span>
              <span className="font-medium text-primary">{stats.validas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('import.linhasIgnoradas')}</span>
              <span className="font-medium text-destructive">{stats.comErros}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('import.novosProdutos')}</span>
              <span className="font-medium">{stats.produtosNovos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('import.movimentosEntrada')}</span>
              <span className="font-medium">{stats.movimentosNovos}</span>
            </div>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t('import.acaoIrreversivel')}</AlertTitle>
          <AlertDescription>
            {t('import.acaoDesc')}
          </AlertDescription>
        </Alert>

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('import.processingImport')}
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('actions.back')}
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={isProcessing}
          variant="default"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('import.aImportar')}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t('import.confirmarImportacao')}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface StepResultadoProps {
  resultado: ResultadoImportacao;
  onReset: () => void;
  onGoToStock: () => void;
}

function StepResultado({ resultado, onReset, onGoToStock }: StepResultadoProps) {
  const t = useAppT();
  const numErros = resultado.erros?.length || 0;
  const sucesso = numErros === 0;
  const hasErrors = numErros > 0;

  return (
    <Card>
      <CardHeader className="text-center">
        {sucesso ? (
          <CheckCircle2 className="w-16 h-16 mx-auto text-primary mb-4" />
        ) : (
          <AlertTriangle className="w-16 h-16 mx-auto text-accent-foreground mb-4" />
        )}
        <CardTitle className="text-2xl">
          {sucesso ? t('import.resultadoConcluida') : t('import.resultadoConcluidaAvisos')}
        </CardTitle>
        <CardDescription>
          {formatDateTime(new Date(resultado.dataHora))}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-background rounded-lg">
              <p className="text-3xl font-bold text-primary">{resultado.produtosCriados}</p>
              <p className="text-sm text-muted-foreground">{t('import.resultadoProdutosCriados')}</p>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <p className="text-3xl font-bold text-primary">{resultado.movimentosCriados}</p>
              <p className="text-sm text-muted-foreground">{t('import.resultadoMovimentosRegistados')}</p>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <p className="text-3xl font-bold">{resultado.linhasProcessadas}</p>
              <p className="text-sm text-muted-foreground">{t('import.resultadoLinhasProcessadas')}</p>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <p className={cn(
                "text-3xl font-bold",
                hasErrors ? "text-destructive" : "text-primary"
              )}>
                {numErros}
              </p>
              <p className="text-sm text-muted-foreground">{t('import.resultadoErros')}</p>
            </div>
          </div>
        </div>

        {hasErrors && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('import.linhasFalharam')}</AlertTitle>
            <AlertDescription className="space-y-1">
              <p>{t('import.linhasNaoProcessadas', { n: numErros })}</p>
              <ul className="list-disc list-inside text-sm mt-2">
                {resultado.erros.slice(0, 5).map((e, i) => (
                  <li key={i}>{t('import.linhaErro', { n: e.linha, erro: e.erro })}</li>
                ))}
                {numErros > 5 && <li>{t('import.maisErros', { n: numErros - 5 })}</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Button variant="outline" onClick={onReset}>
          <Upload className="w-4 h-4 mr-2" />
          {t('import.novaImportacao')}
        </Button>
        <Button onClick={onGoToStock}>
          <Package className="w-4 h-4 mr-2" />
          {t('import.verStock')}
        </Button>
      </CardFooter>
    </Card>
  );
}
