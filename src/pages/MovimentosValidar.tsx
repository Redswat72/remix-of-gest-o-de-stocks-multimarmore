import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Search, Calendar, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useAppT } from '@/hooks/useAppT';
import { useEmpresa } from '@/context/EmpresaContext';
import { useEnumLabel } from '@/lib/enumLabels';
import { formatDateTime } from '@/lib/format';
import { MovimentoAddendaModal } from '@/components/movimentos/MovimentoAddendaModal';
import { useValidarMovimento, type MovimentoComDetalhes } from '@/hooks/useMovimentos';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type FiltroValidacao = 'todos' | 'por_validar' | 'validados';

export default function MovimentosValidar() {
  const t = useAppT();
  const { supabaseEmpresa: supabase, empresa } = useEmpresa();
  const enumLabel = useEnumLabel();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const validarMovimento = useValidarMovimento();

  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroValidacao>('por_validar');
  const [selectedMovimento, setSelectedMovimento] = useState<MovimentoComDetalhes | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [validandoId, setValidandoId] = useState<string | null>(null);

  const { data: movimentos, isLoading } = useQuery({
    queryKey: ['movimentos-validar', empresa],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error, count } = await supabase
        .from('movimentos')
        .select(`
          *,
          local_origem:locais!movimentos_local_origem_id_fkey(nome, codigo),
          local_destino:locais!movimentos_local_destino_id_fkey(nome, codigo)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      console.log('[MovimentosValidar] devolvidos:', data?.length, 'total BD:', count);

      const movIds = (data || []).map((m: any) => m.id);
      const adendasMap = new Map<string, any[]>();

      if (movIds.length > 0) {
        const { data: adendasData } = await supabase
          .from('movimento_adendas')
          .select('*')
          .in('movimento_id', movIds)
          .order('created_at', { ascending: true });

        if (adendasData) {
          adendasData.forEach((adenda: any) => {
            let docs = adenda.documentos;
            if (typeof docs === 'string') {
              try { docs = JSON.parse(docs); } catch { docs = []; }
            }
            if (!Array.isArray(docs)) docs = [];
            const list = adendasMap.get(adenda.movimento_id) || [];
            list.push({ ...adenda, documentos: docs });
            adendasMap.set(adenda.movimento_id, list);
          });
        }
      }

      // Resolver nomes dos validadores
      const validadorIds = Array.from(new Set((data || []).map((m: any) => m.validado_por).filter(Boolean)));
      const validadoresMap = new Map<string, string>();
      if (validadorIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', validadorIds as string[]);
        (profs || []).forEach((p: any) => validadoresMap.set(p.user_id, p.nome));
      }

      return (data || []).map((mov: any) => ({
        ...mov,
        adendas: adendasMap.get(mov.id) || [],
        validador_nome: mov.validado_por ? validadoresMap.get(mov.validado_por) || null : null,
      })) as unknown as (MovimentoComDetalhes & { validador_nome?: string | null })[];
    },
    enabled: !!supabase && !!empresa,
  });

  const getClienteNome = (mov: any) => {
    if (mov.cliente_nome) return mov.cliente_nome;
    if (mov.cliente && typeof mov.cliente === 'object' && 'nome' in mov.cliente) {
      return mov.cliente.nome;
    }
    return '—';
  };

  const filtered = useMemo(() => {
    return (movimentos || []).filter((mov: any) => {
      if (filtro === 'por_validar' && mov.validado) return false;
      if (filtro === 'validados' && !mov.validado) return false;
      if (!busca.trim()) return true;
      const term = busca.toLowerCase();
      const idMm = (mov.id_mm || '').toLowerCase();
      const cliente = getClienteNome(mov).toLowerCase();
      const obs = (mov.observacoes || '').toLowerCase();
      return idMm.includes(term) || cliente.includes(term) || obs.includes(term);
    });
  }, [movimentos, busca, filtro]);

  const handleValidar = async (mov: MovimentoComDetalhes) => {
    if (!isAdmin) {
      toast({
        title: 'Sem permissão',
        description: 'Apenas administradores podem validar movimentos.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setValidandoId(mov.id);
      await validarMovimento.mutateAsync({ movimentoId: mov.id });
      toast({
        title: 'Movimento validado',
        description: 'O movimento foi marcado como validado.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao validar',
        description: err.message || 'Não foi possível validar o movimento.',
        variant: 'destructive',
      });
    } finally {
      setValidandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            {t('nav.movimentosValidar')}
          </h1>
          <p className="text-sm text-muted-foreground">
            Área administrativa para validação de consumos, faturação entre empresas e anexação de documentos.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base font-semibold">Movimentos Recentes para Validação</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filtro} onValueChange={(v: FiltroValidacao) => setFiltro(v)}>
                <SelectTrigger className="w-40 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="por_validar">Por validar</SelectItem>
                  <SelectItem value="validados">Validados</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar bloco, cliente, obs..."
                  className="pl-8 h-9 text-sm"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl bg-muted/10 text-muted-foreground">
              Nenhum movimento encontrado para este filtro.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo / Doc</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Cliente / Percurso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((mov: any) => {
                    const validado = !!mov.validado;
                    return (
                      <TableRow key={mov.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs whitespace-nowrap font-mono">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            {formatDateTime(mov.data_movimento)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold">{enumLabel('tipoMovimento', mov.tipo)}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {enumLabel('tipoDocumento', mov.tipo_documento)}
                            {mov.numero_documento && ` #${mov.numero_documento}`}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-medium text-sm">
                          {mov.id_mm || mov.produto_id}
                          <span className="text-xs text-muted-foreground font-sans ml-1">({mov.quantidade} un)</span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium">{getClienteNome(mov)}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {mov.local_origem?.codigo || '—'} &rarr; {mov.local_destino?.codigo || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {validado ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 text-xs">
                                <CheckCircle className="w-3 h-3" /> Validado
                              </Badge>
                              <div className="text-[10px] text-muted-foreground">
                                {mov.validador_nome || '—'}
                                {mov.validado_em && ` · ${formatDateTime(mov.validado_em)}`}
                              </div>
                              {mov.adendas?.length > 0 && (
                                <div className="text-[10px] text-muted-foreground">{mov.adendas.length} adenda(s)</div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 text-xs font-normal">
                              <Clock className="w-3 h-3" /> Por validar
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="gap-1.5 text-xs h-8"
                              onClick={() => {
                                setSelectedMovimento(mov);
                                setModalOpen(true);
                              }}
                            >
                              Adenda
                            </Button>
                            {!validado && (
                              <Button
                                size="sm"
                                variant="default"
                                className="gap-1.5 text-xs h-8"
                                disabled={!isAdmin || validandoId === mov.id}
                                onClick={() => handleValidar(mov)}
                                title={!isAdmin ? 'Apenas administradores podem validar' : undefined}
                              >
                                {validandoId === mov.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                )}
                                Validar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <MovimentoAddendaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        movimento={selectedMovimento}
      />
    </div>
  );
}
