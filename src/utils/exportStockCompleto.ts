import * as XLSX from 'xlsx';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Bloco, Chapa, Ladrilho } from '@/types/inventario';

interface ExportOptions {
  empresaNome: string;
  corHeader: string;
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

export async function exportStockCompleto(supabase: SupabaseClient, opts: ExportOptions) {
  // Fetch all 3 tables in parallel
  const [blocosRes, chapasRes, ladrilhoRes] = await Promise.all([
    supabase.from('blocos').select('*').order('created_at', { ascending: false }),
    supabase.from('chapas').select('*').order('created_at', { ascending: false }),
    supabase.from('ladrilho').select('*').order('created_at', { ascending: false }),
  ]);

  if (blocosRes.error) throw blocosRes.error;
  if (chapasRes.error) throw chapasRes.error;
  if (ladrilhoRes.error) throw ladrilhoRes.error;

  const wb = XLSX.utils.book_new();

  // ─── BLOCOS SHEET ──────────────────────────────
  const blocosData = (blocosRes.data || []) as Bloco[];
  if (blocosData.length > 0) {
    const blocosRows = blocosData.map(b => {
      const peso = b.quantidade_kg ?? 0;
      const preco = b.preco_unitario ?? 0;
      const valor = b.valor_inventario && b.valor_inventario > 0
        ? b.valor_inventario
        : peso * preco;
      const precoFinal = preco > 0 ? preco : (peso > 0 && valor > 0 ? valor / peso : 0);
      return {
        'ID MM': b.id_mm,
        'Parque': b.parque,
        'Variedade': b.variedade ?? '',
        'Origem': b.bloco_origem ?? '',
        'Peso (kg)': peso,
        'Preço/kg (€)': precoFinal,
        'Valor (€)': valor,
      };
    });
    const headers = Object.keys(blocosRows[0]);
    const ws = XLSX.utils.json_to_sheet(blocosRows);
    applyHeaderStyle(ws, headers.length, opts.corHeader);
    autoWidth(ws, blocosRows, headers);
    const totalKg = blocosRows.reduce((s, b) => s + (b['Peso (kg)'] || 0), 0);
    const totalValor = blocosRows.reduce((s, b) => s + (b['Valor (€)'] || 0), 0);
    addTotalsRow(ws, blocosData.length + 1, { 0: 'TOTAIS', 4: totalKg, 6: totalValor }, headers.length);
    XLSX.utils.book_append_sheet(wb, ws, 'Blocos');
  }

  // ─── CHAPAS SHEET ──────────────────────────────
  const chapasData = (chapasRes.data || []) as Chapa[];
  if (chapasData.length > 0) {
    const chapasRows = chapasData.map(c => {
      const m2 = c.quantidade_m2 ?? 0;
      const preco = c.preco_unitario ?? 0;
      const valor = c.valor_inventario && c.valor_inventario > 0
        ? c.valor_inventario
        : m2 * preco;
      const precoFinal = preco > 0 ? preco : (m2 > 0 && valor > 0 ? valor / m2 : 0);
      return {
        'ID MM': c.id_mm,
        'Bundle/Parga': c.bundle_id ?? '',
        'Parque': c.parque,
        'Variedade': c.variedade ?? '',
        'Chapas': c.num_chapas ?? 0,
        'm²': m2,
        'Preço/m² (€)': precoFinal,
        'Valor (€)': valor,
      };
    });
    const headers = Object.keys(chapasRows[0]);
    const ws = XLSX.utils.json_to_sheet(chapasRows);
    applyHeaderStyle(ws, headers.length, opts.corHeader);
    autoWidth(ws, chapasRows, headers);
    const totalChapas = chapasRows.reduce((s, c) => s + (c['Chapas'] || 0), 0);
    const totalM2 = chapasRows.reduce((s, c) => s + (c['m²'] || 0), 0);
    const totalValor = chapasRows.reduce((s, c) => s + (c['Valor (€)'] || 0), 0);
    addTotalsRow(ws, chapasData.length + 1, { 0: 'TOTAIS', 4: totalChapas, 5: totalM2, 7: totalValor }, headers.length);
    XLSX.utils.book_append_sheet(wb, ws, 'Chapas');
  }

  // ─── LADRILHOS SHEET ───────────────────────────
  const ladrilhoData = (ladrilhoRes.data || []) as Ladrilho[];
  if (ladrilhoData.length > 0) {
    const ladrilhoRows = ladrilhoData.map(l => {
      const m2 = l.quantidade_m2 ?? 0;
      const preco = l.preco_unitario ?? 0;
      const valor = l.valor_inventario && l.valor_inventario > 0
        ? l.valor_inventario
        : m2 * preco;
      const precoFinal = preco > 0 ? preco : (m2 > 0 && valor > 0 ? valor / m2 : 0);
      return {
        'Variedade': l.variedade ?? '',
        'Dimensões': l.dimensoes ?? '',
        'Butch No': l.butch_no ?? '',
        'Peças': l.num_pecas ?? 0,
        'm²': m2,
        'Peso (kg)': l.peso ?? 0,
        'Preço/m² (€)': precoFinal,
        'Valor (€)': valor,
      };
    });
    const headers = Object.keys(ladrilhoRows[0]);
    const ws = XLSX.utils.json_to_sheet(ladrilhoRows);
    applyHeaderStyle(ws, headers.length, opts.corHeader);
    autoWidth(ws, ladrilhoRows, headers);
    const totalPecas = ladrilhoRows.reduce((s, l) => s + (l['Peças'] || 0), 0);
    const totalM2 = ladrilhoRows.reduce((s, l) => s + (l['m²'] || 0), 0);
    const totalPeso = ladrilhoRows.reduce((s, l) => s + (l['Peso (kg)'] || 0), 0);
    const totalValor = ladrilhoRows.reduce((s, l) => s + (l['Valor (€)'] || 0), 0);
    addTotalsRow(ws, ladrilhoData.length + 1, { 0: 'TOTAIS', 3: totalPecas, 4: totalM2, 5: totalPeso, 7: totalValor }, headers.length);
    XLSX.utils.book_append_sheet(wb, ws, 'Ladrilhos');
  }


  if (wb.SheetNames.length === 0) {
    throw new Error('Sem dados para exportar');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `stock_completo_${opts.empresaNome.toLowerCase()}_${dateStr}.xlsx`);
}
