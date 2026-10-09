import { useMemo } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useLocais } from '@/hooks/useLocais';
import type { Local } from '@/types/database';

/** Valor especial do filtro de parque: todo o material em prestadores. */
export const FILTRO_TODOS = '__all__';
export const FILTRO_PRESTADORES = '__prestadores__';

export const isLocalPrestador = (l?: Pick<Local, 'tipo'> | null) => l?.tipo === 'prestador';

/** Mapa codigo -> local (parques e prestadores, ativos ou não) para assinalar onde está o material. */
export function useLocaisInfo() {
  const { data: locais } = useLocais();
  return useMemo(() => {
    const porCodigo = new Map<string, Local>();
    (locais ?? []).forEach(l => porCodigo.set(l.codigo, l));
    const parques = (locais ?? []).filter(l => !isLocalPrestador(l));
    const prestadores = (locais ?? []).filter(l => isLocalPrestador(l));
    const isPrestador = (codigo?: string | null) => !!codigo && isLocalPrestador(porCodigo.get(codigo));
    const nome = (codigo?: string | null) => (codigo ? porCodigo.get(codigo)?.nome ?? codigo : '');
    /** Aplica o filtro de parque (código, "todos" ou "em prestadores") a um código de parque. */
    const match = (codigo: string | null | undefined, filtro: string) => {
      if (!filtro || filtro === FILTRO_TODOS) return true;
      if (filtro === FILTRO_PRESTADORES) return isPrestador(codigo);
      return codigo === filtro;
    };
    return { locais: locais ?? [], parques, prestadores, porCodigo, isPrestador, nome, match };
  }, [locais]);
}

/** Converte o filtro do ecrã no parâmetro de parque enviado à base de dados (filtros especiais = sem filtro). */
export const filtroParaQuery = (filtro: string) => (filtro.startsWith('__') ? undefined : filtro);

/** Para exportações: lê todos os locais e devolve funções de rótulo de parque. */
export async function carregarLocaisExport(supabase: SupabaseClient) {
  const { data } = await supabase.from('locais').select('codigo, nome, tipo');
  const map = new Map<string, { nome: string; tipo?: string | null }>();
  ((data as { codigo: string; nome: string; tipo?: string | null }[]) ?? []).forEach(l => map.set(l.codigo, l));
  return {
    parqueLabel: (codigo?: string | null) => {
      if (!codigo) return '';
      const l = map.get(codigo);
      return l?.tipo === 'prestador' ? l.nome : codigo;
    },
    tipoLocal: (codigo?: string | null) =>
      codigo && map.get(codigo)?.tipo === 'prestador' ? 'Prestador de serviços' : 'Parque',
  };
}
