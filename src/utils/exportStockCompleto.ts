import * as XLSX from 'xlsx';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatChapaDimensoes } from '@/lib/chapaDimensoes';
import { formatBlocoDimensoes } from '@/lib/blocoDimensoes';

interface ExportOptions {
  empresaNome: string;
  corHeader: string;
}

type Row = Record<string, unknown>;

function hexToArgb(hex: string): string {
  return 'FF' + hex.replace('#', '').toUpperCase();
}

function applyHeaderStyle(ws: XLSX.WorkSheet, colCount: number, headerColor: string) {
  const argb = hexToArgb(headerColor);
  for (let c = 0; c < colCount; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) {
      cell.s = {
        fill: { fgColor: { rgb: argb } },
        font: { bold: true, color: { rgb: 'FFFFFFFF' } },
        alignment: { horizontal: 'center' },
      };
    }
  }
}

function autoWidth(ws: XLSX.WorkSheet, data: Row[], headers: string[]) {
  ws['!cols'] = headers.map((h) => {
    let max = h.length;
    data.forEach(row => {
      const v = String(row[h] ?? '');
      if (v.length > max) max = Math.min(v.length, 40);
    });
    return { wch: max + 3 };
  });
}

function addTotalsRow(ws: XLSX.WorkSheet, rowIndex: number, totals: Record<number, number | string>, colCount: number) {
  for (let c = 0; c < colCount; c++) {
    const addr = XLSX.utils.encode_cell({ r: rowIndex, c });
    if (totals[c] !== undefined) {
      ws[addr] = { v: totals[c], t: typeof totals[c] === 'number' ? 'n' : 's' };
    }
  }
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  range.e.r = rowIndex;
  ws['!ref'] = XLSX.utils.encode_range(range);
}

/** Converte snake_case em rótulo legível: quantidade_kg -> "Quantidade Kg" */
function prettyLabel(key: string): string {
  if (key === 'comprimento') return 'Comprimento (cm)';
  if (key === 'largura') return 'Largura (cm)';
  if (key === 'altura') return 'Altura (cm)';
  if (key === 'dimensoes') return 'Dimensões';
  return key
    .split('_')
    .map(p => (p.length <= 2 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
}

/** Busca todas as linhas (contorna o limite de 1000 do PostgREST) */
async function fetchAll(supabase: SupabaseClient, table: string): Promise<Row[]> {
  const PAGE = 1000;
  let from = 0;
  const all: Row[] = [];
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Row[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  // Nas tabelas com coluna `ativo`, exportar exclusivamente os registos ativos.
  return all.filter(r => !Object.prototype.hasOwnProperty.call(r, 'ativo') || r.ativo === true);
}

/** Cria uma folha com TODAS as colunas existentes nos registos */
function buildSheet(wb: XLSX.WorkBook, sheetName: string, rows: Row[], corHeader: string) {
  if (rows.length === 0) return;

  // Reunir todas as chaves presentes em qualquer registo
  const keys: string[] = [];
  rows.forEach(r => Object.keys(r).forEach(k => { if (!keys.includes(k)) keys.push(k); }));

  const headers = keys.map(prettyLabel);

  const mapped: Row[] = rows.map(r => {
    const out: Row = {};
    keys.forEach((k, i) => {
      const v = r[k];
      out[headers[i]] =
        v === null || v === undefined
          ? ''
          : typeof v === 'object'
            ? JSON.stringify(v)
            : v;
    });
    return out;
  });

  const ws = XLSX.utils.json_to_sheet(mapped, { header: headers });
  applyHeaderStyle(ws, headers.length, corHeader);
  autoWidth(ws, mapped, headers);

  // Totais automáticos para colunas numéricas
  const totals: Record<number, number | string> = { 0: 'TOTAIS' };
  headers.forEach((h, i) => {
    if (i === 0) return;
    const nums = mapped.map(r => r[h]).filter(v => typeof v === 'number') as number[];
    if (nums.length > 0 && nums.length === mapped.filter(r => r[h] !== '').length) {
      totals[i] = nums.reduce((s, n) => s + n, 0);
    }
  });
  addTotalsRow(ws, mapped.length + 1, totals, headers.length);

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

export async function exportStockCompleto(supabase: SupabaseClient, opts: ExportOptions) {
  const [blocos, chapas, ladrilho] = await Promise.all([
    fetchAll(supabase, 'blocos'),
    fetchAll(supabase, 'chapas'),
    fetchAll(supabase, 'ladrilho'),
  ]);

  const blocosComDim = blocos.map(b => ({
    ...b,
    dimensoes: formatBlocoDimensoes(b),
  }));

  // Dimensões consolidadas (pargas ou, em fallback, largura/altura)
  const chapasComDim = chapas.map(c => ({
    ...c,
    dimensoes_chapa: formatChapaDimensoes(c),
  }));

  const wb = XLSX.utils.book_new();
  buildSheet(wb, 'Blocos', blocosComDim, opts.corHeader);
  buildSheet(wb, 'Chapas', chapasComDim, opts.corHeader);
  buildSheet(wb, 'Ladrilhos', ladrilho, opts.corHeader);

  if (wb.SheetNames.length === 0) {
    throw new Error('Sem dados para exportar');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const fname = `stock_completo_${opts.empresaNome.toLowerCase()}_${dateStr}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
