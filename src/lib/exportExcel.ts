import * as XLSX from 'xlsx';

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName = 'Dados'
): void {
  if (!data || data.length === 0) {
    console.warn('Nenhum dado para exportar');
    return;
  }

  // Criar workbook e worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-ajustar largura das colunas
  const maxWidths: number[] = [];
  const headers = Object.keys(data[0]);
  
  headers.forEach((header, i) => {
    maxWidths[i] = header.length;
    data.forEach(row => {
      const cellValue = String(row[header] ?? '');
      if (cellValue.length > maxWidths[i]) {
        maxWidths[i] = Math.min(cellValue.length, 50);
      }
    });
  });

  worksheet['!cols'] = maxWidths.map(w => ({ wch: w + 2 }));

  // Gerar ficheiro
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filename}-${dateStr}.xlsx`);
}
