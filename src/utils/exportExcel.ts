import * as XLSX from 'xlsx';
import type { Bloco, Chapa, Ladrilho } from '@/types/inventario';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatChapaDimensoes } from '@/lib/chapaDimensoes';
import { formatBlocoDimensoes } from '@/lib/blocoDimensoes';
import { formatLadrilhoDimensoes } from '@/lib/ladrilhoDimensoes';

interface ExportOptions {
  empresaNome: string;
  corHeader: string; // hex like '#1a56db'
}

async function fetchAllRows(supabase: SupabaseClient, table: string): Promise<Record<string, any>[]> {
  const pageSize = 1000;
  const rows: Record<string, any>[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }

  return rows;
}

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

function autoWidth(ws: XLSX.WorkSheet, data: Record<string, unknown>[], headers: string[]) {
  ws['!cols'] = headers.map((h, i) => {
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
  // Update range
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  range.e.r = rowIndex;
  ws['!ref'] = XLSX.utils.encode_range(range);
}

function downloadWorkbook(wb: XLSX.WorkBook, tipo: string, empresaNome: string) {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${tipo}_${empresaNome.toLowerCase()}_${dateStr}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── BLOCOS ──────────────────────────────────────────────
export async function exportBlocos(supabase: SupabaseClient, opts: ExportOptions) {
  const rawData = await fetchAllRows(supabase, 'blocos');
  const data = (rawData ?? []).filter((r: any) =>
    !Object.prototype.hasOwnProperty.call(r, 'ativo') || r.ativo === true
  );
  if (data.length === 0) throw new Error('Sem dados para exportar');

  const rows = data.map((b: any) => ({
    'ID MM': b.id_mm,
    'Parque': b.parque,
    'Variedade': b.variedade ?? '',
    'Origem': b.bloco_origem ?? '',
    'Fornecedor': b.fornecedor ?? '',
    'Ano de Entrada': b.entrada_stock ?? '',
    'Comprimento (cm)': b.comprimento ?? '',
    'Largura (cm)': b.largura ?? '',
    'Altura (cm)': b.altura ?? '',
    'Dimensões': formatBlocoDimensoes(b),
    'Peso (kg)': b.quantidade_kg ?? 0,
    'Preço/kg (€)': b.preco_unitario ?? 0,
    'Valor (€)': b.valor_inventario ?? 0,
  }));

  const headers = Object.keys(rows[0]);
  const ws = XLSX.utils.json_to_sheet(rows);
  applyHeaderStyle(ws, headers.length, opts.corHeader);
  autoWidth(ws, rows, headers);

  // Totals row
  const totalKg = data.reduce((s, b: any) => s + (b.quantidade_kg || 0), 0);
  const totalValor = data.reduce((s, b: any) => s + (b.valor_inventario || 0), 0);
  addTotalsRow(ws, data.length + 1, { 0: 'TOTAIS', 10: totalKg, 12: totalValor }, headers.length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Blocos');
  downloadWorkbook(wb, 'blocos', opts.empresaNome);
}

// ─── CHAPAS ──────────────────────────────────────────────
export async function exportChapas(supabase: SupabaseClient, opts: ExportOptions) {
  const rawData = await fetchAllRows(supabase, 'chapas');
  const data = (rawData ?? []).filter((r: any) =>
    !Object.prototype.hasOwnProperty.call(r, 'ativo') || r.ativo === true
  );
  if (data.length === 0) throw new Error('Sem dados para exportar');

  const rows = data.map((c: Chapa) => ({
    'ID MM': c.id_mm,
    'Bundle/Parga': c.bundle_id ?? '',
    'Parque': c.parque,
    'Variedade': c.variedade ?? '',
    'Fornecedor': c.fornecedor ?? '',
    'Ano de Entrada': c.entrada_stock ?? '',
    'Largura direta (cm)': c.largura ?? '',
    'Altura direta (cm)': c.altura ?? '',
    'Parga 1 - Quantidade': c.parga1_quantidade ?? '',
    'Parga 1 - Comprimento (cm)': c.parga1_comprimento ?? '',
    'Parga 1 - Altura (cm)': c.parga1_altura ?? '',
    'Parga 1 - Espessura (cm)': c.parga1_espessura ?? '',
    'Parga 2 - Quantidade': c.parga2_quantidade ?? '',
    'Parga 2 - Comprimento (cm)': c.parga2_comprimento ?? '',
    'Parga 2 - Altura (cm)': c.parga2_altura ?? '',
    'Parga 2 - Espessura (cm)': c.parga2_espessura ?? '',
    'Parga 3 - Quantidade': c.parga3_quantidade ?? '',
    'Parga 3 - Comprimento (cm)': c.parga3_comprimento ?? '',
    'Parga 3 - Altura (cm)': c.parga3_altura ?? '',
    'Parga 3 - Espessura (cm)': c.parga3_espessura ?? '',
    'Parga 4 - Quantidade': c.parga4_quantidade ?? '',
    'Parga 4 - Comprimento (cm)': c.parga4_comprimento ?? '',
    'Parga 4 - Altura (cm)': c.parga4_altura ?? '',
    'Parga 4 - Espessura (cm)': c.parga4_espessura ?? '',
    'Dimensões (C×A×E cm)': formatChapaDimensoes(c as unknown as Record<string, unknown>),
    'Chapas': c.num_chapas ?? 0,
    'm²': c.quantidade_m2,
    'Preço/m² (€)': c.preco_unitario ?? 0,
    'Valor (€)': c.valor_inventario ?? 0,
  }));

  const headers = Object.keys(rows[0]);
  const ws = XLSX.utils.json_to_sheet(rows);
  applyHeaderStyle(ws, headers.length, opts.corHeader);
  autoWidth(ws, rows, headers);

  const totalChapas = data.reduce((s, c) => s + (c.num_chapas || 0), 0);
  const totalM2 = data.reduce((s, c) => s + (c.quantidade_m2 || 0), 0);
  const totalValor = data.reduce((s, c) => s + (c.valor_inventario || 0), 0);
  addTotalsRow(ws, data.length + 1, { 0: 'TOTAIS', 25: totalChapas, 26: totalM2, 28: totalValor }, headers.length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Chapas');
  downloadWorkbook(wb, 'chapas', opts.empresaNome);
}

// ─── LADRILHOS ───────────────────────────────────────────
export async function exportLadrilhos(supabase: SupabaseClient, opts: ExportOptions) {
  const rawData = await fetchAllRows(supabase, 'ladrilho');
  const data = (rawData ?? []).filter((r: any) =>
    !Object.prototype.hasOwnProperty.call(r, 'ativo') || r.ativo === true
  );
  if (data.length === 0) throw new Error('Sem dados para exportar');

  const rows = data.map((l: Ladrilho) => ({
    'ID MM': l.id_mm ?? '',
    'Parque': l.parque,
    'Tipo': l.tipo ?? '',
    'Variedade': l.variedade ?? '',
    'Acabamento': l.acabamento ?? '',
    'Fornecedor': l.fornecedor ?? '',
    'Ano de Entrada': l.entrada_stock ?? '',
    'Comprimento (cm)': l.comprimento ?? '',
    'Largura (cm)': l.largura ?? '',
    'Altura (cm)': l.altura ?? '',
    'Espessura (cm)': l.espessura ?? '',
    'Dimensões': formatLadrilhoDimensoes(l) || l.dimensoes || '',
    'Butch No': l.butch_no ?? '',
    'Peças': l.num_pecas ?? 0,
    'm²': l.quantidade_m2,
    'Peso (kg)': l.peso ?? 0,
    'Preço/m² (€)': l.preco_unitario ?? 0,
    'Valor (€)': l.valor_inventario ?? 0,
  }));

  const headers = Object.keys(rows[0]);
  const ws = XLSX.utils.json_to_sheet(rows);
  applyHeaderStyle(ws, headers.length, opts.corHeader);
  autoWidth(ws, rows, headers);

  const totalPecas = data.reduce((s, l) => s + (l.num_pecas || 0), 0);
  const totalM2 = data.reduce((s, l) => s + (l.quantidade_m2 || 0), 0);
  const totalPeso = data.reduce((s, l) => s + (l.peso || 0), 0);
  const totalValor = data.reduce((s, l) => s + (l.valor_inventario || 0), 0);
  addTotalsRow(ws, data.length + 1, { 0: 'TOTAIS', 13: totalPecas, 14: totalM2, 15: totalPeso, 17: totalValor }, headers.length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ladrilhos');
  downloadWorkbook(wb, 'ladrilhos', opts.empresaNome);
}
