/**
 * Gerador de modelo Excel para importação de inventário
 * 
 * Este módulo cria um ficheiro .xlsx padronizado com:
 * - Folha INVENTARIO: estrutura de dados para importação
 * - Folha INSTRUCOES: explicação de cada coluna
 * - Folha EXEMPLO: linhas fictícias de preenchimento correto
 */

import * as XLSX from 'xlsx';

// Estrutura do modelo de inventário
export interface ModeloInventarioConfig {
  incluirExemplos: boolean;
}

// Colunas do modelo
export const COLUNAS_MODELO = {
  Data: { obrigatorio: false, descricao: 'Data do registo (formato: DD/MM/AAAA)', exemplo: '03/02/2026' },
  ID_MM: { obrigatorio: true, descricao: 'Identificador único do produto (código interno Multimármore)', exemplo: 'MM-2026-001' },
  Localizacao: { obrigatorio: true, descricao: 'Nome ou código do parque onde o material se encontra', exemplo: 'Parque 1' },
  Origem_material: { obrigatorio: false, descricao: 'Origem do material: "adquirido" ou "producao_propria"', exemplo: 'adquirido' },
  Forma: { obrigatorio: false, descricao: 'Forma do produto: "bloco", "chapa" ou "ladrilho"', exemplo: 'bloco' },
  Comprimento_cm: { obrigatorio: false, descricao: 'Comprimento em centímetros', exemplo: '280' },
  Largura_cm: { obrigatorio: false, descricao: 'Largura em centímetros', exemplo: '150' },
  Altura_cm: { obrigatorio: false, descricao: 'Altura em centímetros', exemplo: '120' },
  Espessura_cm: { obrigatorio: false, descricao: 'Espessura em centímetros (para chapas)', exemplo: '3' },
  Variedade: { obrigatorio: true, descricao: 'Tipo/variedade da pedra (ex: "Estremoz Branco", "Ruivina")', exemplo: 'Estremoz Branco' },
  Nome_comercial: { obrigatorio: false, descricao: 'Nome comercial do produto (se diferente da variedade)', exemplo: 'Branco Neve' },
  Quantidade: { obrigatorio: false, descricao: 'Quantidade de unidades (default: 1)', exemplo: '1' },
  Notas: { obrigatorio: false, descricao: 'Observações adicionais sobre o produto', exemplo: 'Pequena fissura no canto superior' },
  Foto1_URL: { obrigatorio: false, descricao: 'URL da foto 1 (começar com http:// ou https://)', exemplo: 'https://exemplo.com/foto1.jpg' },
  Foto2_URL: { obrigatorio: false, descricao: 'URL da foto 2', exemplo: '' },
  Foto3_URL: { obrigatorio: false, descricao: 'URL da foto 3', exemplo: '' },
  Foto4_URL: { obrigatorio: false, descricao: 'URL da foto 4', exemplo: '' },
} as const;

// Exemplos de preenchimento para a folha EXEMPLO
const EXEMPLOS_DADOS = [
  {
    Data: '03/02/2026',
    ID_MM: 'MM-2026-001',
    Localizacao: 'Parque 1',
    Origem_material: 'adquirido',
    Forma: 'bloco',
    Comprimento_cm: 280,
    Largura_cm: 150,
    Altura_cm: 120,
    Espessura_cm: '',
    Variedade: 'Estremoz Branco',
    Nome_comercial: 'Branco Neve Premium',
    Quantidade: 1,
    Notas: 'Bloco de alta qualidade, sem defeitos visíveis',
    Foto1_URL: 'https://exemplo.com/mm-2026-001-frente.jpg',
    Foto2_URL: 'https://exemplo.com/mm-2026-001-topo.jpg',
    Foto3_URL: '',
    Foto4_URL: '',
  },
  {
    Data: '03/02/2026',
    ID_MM: 'MM-2026-002',
    Localizacao: 'Parque 2',
    Origem_material: 'producao_propria',
    Forma: 'chapa',
    Comprimento_cm: 300,
    Largura_cm: 180,
    Altura_cm: '',
    Espessura_cm: 2,
    Variedade: 'Ruivina',
    Nome_comercial: '',
    Quantidade: 5,
    Notas: 'Lote de 5 chapas polidas',
    Foto1_URL: '',
    Foto2_URL: '',
    Foto3_URL: '',
    Foto4_URL: '',
  },
  {
    Data: '03/02/2026',
    ID_MM: 'MM-2026-003',
    Localizacao: 'P1',
    Origem_material: 'adquirido',
    Forma: 'ladrilho',
    Comprimento_cm: 60,
    Largura_cm: 60,
    Altura_cm: '',
    Espessura_cm: 1.5,
    Variedade: 'Moleanos',
    Nome_comercial: 'Moleanos Classico',
    Quantidade: 50,
    Notas: 'Caixa com 50 ladrilhos 60x60',
    Foto1_URL: 'https://exemplo.com/ladrilho-moleanos.jpg',
    Foto2_URL: '',
    Foto3_URL: '',
    Foto4_URL: '',
  },
];

// Conteúdo da folha de instruções
const INSTRUCOES_DADOS = [
  { Coluna: 'Data', Obrigatório: 'Não', Descrição: 'Data do registo no formato DD/MM/AAAA', Valores_aceites: 'Data válida (ex: 03/02/2026)' },
  { Coluna: 'ID_MM', Obrigatório: 'SIM', Descrição: 'Identificador único do produto Multimármore', Valores_aceites: 'Texto único (ex: MM-2026-001)' },
  { Coluna: 'Localizacao', Obrigatório: 'SIM', Descrição: 'Nome ou código do parque/armazém', Valores_aceites: 'Nome ou código existente no sistema' },
  { Coluna: 'Origem_material', Obrigatório: 'Não', Descrição: 'Origem do material', Valores_aceites: '"adquirido" ou "producao_propria"' },
  { Coluna: 'Forma', Obrigatório: 'Não', Descrição: 'Forma do produto (default: bloco)', Valores_aceites: '"bloco", "chapa" ou "ladrilho"' },
  { Coluna: 'Comprimento_cm', Obrigatório: 'Não', Descrição: 'Comprimento em centímetros', Valores_aceites: 'Número positivo' },
  { Coluna: 'Largura_cm', Obrigatório: 'Não', Descrição: 'Largura em centímetros', Valores_aceites: 'Número positivo' },
  { Coluna: 'Altura_cm', Obrigatório: 'Não', Descrição: 'Altura em centímetros (blocos)', Valores_aceites: 'Número positivo' },
  { Coluna: 'Espessura_cm', Obrigatório: 'Não', Descrição: 'Espessura em centímetros (chapas/ladrilhos)', Valores_aceites: 'Número positivo' },
  { Coluna: 'Variedade', Obrigatório: 'SIM', Descrição: 'Tipo ou variedade da pedra', Valores_aceites: 'Texto (ex: "Estremoz Branco")' },
  { Coluna: 'Nome_comercial', Obrigatório: 'Não', Descrição: 'Nome comercial se diferente da variedade', Valores_aceites: 'Texto livre' },
  { Coluna: 'Quantidade', Obrigatório: 'Não', Descrição: 'Quantidade de unidades (default: 1)', Valores_aceites: 'Número inteiro positivo' },
  { Coluna: 'Notas', Obrigatório: 'Não', Descrição: 'Observações sobre o produto', Valores_aceites: 'Texto livre' },
  { Coluna: 'Foto1_URL', Obrigatório: 'Não', Descrição: 'URL da primeira foto', Valores_aceites: 'URL válido (http:// ou https://)' },
  { Coluna: 'Foto2_URL', Obrigatório: 'Não', Descrição: 'URL da segunda foto', Valores_aceites: 'URL válido' },
  { Coluna: 'Foto3_URL', Obrigatório: 'Não', Descrição: 'URL da terceira foto', Valores_aceites: 'URL válido' },
  { Coluna: 'Foto4_URL', Obrigatório: 'Não', Descrição: 'URL da quarta foto', Valores_aceites: 'URL válido' },
];

// Notas adicionais para a folha de instruções
const NOTAS_INSTRUCOES = [
  '',
  '=== NOTAS IMPORTANTES ===',
  '',
  '1. Apenas a folha "INVENTARIO" é processada durante a importação.',
  '2. Não altere os nomes das colunas na folha INVENTARIO.',
  '3. Colunas não reconhecidas são ignoradas.',
  '4. Se o ID_MM já existir, apenas é criado um movimento de entrada (stock atualizado).',
  '5. Se o ID_MM não existir, o produto é criado automaticamente.',
  '6. Localizações devem corresponder a parques existentes no sistema.',
  '7. Erros são apresentados por linha antes da importação final.',
  '',
  '=== VALIDAÇÕES ===',
  '',
  '• ID_MM: Deve ser único e não vazio',
  '• Localizacao: Deve corresponder a um parque ativo no sistema',
  '• Variedade: Campo obrigatório, identifica o tipo de pedra',
  '• Quantidade: Se vazio, assume valor 1',
  '• URLs de fotos: Devem começar com http:// ou https://',
];

/**
 * Gera e descarrega o modelo Excel para importação de inventário
 */
export function gerarModeloExcel(config: ModeloInventarioConfig = { incluirExemplos: true }): void {
  const workbook = XLSX.utils.book_new();

  // === Folha INVENTARIO (principal) ===
  const headersInventario = Object.keys(COLUNAS_MODELO);
  const wsInventario = XLSX.utils.aoa_to_sheet([headersInventario]);
  
  // Definir larguras das colunas
  wsInventario['!cols'] = headersInventario.map(h => ({
    wch: Math.max(h.length + 2, 15)
  }));

  XLSX.utils.book_append_sheet(workbook, wsInventario, 'INVENTARIO');

  // === Folha INSTRUCOES ===
  const wsInstrucoes = XLSX.utils.json_to_sheet(INSTRUCOES_DADOS);
  
  // Adicionar notas após a tabela
  const notasStartRow = INSTRUCOES_DADOS.length + 3;
  NOTAS_INSTRUCOES.forEach((nota, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: notasStartRow + idx, c: 0 });
    wsInstrucoes[cellRef] = { t: 's', v: nota };
  });

  // Definir larguras das colunas para instruções
  wsInstrucoes['!cols'] = [
    { wch: 18 },  // Coluna
    { wch: 12 },  // Obrigatório
    { wch: 50 },  // Descrição
    { wch: 40 },  // Valores aceites
  ];

  XLSX.utils.book_append_sheet(workbook, wsInstrucoes, 'INSTRUCOES');

  // === Folha EXEMPLO ===
  if (config.incluirExemplos) {
    const wsExemplo = XLSX.utils.json_to_sheet(EXEMPLOS_DADOS, {
      header: headersInventario
    });
    
    // Definir larguras das colunas
    wsExemplo['!cols'] = headersInventario.map(h => ({
      wch: Math.max(h.length + 2, 15)
    }));

    XLSX.utils.book_append_sheet(workbook, wsExemplo, 'EXEMPLO');
  }

  // Gerar e descarregar ficheiro
  const dataAtual = new Date().toISOString().split('T')[0];
  const filename = `modelo-importacao-inventario-${dataAtual}.xlsx`;
  
  XLSX.writeFile(workbook, filename);
}

/**
 * Valida se um ficheiro Excel segue a estrutura do modelo
 */
export function validarEstruturaFicheiro(workbook: XLSX.WorkBook): {
  valido: boolean;
  erros: string[];
  avisos: string[];
} {
  const erros: string[] = [];
  const avisos: string[] = [];

  // Verificar se existe folha INVENTARIO
  if (!workbook.SheetNames.includes('INVENTARIO')) {
    // Tentar encontrar primeira folha
    if (workbook.SheetNames.length > 0) {
      avisos.push(`Folha "INVENTARIO" não encontrada. A usar folha "${workbook.SheetNames[0]}"`);
    } else {
      erros.push('O ficheiro não contém folhas de dados');
      return { valido: false, erros, avisos };
    }
  }

  const sheetName = workbook.SheetNames.includes('INVENTARIO') 
    ? 'INVENTARIO' 
    : workbook.SheetNames[0];
  
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  if (data.length < 1) {
    erros.push('A folha de dados está vazia');
    return { valido: false, erros, avisos };
  }

  // Verificar cabeçalhos
  const headers = (data[0] as string[]).map(h => String(h || '').toLowerCase().trim());
  
  // Verificar colunas obrigatórias
  const colunasObrigatorias = Object.entries(COLUNAS_MODELO)
    .filter(([_, config]) => config.obrigatorio)
    .map(([nome]) => nome.toLowerCase());

  const colunasEncontradas = headers.map(h => {
    // Normalizar para comparação
    return h.replace(/_/g, '').replace(/\s/g, '');
  });

  const obrigatoriasNormalizadas = colunasObrigatorias.map(c => 
    c.replace(/_/g, '').replace(/\s/g, '')
  );

  for (const colObrigatoria of obrigatoriasNormalizadas) {
    const encontrada = colunasEncontradas.some(c => 
      c.includes(colObrigatoria) || colObrigatoria.includes(c)
    );
    if (!encontrada) {
      avisos.push(`Coluna obrigatória pode estar em falta: "${colObrigatoria}"`);
    }
  }

  if (data.length < 2) {
    avisos.push('O ficheiro não contém linhas de dados (apenas cabeçalhos)');
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos,
  };
}
