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

  // Gerar ficheiro via Blob (compatível com iframes)
  const dateStr = new Date().toISOString().split('T')[0];
  const fname = `${filename}-${dateStr}.xlsx`;
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
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
