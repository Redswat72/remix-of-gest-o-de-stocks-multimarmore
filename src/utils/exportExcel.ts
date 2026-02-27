import * as XLSX from 'xlsx';
import type { Bloco, Chapa, Ladrilho } from '@/types/inventario';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ExportOptions {
  empresaNome: string;
  corHeader: string; // hex like '#1a56db'
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
  const { data, error } = await supabase
    .from('blocos')
    .select('id_mm, parque, variedade, bloco_origem, quantidade_tons, preco_unitario, valor_inventario')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Sem dados para exportar');

  const rows = data.map((b: Bloco) => ({
    'ID MM': b.id_mm,
    'Parque': b.parque,
    'Variedade': b.variedade ?? '',
    'Origem': b.bloco_origem ?? '',
    'Toneladas': b.quantidade_tons,
    'Preço/ton (€)': b.preco_unitario ?? 0,
    'Valor (€)': b.valor_inventario ?? 0,
  }));

  const headers = Object.keys(rows[0]);
  const ws = XLSX.utils.json_to_sheet(rows);
  applyHeaderStyle(ws, headers.length, opts.corHeader);
  autoWidth(ws, rows, headers);

  // Totals row
  const totalTons = data.reduce((s, b) => s + (b.quantidade_tons || 0), 0);
  const totalValor = data.reduce((s, b) => s + (b.valor_inventario || 0), 0);
  addTotalsRow(ws, data.length + 1, { 0: 'TOTAIS', 4: totalTons, 6: totalValor }, headers.length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Blocos');
  downloadWorkbook(wb, 'blocos', opts.empresaNome);
}

// ─── CHAPAS ──────────────────────────────────────────────
export async function exportChapas(supabase: SupabaseClient, opts: ExportOptions) {
  const { data, error } = await supabase
    .from('chapas')
    .select('id_mm, bundle_id, parque, variedade, num_chapas, quantidade_m2, preco_unitario, valor_inventario')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Sem dados para exportar');

  const rows = data.map((c: Chapa) => ({
    'ID MM': c.id_mm,
    'Bundle/Parga': c.bundle_id ?? '',
    'Parque': c.parque,
    'Variedade': c.variedade ?? '',
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
  addTotalsRow(ws, data.length + 1, { 0: 'TOTAIS', 4: totalChapas, 5: totalM2, 7: totalValor }, headers.length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Chapas');
  downloadWorkbook(wb, 'chapas', opts.empresaNome);
}

// ─── LADRILHOS ───────────────────────────────────────────
export async function exportLadrilhos(supabase: SupabaseClient, opts: ExportOptions) {
  const { data, error } = await supabase
    .from('ladrilho')
    .select('variedade, dimensoes, butch_no, num_pecas, quantidade_m2, peso, preco_unitario, valor_inventario')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Sem dados para exportar');

  const rows = data.map((l: Ladrilho) => ({
    'Variedade': l.variedade ?? '',
    'Dimensões': l.dimensoes ?? '',
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
  addTotalsRow(ws, data.length + 1, { 0: 'TOTAIS', 3: totalPecas, 4: totalM2, 5: totalPeso, 7: totalValor }, headers.length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ladrilhos');
  downloadWorkbook(wb, 'ladrilhos', opts.empresaNome);
}
