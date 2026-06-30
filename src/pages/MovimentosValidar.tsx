import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Search, FileText, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useAppT } from '@/hooks/useAppT';
import { useEmpresa } from '@/context/EmpresaContext';
import { useEnumLabel } from '@/lib/enumLabels';
import { formatDateTime } from '@/lib/format';
import { MovimentoAddendaModal } from '@/components/movimentos/MovimentoAddendaModal';
import type { MovimentoComDetalhes } from '@/hooks/useMovimentos';

export default function MovimentosValidar() {
  const t = useAppT();
  const { supabaseEmpresa: supabase } = useEmpresa();
  const enumLabel = useEnumLabel();

  const [busca, setBusca] = useState('');
  const [selectedMovimento, setSelectedMovimento] = useState<MovimentoComDetalhes | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Buscar movimentos recentes (últimos 100) e as respetivas adendas
  const { data: movimentos, isLoading } = useQuery({
    queryKey: ['movimentos-validar', supabase],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('movimentos')
        .select(`
          *,
          produto:produtos(*),
          local_origem:locais!movimentos_local_origem_id_fkey(nome, codigo),
          local_destino:locais!movimentos_local_destino_id_fkey(nome, codigo),
          operador:profiles!movimentos_operador_id_fkey(nome)
        `)
        .order('data_movimento', { ascending: false })
        .limit(100);

      if (error) throw error;

      const movIds = (data || []).map(m => m.id);
      const adendasMap = new Map<string, any[]>();

      if (movIds.length > 0) {
        const { data: adendasData } = await supabase
          .from('movimento_adendas')
          .select('*, anexos:movimento_anexos(*)')
          .in('movimento_id', movIds)
          .order('created_at', { ascending: true });

        if (adendasData) {
          adendasData.forEach(adenda => {
            const list = adendasMap.get(adenda.movimento_id) || [];
            list.push(adenda);
            adendasMap.set(adenda.movimento_id, list);
          });
        }
      }

      return (data || []).map(mov => ({
        ...mov,
        adendas: adendasMap.get(mov.id) || []
      })) as unknown as MovimentoComDetalhes[];
    },
    enabled: !!supabase,
  });

  const getClienteNome = (mov: any) => {
    if (mov.cliente_nome) return mov.cliente_nome;
    if (mov.cliente && typeof mov.cliente === 'object' && 'nome' in mov.cliente) {
      return mov.cliente.nome;
    }
    return '—';
  };

  const filtered = (movimentos || []).filter(mov => {
    if (!busca.trim()) return true;
    const term = busca.toLowerCase();
    const idMm = (mov.id_mm || '').toLowerCase();
    const cliente = getClienteNome(mov).toLowerCase();
    const obs = (mov.observacoes || '').toLowerCase();
    return idMm.includes(term) || cliente.includes(term) || obs.includes(term);
  });

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
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">Movimentos Recentes para Validação</CardTitle>
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
              Nenhum movimento encontrado para validação.
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
                    <TableHead>Estado de Validação</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(mov => {
                    const ultimaAdenda = mov.adendas && mov.adendas.length > 0
                      ? mov.adendas[mov.adendas.length - 1]
                      : null;

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
                          {ultimaAdenda ? (
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 text-xs">
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              <span className="uppercase tracking-wide">{ultimaAdenda.estado_validacao}</span>
                              <span className="text-[10px] opacity-70">({mov.adendas.length} adenda(s))</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 text-xs font-normal">
                              <Clock className="w-3 h-3" /> Pendente de validação
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={ultimaAdenda ? "secondary" : "default"}
                            className="gap-1.5 text-xs h-8"
                            onClick={() => {
                              setSelectedMovimento(mov);
                              setModalOpen(true);
                            }}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {ultimaAdenda ? 'Ver / Adicionar Adenda' : 'Validar Movimento'}
                          </Button>
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
