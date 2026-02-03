/**
 * Gerador de modelo Excel para importação de inventário
 * 
 * Este módulo cria ficheiros .xlsx padronizados com:
 * - Folha principal: estrutura de dados para importação
 * - Folha INSTRUCOES: explicação de cada coluna
 * - Folha EXEMPLO: linhas fictícias de preenchimento correto
 * 
 * Suporta 3 tipos de produtos:
 * - Blocos: produtos brutos em bloco
 * - Chapas: derivados de blocos com pargas
 * - Ladrilhos: produtos acabados em formato placa
 */

import * as XLSX from 'xlsx';

// Tipo de importação
export type TipoImportacao = 'blocos' | 'chapas' | 'ladrilhos';

// Estrutura do modelo de inventário
export interface ModeloInventarioConfig {
  incluirExemplos: boolean;
  tipo: TipoImportacao;
}

// ===================== MODELO BLOCOS =====================

export const COLUNAS_MODELO_BLOCOS = {
  Data: { obrigatorio: false, descricao: 'Data do registo (formato: DD/MM/AAAA)', exemplo: '03/02/2026' },
  ID_MM: { obrigatorio: true, descricao: 'Identificador único do produto (código interno Multimármore)', exemplo: 'MM-2026-001' },
  Tipo_pedra: { obrigatorio: true, descricao: 'Tipo geral da pedra (ex: "Mármore", "Granito", "Calcário")', exemplo: 'Mármore' },
  Variedade: { obrigatorio: false, descricao: 'Variedade específica da pedra (ex: "Estremoz Clássico", "Rosa Aurora")', exemplo: 'Estremoz Clássico' },
  Origem_bloco: { obrigatorio: false, descricao: 'Origem do bloco (ex: "Portugal", "Espanha", "Itália")', exemplo: 'Portugal' },
  Parque_MM: { obrigatorio: true, descricao: 'Código do parque físico (deve existir na tabela de locais)', exemplo: 'P1' },
  Linha: { obrigatorio: false, descricao: 'Posição interna no parque (linha, corredor, fila)', exemplo: 'A-12' },
  Origem_material: { obrigatorio: false, descricao: 'Origem do material: "adquirido" ou "producao_propria"', exemplo: 'adquirido' },
  Comprimento_cm: { obrigatorio: false, descricao: 'Comprimento em centímetros', exemplo: '280' },
  Largura_cm: { obrigatorio: false, descricao: 'Largura em centímetros', exemplo: '150' },
  Altura_cm: { obrigatorio: false, descricao: 'Altura em centímetros', exemplo: '120' },
  Peso_ton: { obrigatorio: true, descricao: 'Peso em toneladas (OBRIGATÓRIO para blocos)', exemplo: '12.5' },
  Nome_comercial: { obrigatorio: false, descricao: 'Nome comercial do produto (se diferente da variedade)', exemplo: 'Branco Neve' },
  Quantidade: { obrigatorio: false, descricao: 'Quantidade de unidades (default: 1)', exemplo: '1' },
  Notas: { obrigatorio: false, descricao: 'Observações adicionais sobre o produto', exemplo: 'Pequena fissura no canto superior' },
  Foto1_URL: { obrigatorio: false, descricao: 'URL da foto 1 (começar com http:// ou https://)', exemplo: 'https://exemplo.com/foto1.jpg' },
  Foto2_URL: { obrigatorio: false, descricao: 'URL da foto 2', exemplo: '' },
  Foto3_URL: { obrigatorio: false, descricao: 'URL da foto 3', exemplo: '' },
  Foto4_URL: { obrigatorio: false, descricao: 'URL da foto 4', exemplo: '' },
} as const;

const EXEMPLOS_BLOCOS = [
  {
    Data: '03/02/2026',
    ID_MM: 'MM-2026-001',
    Tipo_pedra: 'Mármore',
    Variedade: 'Estremoz Clássico',
    Origem_bloco: 'Portugal',
    Parque_MM: 'P1',
    Linha: 'A-12',
    Origem_material: 'adquirido',
    Comprimento_cm: 280,
    Largura_cm: 150,
    Altura_cm: 120,
    Peso_ton: 12.5,
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
    Tipo_pedra: 'Mármore',
    Variedade: 'Ruivina',
    Origem_bloco: 'Portugal',
    Parque_MM: 'P2',
    Linha: 'B-05',
    Origem_material: 'producao_propria',
    Comprimento_cm: 200,
    Largura_cm: 120,
    Altura_cm: 100,
    Peso_ton: 6.5,
    Nome_comercial: '',
    Quantidade: 1,
    Notas: '',
    Foto1_URL: '',
    Foto2_URL: '',
    Foto3_URL: '',
    Foto4_URL: '',
  },
];

// ===================== MODELO CHAPAS =====================

export const COLUNAS_MODELO_CHAPAS = {
  // Dados base do bloco de origem
  Data: { obrigatorio: false, descricao: 'Data do registo (formato: DD/MM/AAAA)', exemplo: '03/02/2026' },
  ID_MM_Bloco: { obrigatorio: true, descricao: 'ID do bloco de origem (ex: MM-2026-001)', exemplo: 'MM-2026-001' },
  Tipo_pedra: { obrigatorio: true, descricao: 'Tipo geral da pedra (ex: "Mármore", "Granito")', exemplo: 'Mármore' },
  Variedade: { obrigatorio: false, descricao: 'Variedade específica da pedra', exemplo: 'Estremoz Clássico' },
  Origem_bloco: { obrigatorio: false, descricao: 'Origem do bloco (ex: "Portugal")', exemplo: 'Portugal' },
  Origem_material: { obrigatorio: false, descricao: 'Origem: "adquirido" ou "producao_propria"', exemplo: 'adquirido' },
  Parque_MM: { obrigatorio: true, descricao: 'Código do parque físico', exemplo: 'P1' },
  Linha: { obrigatorio: false, descricao: 'Posição no parque', exemplo: 'A-12' },
  Peso_bloco_ton: { obrigatorio: false, descricao: 'Peso do bloco de origem em toneladas', exemplo: '12.5' },
  
  // Parga 1
  Parga1_Nome: { obrigatorio: false, descricao: 'Nome da Parga 1', exemplo: 'Parga A' },
  Parga1_Quantidade: { obrigatorio: false, descricao: 'Quantidade de chapas na Parga 1', exemplo: '15' },
  Parga1_Comprimento_cm: { obrigatorio: false, descricao: 'Comprimento das chapas (cm)', exemplo: '300' },
  Parga1_Altura_cm: { obrigatorio: false, descricao: 'Altura das chapas (cm)', exemplo: '180' },
  Parga1_Espessura_cm: { obrigatorio: false, descricao: 'Espessura das chapas (cm)', exemplo: '2' },
  Parga1_Foto1_URL: { obrigatorio: false, descricao: 'URL foto 1ª chapa', exemplo: 'https://exemplo.com/parga1-primeira.jpg' },
  Parga1_Foto2_URL: { obrigatorio: false, descricao: 'URL foto última chapa', exemplo: 'https://exemplo.com/parga1-ultima.jpg' },
  
  // Parga 2
  Parga2_Nome: { obrigatorio: false, descricao: 'Nome da Parga 2', exemplo: 'Parga B' },
  Parga2_Quantidade: { obrigatorio: false, descricao: 'Quantidade de chapas na Parga 2', exemplo: '12' },
  Parga2_Comprimento_cm: { obrigatorio: false, descricao: 'Comprimento das chapas (cm)', exemplo: '280' },
  Parga2_Altura_cm: { obrigatorio: false, descricao: 'Altura das chapas (cm)', exemplo: '170' },
  Parga2_Espessura_cm: { obrigatorio: false, descricao: 'Espessura das chapas (cm)', exemplo: '2' },
  Parga2_Foto1_URL: { obrigatorio: false, descricao: 'URL foto 1ª chapa', exemplo: '' },
  Parga2_Foto2_URL: { obrigatorio: false, descricao: 'URL foto última chapa', exemplo: '' },
  
  // Parga 3
  Parga3_Nome: { obrigatorio: false, descricao: 'Nome da Parga 3', exemplo: '' },
  Parga3_Quantidade: { obrigatorio: false, descricao: 'Quantidade de chapas na Parga 3', exemplo: '' },
  Parga3_Comprimento_cm: { obrigatorio: false, descricao: 'Comprimento das chapas (cm)', exemplo: '' },
  Parga3_Altura_cm: { obrigatorio: false, descricao: 'Altura das chapas (cm)', exemplo: '' },
  Parga3_Espessura_cm: { obrigatorio: false, descricao: 'Espessura das chapas (cm)', exemplo: '' },
  Parga3_Foto1_URL: { obrigatorio: false, descricao: 'URL foto 1ª chapa', exemplo: '' },
  Parga3_Foto2_URL: { obrigatorio: false, descricao: 'URL foto última chapa', exemplo: '' },
  
  // Parga 4
  Parga4_Nome: { obrigatorio: false, descricao: 'Nome da Parga 4', exemplo: '' },
  Parga4_Quantidade: { obrigatorio: false, descricao: 'Quantidade de chapas na Parga 4', exemplo: '' },
  Parga4_Comprimento_cm: { obrigatorio: false, descricao: 'Comprimento das chapas (cm)', exemplo: '' },
  Parga4_Altura_cm: { obrigatorio: false, descricao: 'Altura das chapas (cm)', exemplo: '' },
  Parga4_Espessura_cm: { obrigatorio: false, descricao: 'Espessura das chapas (cm)', exemplo: '' },
  Parga4_Foto1_URL: { obrigatorio: false, descricao: 'URL foto 1ª chapa', exemplo: '' },
  Parga4_Foto2_URL: { obrigatorio: false, descricao: 'URL foto última chapa', exemplo: '' },
  
  // Notas
  Notas: { obrigatorio: false, descricao: 'Observações adicionais', exemplo: 'Chapas de alta qualidade' },
} as const;

const EXEMPLOS_CHAPAS = [
  {
    Data: '03/02/2026',
    ID_MM_Bloco: 'MM-2026-001',
    Tipo_pedra: 'Mármore',
    Variedade: 'Estremoz Clássico',
    Origem_bloco: 'Portugal',
    Origem_material: 'adquirido',
    Parque_MM: 'P1',
    Linha: 'A-12',
    Peso_bloco_ton: 12.5,
    Parga1_Nome: 'Parga A',
    Parga1_Quantidade: 15,
    Parga1_Comprimento_cm: 300,
    Parga1_Altura_cm: 180,
    Parga1_Espessura_cm: 2,
    Parga1_Foto1_URL: 'https://exemplo.com/parga1-primeira.jpg',
    Parga1_Foto2_URL: 'https://exemplo.com/parga1-ultima.jpg',
    Parga2_Nome: 'Parga B',
    Parga2_Quantidade: 12,
    Parga2_Comprimento_cm: 280,
    Parga2_Altura_cm: 170,
    Parga2_Espessura_cm: 2,
    Parga2_Foto1_URL: '',
    Parga2_Foto2_URL: '',
    Parga3_Nome: '',
    Parga3_Quantidade: '',
    Parga3_Comprimento_cm: '',
    Parga3_Altura_cm: '',
    Parga3_Espessura_cm: '',
    Parga3_Foto1_URL: '',
    Parga3_Foto2_URL: '',
    Parga4_Nome: '',
    Parga4_Quantidade: '',
    Parga4_Comprimento_cm: '',
    Parga4_Altura_cm: '',
    Parga4_Espessura_cm: '',
    Parga4_Foto1_URL: '',
    Parga4_Foto2_URL: '',
    Notas: 'Chapas de alta qualidade, polimento brilhante',
  },
];

// ===================== MODELO LADRILHOS =====================

export const COLUNAS_MODELO_LADRILHOS = {
  Data: { obrigatorio: false, descricao: 'Data do registo (formato: DD/MM/AAAA)', exemplo: '03/02/2026' },
  ID_MM: { obrigatorio: true, descricao: 'Identificador único do produto', exemplo: 'MM-LAD-2026-001' },
  Tipo_pedra: { obrigatorio: true, descricao: 'Tipo geral da pedra (ex: "Calcário", "Mármore")', exemplo: 'Calcário' },
  Variedade: { obrigatorio: false, descricao: 'Variedade específica da pedra', exemplo: 'Moleanos Clássico' },
  Origem_material: { obrigatorio: false, descricao: 'Origem: "adquirido" ou "producao_propria"', exemplo: 'producao_propria' },
  Parque_MM: { obrigatorio: true, descricao: 'Código do parque físico', exemplo: 'P1' },
  Linha: { obrigatorio: false, descricao: 'Posição no parque', exemplo: 'C-03' },
  Comprimento_cm: { obrigatorio: true, descricao: 'Comprimento do ladrilho (cm)', exemplo: '60' },
  Largura_cm: { obrigatorio: true, descricao: 'Largura do ladrilho (cm)', exemplo: '60' },
  Espessura_cm: { obrigatorio: true, descricao: 'Espessura do ladrilho (cm)', exemplo: '2' },
  Quantidade: { obrigatorio: true, descricao: 'Quantidade de ladrilhos', exemplo: '100' },
  Acabamento: { obrigatorio: false, descricao: 'Tipo de acabamento (polido, amaciado, etc.)', exemplo: 'polido' },
  Nome_comercial: { obrigatorio: false, descricao: 'Nome comercial do produto', exemplo: 'Moleanos Clássico' },
  Notas: { obrigatorio: false, descricao: 'Observações adicionais', exemplo: 'Caixa com 10 unidades' },
  Foto1_URL: { obrigatorio: false, descricao: 'URL da foto 1', exemplo: 'https://exemplo.com/ladrilho1.jpg' },
  Foto2_URL: { obrigatorio: false, descricao: 'URL da foto 2', exemplo: '' },
} as const;

const EXEMPLOS_LADRILHOS = [
  {
    Data: '03/02/2026',
    ID_MM: 'MM-LAD-2026-001',
    Tipo_pedra: 'Calcário',
    Variedade: 'Moleanos Clássico',
    Origem_material: 'producao_propria',
    Parque_MM: 'P1',
    Linha: 'C-03',
    Comprimento_cm: 60,
    Largura_cm: 60,
    Espessura_cm: 2,
    Quantidade: 100,
    Acabamento: 'polido',
    Nome_comercial: 'Moleanos Clássico',
    Notas: 'Caixas de 10 unidades',
    Foto1_URL: 'https://exemplo.com/ladrilho-moleanos.jpg',
    Foto2_URL: '',
  },
  {
    Data: '03/02/2026',
    ID_MM: 'MM-LAD-2026-002',
    Tipo_pedra: 'Mármore',
    Variedade: 'Estremoz Clássico',
    Origem_material: 'adquirido',
    Parque_MM: 'P2',
    Linha: 'D-01',
    Comprimento_cm: 40,
    Largura_cm: 40,
    Espessura_cm: 1.5,
    Quantidade: 200,
    Acabamento: 'amaciado',
    Nome_comercial: 'Branco Neve 40x40',
    Notas: '',
    Foto1_URL: '',
    Foto2_URL: '',
  },
];

// ===================== INSTRUÇÕES =====================

function getInstrucoesDados(tipo: TipoImportacao): Array<{ Coluna: string; Obrigatório: string; Descrição: string; Valores_aceites: string }> {
  const colunas = tipo === 'blocos' 
    ? COLUNAS_MODELO_BLOCOS 
    : tipo === 'chapas' 
      ? COLUNAS_MODELO_CHAPAS 
      : COLUNAS_MODELO_LADRILHOS;
  
  return Object.entries(colunas).map(([nome, config]) => ({
    Coluna: nome,
    Obrigatório: config.obrigatorio ? 'SIM' : 'Não',
    Descrição: config.descricao,
    Valores_aceites: config.exemplo || '-',
  }));
}

function getNotasInstrucoes(tipo: TipoImportacao): string[] {
  const notasComuns = [
    '',
    '=== NOTAS IMPORTANTES ===',
    '',
    '1. Apenas a folha principal é processada durante a importação.',
    '2. Não altere os nomes das colunas.',
    '3. Colunas não reconhecidas são ignoradas.',
    '4. Se o ID_MM já existir, apenas é criado um movimento de entrada (stock atualizado).',
    '5. Se o ID_MM não existir, o produto é criado automaticamente.',
    '6. Parque_MM é usado como destino do movimento de entrada (afeta stock).',
    '7. Erros são apresentados por linha antes da importação final.',
    '',
    '=== VALIDAÇÕES ===',
    '',
    '• ID_MM: Deve ser único e não vazio',
    '• Parque_MM: OBRIGATÓRIO - deve corresponder a um código de parque ativo no sistema',
    '• Tipo_pedra: OBRIGATÓRIO - tipo geral da pedra (ex: Mármore, Granito, Calcário)',
    '• Variedade: Opcional - variedade específica da pedra (ex: Estremoz Clássico)',
    '• Origem_bloco: Opcional - origem geográfica do bloco (ex: Portugal, Espanha)',
  ];

  const notasEspecificas: Record<TipoImportacao, string[]> = {
    blocos: [
      '• Peso_ton: OBRIGATÓRIO para blocos',
      '• Quantidade: Se vazio, assume valor 1',
      '• URLs de fotos: Devem começar com http:// ou https://',
    ],
    chapas: [
      '',
      '=== REGRAS PARA CHAPAS ===',
      '',
      '• Pelo menos 1 parga deve estar preenchida',
      '• Para cada parga usada:',
      '  - Quantidade obrigatória (> 0)',
      '  - Medidas obrigatórias (comprimento, altura, espessura)',
      '  - 2 fotos obrigatórias (1ª e última chapa)',
      '• Quantidade total é calculada automaticamente',
      '• O produto será criado com forma = "chapa"',
    ],
    ladrilhos: [
      '',
      '=== REGRAS PARA LADRILHOS ===',
      '',
      '• Quantidade: OBRIGATÓRIA e > 0',
      '• Dimensões: Comprimento, Largura e Espessura OBRIGATÓRIOS',
      '• O produto será criado com forma = "ladrilho"',
    ],
  };

  return [...notasComuns, ...notasEspecificas[tipo]];
}

/**
 * Gera e descarrega o modelo Excel para importação de inventário
 */
export function gerarModeloExcel(config: ModeloInventarioConfig = { incluirExemplos: true, tipo: 'blocos' }): void {
  const workbook = XLSX.utils.book_new();
  const { tipo } = config;

  // Selecionar configuração correta
  const colunas = tipo === 'blocos' 
    ? COLUNAS_MODELO_BLOCOS 
    : tipo === 'chapas' 
      ? COLUNAS_MODELO_CHAPAS 
      : COLUNAS_MODELO_LADRILHOS;
  
  const exemplos = tipo === 'blocos' 
    ? EXEMPLOS_BLOCOS 
    : tipo === 'chapas' 
      ? EXEMPLOS_CHAPAS 
      : EXEMPLOS_LADRILHOS;
  
  const sheetName = tipo.toUpperCase();

  // === Folha Principal ===
  const headers = Object.keys(colunas);
  const wsPrincipal = XLSX.utils.aoa_to_sheet([headers]);
  
  // Definir larguras das colunas
  wsPrincipal['!cols'] = headers.map(h => ({
    wch: Math.max(h.length + 2, 15)
  }));

  XLSX.utils.book_append_sheet(workbook, wsPrincipal, sheetName);

  // === Folha INSTRUCOES ===
  const instrucoesDados = getInstrucoesDados(tipo);
  const wsInstrucoes = XLSX.utils.json_to_sheet(instrucoesDados);
  
  // Adicionar notas após a tabela
  const notasStartRow = instrucoesDados.length + 3;
  const notas = getNotasInstrucoes(tipo);
  notas.forEach((nota, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: notasStartRow + idx, c: 0 });
    wsInstrucoes[cellRef] = { t: 's', v: nota };
  });

  // Definir larguras das colunas para instruções
  wsInstrucoes['!cols'] = [
    { wch: 25 },  // Coluna
    { wch: 12 },  // Obrigatório
    { wch: 50 },  // Descrição
    { wch: 40 },  // Valores aceites
  ];

  XLSX.utils.book_append_sheet(workbook, wsInstrucoes, 'INSTRUCOES');

  // === Folha EXEMPLO ===
  if (config.incluirExemplos) {
    const wsExemplo = XLSX.utils.json_to_sheet(exemplos, {
      header: headers
    });
    
    // Definir larguras das colunas
    wsExemplo['!cols'] = headers.map(h => ({
      wch: Math.max(h.length + 2, 15)
    }));

    XLSX.utils.book_append_sheet(workbook, wsExemplo, 'EXEMPLO');
  }

  // Gerar e descarregar ficheiro
  const dataAtual = new Date().toISOString().split('T')[0];
  const filename = `modelo-importacao-${tipo}-${dataAtual}.xlsx`;
  
  XLSX.writeFile(workbook, filename);
}

/**
 * Valida se um ficheiro Excel segue a estrutura do modelo (compatibilidade)
 */
export function validarEstruturaFicheiro(workbook: XLSX.WorkBook): {
  valido: boolean;
  erros: string[];
  avisos: string[];
} {
  const erros: string[] = [];
  const avisos: string[] = [];

  if (workbook.SheetNames.length === 0) {
    erros.push('O ficheiro não contém folhas de dados');
    return { valido: false, erros, avisos };
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  if (data.length < 1) {
    erros.push('A folha de dados está vazia');
    return { valido: false, erros, avisos };
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

// Alias para manter compatibilidade
export const COLUNAS_MODELO = COLUNAS_MODELO_BLOCOS;
