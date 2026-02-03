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
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useParseExcel, useExecutarImportacao, LinhaExcel, ResultadoImportacao } from '@/hooks/useImportarExcel';

export default function ImportarStock() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { linhas, isLoading: isParsing, erro: parseErro, parseFile, limpar } = useParseExcel();
  const executarImportacao = useExecutarImportacao();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

  // Estatísticas
  const linhasValidas = linhas.filter(l => l.erros.length === 0);
  const linhasComErros = linhas.filter(l => l.erros.length > 0);
  const produtosNovos = linhas.filter(l => !l.produtoExiste && l.erros.length === 0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de ficheiro
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        title: 'Ficheiro inválido',
        description: 'Por favor, selecione um ficheiro Excel (.xlsx ou .xls)',
        variant: 'destructive',
      });
      return;
    }

    parseFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
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
    try {
      const result = await executarImportacao.mutateAsync(linhas);
      setResultado(result);
      setConfirmOpen(false);
      toast({
        title: 'Importação concluída',
        description: `${result.movimentosCriados} movimentos criados com sucesso`,
      });
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    limpar();
    setResultado(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple/10">
          <FileSpreadsheet className="w-6 h-6 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Importar Stock via Excel</h1>
          <p className="text-muted-foreground">Importe inventário inicial a partir de ficheiros Excel</p>
        </div>
      </div>

      {/* Resultado Final */}
      {resultado && (
        <Card className="card-accent-top card-accent-success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="w-5 h-5" />
              Importação Concluída
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{resultado.totalLinhas}</p>
                <p className="text-sm text-muted-foreground">Linhas Total</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">{resultado.linhasProcessadas}</p>
                <p className="text-sm text-muted-foreground">Processadas</p>
              </div>
              <div className="text-center p-4 bg-info/10 rounded-lg">
                <p className="text-2xl font-bold text-info">{resultado.produtosCriados}</p>
                <p className="text-sm text-muted-foreground">Produtos Novos</p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{resultado.movimentosCriados}</p>
                <p className="text-sm text-muted-foreground">Movimentos</p>
              </div>
            </div>
            {resultado.erros > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  {resultado.erros} linhas não puderam ser processadas devido a erros.
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={handleReset} className="w-full">
              Nova Importação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      {!resultado && linhas.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div
              className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {isParsing ? (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                  <p className="text-muted-foreground">A processar ficheiro...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Arraste o ficheiro Excel ou clique para selecionar</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Suporta ficheiros .xlsx e .xls
                  </p>
                  <Button variant="outline" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Selecionar Ficheiro
                  </Button>
                </>
              )}
            </div>

            {parseErro && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Erro ao processar ficheiro</AlertTitle>
                <AlertDescription>{parseErro}</AlertDescription>
              </Alert>
            )}

            {/* Instruções de Mapeamento */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Mapeamento de Colunas Esperado
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div><span className="font-medium">ID MM</span> → idmm</div>
                <div><span className="font-medium">Variedade</span> → tipo_pedra</div>
                <div><span className="font-medium">Forma</span> → forma</div>
                <div><span className="font-medium">Dimensões</span> → C x L x A</div>
                <div><span className="font-medium">Localização</span> → local</div>
                <div><span className="font-medium">Origem</span> → origem_material</div>
                <div><span className="font-medium">Quantidade</span> → quantidade</div>
                <div><span className="font-medium">Notas/Danos</span> → observações</div>
                <div><span className="font-medium">Fotos (URLs)</span> → foto1-4</div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                A coluna "Enviado para" será ignorada. A primeira linha é tratada como cabeçalho.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview dos Dados */}
      {!resultado && linhas.length > 0 && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="card-accent-top">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold">{linhas.length}</p>
                <p className="text-sm text-muted-foreground">Linhas Encontradas</p>
              </CardContent>
            </Card>
            <Card className="card-accent-top card-accent-success">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-success">{linhasValidas.length}</p>
                <p className="text-sm text-muted-foreground">Prontas para Importar</p>
              </CardContent>
            </Card>
            <Card className="card-accent-top card-accent-info">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-info">{produtosNovos.length}</p>
                <p className="text-sm text-muted-foreground">Produtos Novos</p>
              </CardContent>
            </Card>
            <Card className="card-accent-top card-accent-destructive">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-destructive">{linhasComErros.length}</p>
                <p className="text-sm text-muted-foreground">Com Erros</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pré-visualização dos Dados</CardTitle>
                <CardDescription>Revise os dados antes de confirmar a importação</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Limpar
                </Button>
                <Button 
                  onClick={() => setConfirmOpen(true)} 
                  disabled={linhasValidas.length === 0}
                  className="gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Importar ({linhasValidas.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Linha</TableHead>
                      <TableHead>ID MM</TableHead>
                      <TableHead>Variedade</TableHead>
                      <TableHead>Forma</TableHead>
                      <TableHead>Dimensões</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead>Estado</TableHead>
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
                        <TableCell>{linha.variedade || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{linha.forma}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {[linha.comprimento, linha.largura, linha.altura]
                            .filter(Boolean)
                            .join(' × ') || '-'}
                        </TableCell>
                        <TableCell>{linha.localizacao || '-'}</TableCell>
                        <TableCell className="text-center font-medium">
                          {linha.quantidade}
                        </TableCell>
                        <TableCell>
                          {linha.erros.length > 0 ? (
                            <div className="space-y-1">
                              {linha.erros.map((erro, i) => (
                                <Badge key={i} variant="destructive" className="text-xs block w-fit">
                                  {erro}
                                </Badge>
                              ))}
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
                              OK
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
            <DialogTitle>Confirmar Importação</DialogTitle>
            <DialogDescription>
              Esta ação irá criar movimentos de entrada para todas as linhas válidas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Linhas a processar:</span>
                <span className="font-bold">{linhasValidas.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Produtos novos a criar:</span>
                <span className="font-bold text-info">{produtosNovos.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Movimentos a criar:</span>
                <span className="font-bold text-success">{linhasValidas.length}</span>
              </div>
              {linhasComErros.length > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Linhas ignoradas (erros):</span>
                  <span className="font-bold">{linhasComErros.length}</span>
                </div>
              )}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Informação</AlertTitle>
              <AlertDescription>
                O stock será atualizado automaticamente pelos triggers da base de dados. 
                Esta operação não pode ser desfeita.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmImport} 
              disabled={executarImportacao.isPending}
              className="gap-2"
            >
              {executarImportacao.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A importar...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Importação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
