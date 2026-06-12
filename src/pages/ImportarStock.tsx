import { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Download,
  Info,
  Trash2,
  Box,
  Layers,
  Grid3X3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAppT } from '@/hooks/useAppT';
import { useParseExcel, useExecutarImportacao, LinhaExcel, LinhaExcelBlocos, LinhaExcelChapas, LinhaExcelLadrilhos, ResultadoImportacao } from '@/hooks/useImportarExcel';
import { gerarModeloExcel, TipoImportacao } from '@/lib/excelTemplateGenerator';
import { cn } from '@/lib/utils';

export default function ImportarStock() {
  const t = useAppT();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { linhas, isLoading: isParsing, erro: parseErro, tipoAtual, parseFile, limpar } = useParseExcel();
  const executarImportacao = useExecutarImportacao();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoImportacao | null>(null);

  // Estatísticas
  const linhasValidas = linhas.filter(l => l.erros.length === 0);
  const linhasComErros = linhas.filter(l => l.erros.length > 0);
  const produtosNovos = linhas.filter(l => !l.produtoExiste && l.erros.length === 0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!tipoSelecionado) {
      toast({
        title: t('import.tipoNaoSelecionado'),
        description: t('import.tipoNaoSelecionadoDesc'),
        variant: 'destructive',
      });
      return;
    }

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        title: t('import.ficheiroInvalido'),
        description: t('import.ficheiroInvalidoDesc'),
        variant: 'destructive',
      });
      return;
    }

    parseFile(file, tipoSelecionado);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!tipoSelecionado) {
      toast({
        title: t('import.tipoNaoSelecionado'),
        description: t('import.tipoNaoSelecionadoDropDesc'),
        variant: 'destructive',
      });
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleConfirmImport = async () => {
    if (!tipoSelecionado) return;
    
    try {
      const result = await executarImportacao.mutateAsync({ linhas, tipo: tipoSelecionado });
      setResultado(result);
      setConfirmOpen(false);
      toast({
        title: t('import.importacaoConcluida'),
        description: t('import.movimentosCriadosDesc', { n: result.movimentosCriados }),
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
    limpar();
    setResultado(null);
    setTipoSelecionado(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadModelo = (tipo: TipoImportacao) => {
    try {
      gerarModeloExcel({ incluirExemplos: true, tipo });
      toast({
        title: t('import.modeloTransferido'),
        description: t('import.modeloTransferidoDesc', { tipo }),
      });
    } catch (err) {
      console.error('Erro ao gerar modelo Excel:', err);
      const msg = err instanceof Error ? err.message : t('errors.unknown');
      toast({
        title: t('errors.title'),
        description: t('errors.generateTemplate', { msg }),
        variant: 'destructive',
      });
    }
  };

  const tiposImportacao: Array<{ id: TipoImportacao; nome: string; descricao: string; icon: React.ElementType }> = [
    { id: 'blocos', nome: t('import.blocos.nome'), descricao: t('import.blocos.desc'), icon: Box },
    { id: 'chapas', nome: t('import.chapas.nome'), descricao: t('import.chapas.desc'), icon: Layers },
    { id: 'ladrilhos', nome: t('import.ladrilhos.nome'), descricao: t('import.ladrilhos.desc'), icon: Grid3X3 },
  ];

  // Renderizar dimensões com base no tipo
  const renderDimensoes = (linha: LinhaExcel) => {
    if (tipoAtual === 'chapas') {
      const chapa = linha as LinhaExcelChapas;
      const pargasAtivas = chapa.pargas.filter(p => p.quantidade && p.quantidade > 0);
      if (pargasAtivas.length === 0) return '-';
      const primeira = pargasAtivas[0];
      return `${primeira.comprimento || '-'} × ${primeira.altura || '-'} × ${primeira.espessura || '-'}`;
    } else if (tipoAtual === 'ladrilhos') {
      const ladrilho = linha as LinhaExcelLadrilhos;
      return `${ladrilho.comprimento || '-'} × ${ladrilho.largura || '-'} × ${ladrilho.espessura || '-'}`;
    } else {
      const bloco = linha as LinhaExcelBlocos;
      return [bloco.comprimento, bloco.largura, bloco.altura].filter(Boolean).join(' × ') || '-';
    }
  };

  // Renderizar quantidade com base no tipo
  const renderQuantidade = (linha: LinhaExcel) => {
    if (tipoAtual === 'chapas') {
      return (linha as LinhaExcelChapas).quantidadeTotal;
    }
    return (linha as LinhaExcelBlocos | LinhaExcelLadrilhos).quantidade;
  };

  // Renderizar resumo das pargas para chapas com tooltips de fotos
  const renderPargasResumo = (linha: LinhaExcelChapas) => {
    const pargasAtivas = linha.pargas
      .map((p, idx) => {
        if (p.quantidade && p.quantidade > 0) {
          return { 
            num: idx + 1, 
            nome: p.nome || `Parga ${idx + 1}`, 
            qtd: p.quantidade,
            foto1: p.foto1Url,
            foto2: p.foto2Url
          };
        }
        return null;
      })
      .filter(Boolean);
    
    if (pargasAtivas.length === 0) return '-';
    
    return (
      <TooltipProvider>
        <div className="flex flex-wrap gap-1">
          {pargasAtivas.map((p, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <span className="cursor-help underline decoration-dotted underline-offset-2">
                  {p!.nome}: {p!.qtd}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">{p!.nome}</p>
                  <p><span className="text-muted-foreground">{t('import.primeiraChapa')}</span> {p!.foto1 || <span className="text-destructive">{t('import.semFoto')}</span>}</p>
                  <p><span className="text-muted-foreground">{t('import.ultima')}</span> {p!.foto2 || <span className="text-muted-foreground italic">{t('import.naoDefinida')}</span>}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  };

  // Renderizar dimensões das pargas com tooltips
  const renderPargasDimensoes = (linha: LinhaExcelChapas) => {
    const pargasAtivas = linha.pargas
      .map((p, idx) => {
        if (p.quantidade && p.quantidade > 0) {
          return {
            num: idx + 1,
            comprimento: p.comprimento,
            altura: p.altura,
            espessura: p.espessura
          };
        }
        return null;
      })
      .filter(Boolean);
    
    if (pargasAtivas.length === 0) return '-';
    
    return (
      <TooltipProvider>
        <div className="flex flex-wrap gap-1">
          {pargasAtivas.map((p, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  P{p!.num}: {p!.comprimento || '-'}×{p!.altura || '-'}×{p!.espessura || '-'}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-xs space-y-0.5">
                  <p>{t('import.labelComprimento')}: {p!.comprimento || '-'} cm</p>
                  <p>{t('import.labelAltura')}: {p!.altura || '-'} cm</p>
                  <p>{t('import.labelEspessura')}: {p!.espessura || '-'} cm</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple/10">
          <FileSpreadsheet className="w-6 h-6 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('import.stockPageTitle')}</h1>
          <p className="text-muted-foreground">{t('import.stockPageSubtitle')}</p>
        </div>
      </div>

      {/* Resultado Final */}
      {resultado && (
        <Card className="card-accent-top card-accent-success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="w-5 h-5" />
              {t('import.importacaoConcluidaInline')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{resultado.totalLinhas}</p>
                <p className="text-sm text-muted-foreground">{t('import.totalLinhas')}</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">{resultado.linhasProcessadas}</p>
                <p className="text-sm text-muted-foreground">{t('import.processadas')}</p>
              </div>
              <div className="text-center p-4 bg-info/10 rounded-lg">
                <p className="text-2xl font-bold text-info">{resultado.produtosCriados}</p>
                <p className="text-sm text-muted-foreground">{t('import.produtosNovosInline')}</p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{resultado.movimentosCriados}</p>
                <p className="text-sm text-muted-foreground">{t('import.movimentosInline')}</p>
              </div>
            </div>
            {resultado.erros?.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('import.atencao')}</AlertTitle>
                <AlertDescription className="space-y-1">
                  <p>{t('import.linhasNaoProcessadas', { n: resultado.erros.length })}</p>
                  <ul className="list-disc list-inside text-sm mt-2">
                    {resultado.erros.slice(0, 3).map((e, i) => (
                      <li key={i}>{t('import.linhaErro', { n: e.linha, msg: e.erro })}</li>
                    ))}
                    {resultado.erros.length > 3 && <li>{t('import.maisErrosInline', { n: resultado.erros.length - 3 })}</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={handleReset} className="w-full">
              {t('import.novaImportacao')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Seleção de Tipo + Upload */}
      {!resultado && linhas.length === 0 && (
        <>
          {/* Seleção do Tipo de Importação */}
          <Card>
            <CardHeader>
              <CardTitle>{t('import.selecionarTipoTitle')}</CardTitle>
              <CardDescription>{t('import.selecionarTipoDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiposImportacao.map((tipo) => {
                  const Icon = tipo.icon;
                  const isSelected = tipoSelecionado === tipo.id;
                  
                  return (
                    <button
                      key={tipo.id}
                      onClick={() => setTipoSelecionado(tipo.id)}
                      className={cn(
                        "p-6 rounded-lg border-2 transition-all text-left",
                        isSelected 
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-lg",
                          isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{tipo.nome}</h3>
                          <p className="text-sm text-muted-foreground">{tipo.descricao}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Botões de Download dos Modelos */}
              {tipoSelecionado && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h4 className="font-medium">{t('import.modeloParaTipoTitle', { nome: tiposImportacao.find(t => t.id === tipoSelecionado)?.nome })}</h4>
                      <p className="text-sm text-muted-foreground">{t('import.modeloParaTipoDesc')}</p>
                    </div>
                    <Button variant="outline" onClick={() => handleDownloadModelo(tipoSelecionado)} className="gap-2">
                      <Download className="w-4 h-4" />
                      {t('import.descarregarModelo')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>{t('import.carregarFicheiroStepTitle')}</CardTitle>
              <CardDescription>
                {tipoSelecionado 
                  ? t('import.carregarFicheiroStepDescComTipo', { nome: tiposImportacao.find(t => t.id === tipoSelecionado)?.nome.toLowerCase() })
                  : t('import.carregarFicheiroStepDescSemTipo')
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                  tipoSelecionado 
                    ? "border-border hover:border-primary/50 cursor-pointer" 
                    : "border-muted bg-muted/30 cursor-not-allowed opacity-60"
                )}
                onClick={() => tipoSelecionado && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={!tipoSelecionado}
                />
                
                {isParsing ? (
                  <div className="space-y-4">
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                    <p className="text-muted-foreground">{t('import.processando')}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {tipoSelecionado 
                        ? t('import.arrastarOuClicar')
                        : t('import.selecioneTipoPrimeiro')
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('import.suportaFormatos')}
                    </p>
                    <Button variant="outline" className="gap-2" disabled={!tipoSelecionado}>
                      <FileSpreadsheet className="w-4 h-4" />
                      {t('import.selecionarFicheiro')}
                    </Button>
                  </>
                )}
              </div>

              {parseErro && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>{t('import.erroProcesarFicheiro')}</AlertTitle>
                  <AlertDescription>{parseErro}</AlertDescription>
                </Alert>
              )}

              {/* Instruções de Mapeamento */}
              {tipoSelecionado && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {t('import.colunasPrincipais', { nome: tiposImportacao.find(t => t.id === tipoSelecionado)?.nome })}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {tipoSelecionado === 'blocos' && (
                      <>
                        <div><span className="font-medium">{t('import.infoColsBlocos.idmm')}</span> → {t('import.infoColsBlocos.idmmDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsBlocos.variedade')}</span> → {t('import.infoColsBlocos.variedadeDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsBlocos.parqueMM')}</span> → {t('import.infoColsBlocos.parqueMMDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsBlocos.peso')}</span> → {t('import.infoColsBlocos.pesoDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsBlocos.dimensoes')}</span> → {t('import.infoColsBlocos.dimensoesDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsBlocos.fotos')}</span> → {t('import.infoColsBlocos.fotosDesc')}</div>
                      </>
                    )}
                    {tipoSelecionado === 'chapas' && (
                      <>
                        <div><span className="font-medium">{t('import.infoColsChapas.idmmBloco')}</span> → {t('import.infoColsChapas.idmmBlocoDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsChapas.variedade')}</span> → {t('import.infoColsChapas.variedadeDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsChapas.parqueMM')}</span> → {t('import.infoColsChapas.parqueMMDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsChapas.pargas')}</span> → {t('import.infoColsChapas.pargasDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsChapas.medidas')}</span> → {t('import.infoColsChapas.medidasDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsChapas.fotos')}</span> → {t('import.infoColsChapas.fotosDesc')}</div>
                      </>
                    )}
                    {tipoSelecionado === 'ladrilhos' && (
                      <>
                        <div><span className="font-medium">{t('import.infoColsLadrilhos.idmm')}</span> → {t('import.infoColsLadrilhos.idmmDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsLadrilhos.variedade')}</span> → {t('import.infoColsLadrilhos.variedadeDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsLadrilhos.parqueMM')}</span> → {t('import.infoColsLadrilhos.parqueMMDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsLadrilhos.dimensoes')}</span> → {t('import.infoColsLadrilhos.dimensoesDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsLadrilhos.quantidade')}</span> → {t('import.infoColsLadrilhos.quantidadeDesc')}</div>
                        <div><span className="font-medium">{t('import.infoColsLadrilhos.acabamento')}</span> → {t('import.infoColsLadrilhos.acabamentoDesc')}</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Preview dos Dados */}
      {!resultado && linhas.length > 0 && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="card-accent-top">
              <CardContent className="pt-6">
                <Badge variant="outline" className="mb-2">
                  {tiposImportacao.find(t => t.id === tipoAtual)?.nome}
                </Badge>
                <p className="text-3xl font-bold">{linhas.length}</p>
                <p className="text-sm text-muted-foreground">{t('import.linhasEncontradasStats')}</p>
              </CardContent>
            </Card>
            <Card className="card-accent-top card-accent-success">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-success">{linhasValidas.length}</p>
                <p className="text-sm text-muted-foreground">{t('import.prontas')}</p>
              </CardContent>
            </Card>
            <Card className="card-accent-top card-accent-info">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-info">{produtosNovos.length}</p>
                <p className="text-sm text-muted-foreground">{t('import.produtosNovosStats')}</p>
              </CardContent>
            </Card>
            <Card className="card-accent-top card-accent-destructive">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-destructive">{linhasComErros.length}</p>
                <p className="text-sm text-muted-foreground">{t('import.statsComErros')}</p>
              </CardContent>
            </Card>
            <Card className="card-accent-top">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold">
                  {linhas.reduce((acc, l) => acc + renderQuantidade(l), 0)}
                </p>
                <p className="text-sm text-muted-foreground">{t('import.unidadesTotal')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('import.preVisualizacaoTitle')}</CardTitle>
                <CardDescription>{t('import.preVisualizacaoDesc')}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  {t('import.limpar')}
                </Button>
                <Button 
                  onClick={() => setConfirmOpen(true)} 
                  disabled={linhasValidas.length === 0}
                  className="gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  {t('import.importarN', { n: linhasValidas.length })}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">{t('import.colLinha')}</TableHead>
                      <TableHead>{t('import.colIdmm')}</TableHead>
                      <TableHead>{t('import.colVariedade')}</TableHead>
                      {tipoAtual === 'chapas' ? (
                        <>
                          <TableHead>{t('import.colPargas')}</TableHead>
                          <TableHead>{t('import.colDimensoesPargas')}</TableHead>
                          <TableHead>{t('import.colParqueMM')}</TableHead>
                          <TableHead className="text-center">{t('import.colTotalChapas')}</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>{t('import.colForma')}</TableHead>
                          <TableHead>{t('import.colDimensoes')}</TableHead>
                          <TableHead>{t('import.colParqueMM')}</TableHead>
                          <TableHead className="text-center">{t('import.colQtd')}</TableHead>
                        </>
                      )}
                      <TableHead>{t('import.colEstado')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((linha) => (
                      <TableRow 
                        key={linha.rowIndex} 
                        className={linha.erros.length > 0 ? 'bg-destructive/5' : ''}
                      >
                        <TableCell className="font-mono text-muted-foreground">
                          {linha.rowIndex}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {linha.idmm}
                        </TableCell>
                        <TableCell>{linha.tipoPedra || '-'}</TableCell>
                        {tipoAtual === 'chapas' ? (
                          <>
                            <TableCell className="text-sm">
                              {renderPargasResumo(linha as LinhaExcelChapas)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {renderPargasDimensoes(linha as LinhaExcelChapas)}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">{linha.parqueMM || '-'}</span>
                              {linha.linha && (
                                <span className="text-muted-foreground text-xs ml-1">({linha.linha})</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-bold text-primary">
                              {(linha as LinhaExcelChapas).quantidadeTotal}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>
                              <Badge variant="outline">{linha.forma}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {renderDimensoes(linha)}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">{linha.parqueMM || '-'}</span>
                              {linha.linha && (
                                <span className="text-muted-foreground text-xs ml-1">({linha.linha})</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {renderQuantidade(linha)}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          {linha.erros.length > 0 ? (
                            <div className="space-y-1">
                              {linha.erros.slice(0, 2).map((erro, i) => (
                                <Badge key={i} variant="destructive" className="text-xs block w-fit">
                                  {erro}
                                </Badge>
                              ))}
                              {linha.erros.length > 2 && (
                                <Badge variant="destructive" className="text-xs block w-fit">
                                  {t('import.maisNErros', { n: linha.erros.length - 2 })}
                                </Badge>
                              )}
                            </div>
                          ) : linha.avisos.length > 0 ? (
                            <div className="space-y-1">
                              {linha.avisos.map((aviso, i) => (
                                <Badge key={i} variant="outline" className="text-xs block w-fit text-warning border-warning/30">
                                  {aviso}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="outline" className="badge-entrada">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {t('import.okBadge')}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog de Confirmação */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('import.confirmarDialogTitle', { nome: tiposImportacao.find(t => t.id === tipoAtual)?.nome })}</DialogTitle>
            <DialogDescription>
              {t('import.confirmarDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>{t('import.tipoProduto')}</span>
                <Badge>{tiposImportacao.find(t => t.id === tipoAtual)?.nome}</Badge>
              </div>
              <div className="flex justify-between">
                <span>{t('import.linhasProcessar')}</span>
                <span className="font-bold">{linhasValidas.length}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('import.produtosNovosDialog')}</span>
                <span className="font-bold text-info">{produtosNovos.length}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('import.movimentosDialog')}</span>
                <span className="font-bold text-success">{linhasValidas.length}</span>
              </div>
              {linhasComErros.length > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>{t('import.linhasIgnoradasDialog')}</span>
                  <span className="font-bold">{linhasComErros.length}</span>
                </div>
              )}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>{t('import.infoTitle')}</AlertTitle>
              <AlertDescription>
                {t('import.infoDesc')}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button 
              onClick={handleConfirmImport} 
              disabled={executarImportacao.isPending}
              className="gap-2"
            >
              {executarImportacao.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('import.aImportar')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {t('import.confirmarImportacao')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
