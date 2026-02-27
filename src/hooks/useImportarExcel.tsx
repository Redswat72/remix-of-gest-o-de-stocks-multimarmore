import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { useAuth } from './useAuth';
import * as XLSX from 'xlsx';
import type { FormaProduto, OrigemMaterial } from '@/types/database';
import type { TipoImportacao } from '@/lib/excelTemplateGenerator';

// Interfaces base para todas as importações
export interface LinhaExcelBase {
  rowIndex: number;
  idmm: string;
  tipoPedra: string;
  variedade: string;
  origemBloco?: string;
  forma: FormaProduto;
  parqueMM: string;
  linha?: string;
  origemMaterial?: OrigemMaterial;
  erros: string[];
  avisos: string[];
  produtoExiste: boolean;
  localId?: string;
}

// Interface para Blocos
export interface LinhaExcelBlocos extends LinhaExcelBase {
  nomeComercial?: string;
  acabamento?: string;
  comprimento?: number;
  largura?: number;
  altura?: number;
  espessura?: number;
  pesoTon?: number;
  quantidade: number;
  observacoes?: string;
  fotos?: string[];
}

// Interface para Pargas (dentro de Chapas)
export interface PargaExcel {
  nome?: string;
  quantidade?: number;
  comprimento?: number;
  altura?: number;
  espessura?: number;
  foto1Url?: string;
  foto2Url?: string;
}

// Interface para Chapas
export interface LinhaExcelChapas extends LinhaExcelBase {
  pesoBloco?: number;
  pargas: [PargaExcel, PargaExcel, PargaExcel, PargaExcel];
  quantidadeTotal: number;
  observacoes?: string;
}

// Interface para Ladrilhos
export interface LinhaExcelLadrilhos extends LinhaExcelBase {
  comprimento: number;
  largura: number;
  espessura: number;
  quantidade: number;
  acabamento?: string;
  nomeComercial?: string;
  observacoes?: string;
  fotos?: string[];
}

// União de todos os tipos
export type LinhaExcel = LinhaExcelBlocos | LinhaExcelChapas | LinhaExcelLadrilhos;

// Interface para resultado
export interface ResultadoImportacao {
  sucesso: boolean;
  totalLinhas: number;
  linhasProcessadas: number;
  produtosCriados: number;
  movimentosCriados: number;
  linhasIgnoradas: number;
  erros: Array<{ linha: number; erro: string }>;
  dataHora: string;
}

interface Local {
  id: string;
  nome: string;
  codigo: string;
}

// Função para parsear dimensões do Excel
function parseDimensoes(valor: string | number | undefined): { comprimento?: number; largura?: number; altura?: number } {
  if (!valor) return {};
  
  const str = String(valor).trim();
  const match = str.match(/(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*(?:[xX×]\s*(\d+(?:[.,]\d+)?))?/);
  
  if (match) {
    return {
      comprimento: parseFloat(match[1].replace(',', '.')),
      largura: parseFloat(match[2].replace(',', '.')),
      altura: match[3] ? parseFloat(match[3].replace(',', '.')) : undefined,
    };
  }
  
  return {};
}

// Função para mapear origem do material
function mapOrigemMaterial(valor: string | undefined): OrigemMaterial | undefined {
  if (!valor) return undefined;
  
  const v = String(valor).toLowerCase().trim();
  if (v.includes('adquirido') || v.includes('compra') || v.includes('ext')) {
    return 'adquirido';
  }
  if (v.includes('produção') || v.includes('producao') || v.includes('propri') || v.includes('int')) {
    return 'producao_propria';
  }
  return undefined;
}

// Extrai apenas os dígitos de uma string (ex: "MM001" -> "1", "001" -> "1")
function extrairNumero(str: string): string | null {
  const digits = str.replace(/\D/g, ''); // Remove tudo que não é dígito
  if (!digits) return null;
  return String(parseInt(digits, 10)); // Remove zeros à esquerda
}

// Função para encontrar local pelo nome ou código
// Suporta match flexível: "1" corresponde a "MM001", "001", "MM1", etc.
function encontrarLocal(locais: Local[], nomeOuCodigo: string): Local | undefined {
  if (!nomeOuCodigo) return undefined;
  
  const busca = String(nomeOuCodigo).toLowerCase().trim();
  const buscaNumStr = extrairNumero(busca);
  
  return locais.find(l => {
    const codigoLower = l.codigo.toLowerCase();
    const nomeLower = l.nome.toLowerCase();
    const codigoNumStr = extrairNumero(l.codigo);
    
    return (
      nomeLower === busca ||
      codigoLower === busca ||
      nomeLower.includes(busca) ||
      busca.includes(codigoLower) ||
      // Match numérico flexível: "1" == "MM001" == "001" == "MM1"
      (buscaNumStr && codigoNumStr && buscaNumStr === codigoNumStr)
    );
  });
}

// Normalizar nome de coluna
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, '')
    .trim();
}

// Encontrar índice de coluna com match flexível
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const normalizedHeaders = headers.map(normalizeColumnName);
  const normalizedNames = possibleNames.map(normalizeColumnName);

  for (const name of normalizedNames) {
    const idx = normalizedHeaders.indexOf(name);
    if (idx !== -1) return idx;
  }

  for (const name of normalizedNames) {
    const idx = normalizedHeaders.findIndex(h => h.startsWith(name));
    if (idx !== -1) return idx;
  }

  for (const name of normalizedNames) {
    const idx = normalizedHeaders.findIndex(h => h.includes(name));
    if (idx !== -1) return idx;
  }

  return -1;
}

// ===================== PARSE BLOCOS =====================
function parseBlocos(
  jsonData: unknown[][],
  headers: string[],
  locais: Local[],
  produtosExistentes: Map<string, string>
): LinhaExcelBlocos[] {
  const colMap = {
    idmm: findColumnIndex(headers, ['id_mm', 'idmm', 'id mm', 'id-mm', 'codigo', 'ref']),
    tipoPedra: findColumnIndex(headers, ['tipo_pedra', 'tipo pedra', 'tipo', 'material', 'pedra']),
    variedade: findColumnIndex(headers, ['variedade', 'variety']),
    origemBloco: findColumnIndex(headers, ['origem_bloco', 'origem bloco', 'origembloco', 'origem do bloco']),
    nomeComercial: findColumnIndex(headers, ['nome_comercial', 'nome comercial', 'nome', 'comercial']),
    acabamento: findColumnIndex(headers, ['acabamento', 'acabam', 'finish']),
    dimensoes: findColumnIndex(headers, ['dimensoes', 'dimensões', 'dim']),
    comprimento: findColumnIndex(headers, ['comprimento_cm', 'comprimento', 'comp', 'c']),
    largura: findColumnIndex(headers, ['largura_cm', 'largura', 'larg', 'l']),
    altura: findColumnIndex(headers, ['altura_cm', 'altura', 'alt', 'h']),
    espessura: findColumnIndex(headers, ['espessura_cm', 'espessura', 'esp', 'e']),
    pesoTon: findColumnIndex(headers, ['peso_ton', 'peso ton', 'peso', 'ton', 'toneladas']),
    parqueMM: findColumnIndex(headers, ['parque_mm', 'parque mm', 'parquemm', 'parque', 'local', 'localizacao', 'localização']),
    linha: findColumnIndex(headers, ['linha', 'corredor', 'fila', 'posicao', 'posição']),
    origem: findColumnIndex(headers, ['origem_material', 'origem material', 'origem', 'proveniencia', 'proveniência']),
    quantidade: findColumnIndex(headers, ['quantidade', 'qtd', 'qty', 'un', 'unidades']),
    observacoes: findColumnIndex(headers, ['notas', 'observacoes', 'observações', 'obs', 'danos', 'defeitos']),
    foto1: findColumnIndex(headers, ['foto1_url', 'foto1', 'foto', 'imagem', 'url']),
    foto2: findColumnIndex(headers, ['foto2_url', 'foto2']),
    foto3: findColumnIndex(headers, ['foto3_url', 'foto3']),
    foto4: findColumnIndex(headers, ['foto4_url', 'foto4']),
  };

  if (colMap.idmm === -1) colMap.idmm = 0;
  if (colMap.tipoPedra === -1) colMap.tipoPedra = 1;

  const linhasParsed: LinhaExcelBlocos[] = [];

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as (string | number | undefined)[];
    
    if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) {
      continue;
    }

    const idmm = String(row[colMap.idmm] || '').trim();
    if (!idmm) continue;

    const erros: string[] = [];
    const avisos: string[] = [];

    // MAPEAMENTO CORRIGIDO: Excel "Variedade" → DB "tipo_pedra"
    // Coluna Excel "Tipo_pedra" do modelo é ignorada para este campo
    const variedadeRaw = colMap.variedade !== -1 ? String(row[colMap.variedade] || '').trim() : '';
    const tipoPedra = variedadeRaw || 'Não Informada';

    // variedade do LinhaExcel fica vazia (só usamos para tipoPedra)
    const variedade = '';
    const origemBloco = colMap.origemBloco !== -1 ? String(row[colMap.origemBloco] || '').trim() : '';

    const parqueMMRaw = String(row[colMap.parqueMM] || '').trim();
    const linhaRaw = colMap.linha !== -1 ? String(row[colMap.linha] || '').trim() : '';
    
    if (!parqueMMRaw) {
      erros.push('Parque MM é obrigatório');
    }
    
    const local = encontrarLocal(locais, parqueMMRaw);
    if (parqueMMRaw && !local) {
      erros.push(`Parque MM "${parqueMMRaw}" não encontrado na tabela de locais`);
    }

    let dimensoes: { comprimento?: number; largura?: number; altura?: number } = {};
    if (colMap.dimensoes !== -1 && row[colMap.dimensoes]) {
      dimensoes = parseDimensoes(row[colMap.dimensoes]);
    } else {
      dimensoes = {
        comprimento: colMap.comprimento !== -1 ? Number(row[colMap.comprimento]) || undefined : undefined,
        largura: colMap.largura !== -1 ? Number(row[colMap.largura]) || undefined : undefined,
        altura: colMap.altura !== -1 ? Number(row[colMap.altura]) || undefined : undefined,
      };
    }

    const espessura = colMap.espessura !== -1 ? Number(row[colMap.espessura]) || undefined : undefined;
    const pesoTon = colMap.pesoTon !== -1 ? Number(row[colMap.pesoTon]) || undefined : undefined;
    const quantidade = colMap.quantidade !== -1 ? Number(row[colMap.quantidade]) || 1 : 1;
    
    if (quantidade <= 0) erros.push('Quantidade deve ser maior que 0');
    
    // Peso obrigatório para blocos
    if (!pesoTon) erros.push('Peso (ton) é obrigatório para blocos');

    const origemRaw = colMap.origem !== -1 ? String(row[colMap.origem] || '') : '';
    const origemMaterial = mapOrigemMaterial(origemRaw);

    const nomeComercial = colMap.nomeComercial !== -1 ? String(row[colMap.nomeComercial] || '').trim() : undefined;
    const acabamento = colMap.acabamento !== -1 ? String(row[colMap.acabamento] || '').trim() : undefined;
    const observacoes = colMap.observacoes !== -1 ? String(row[colMap.observacoes] || '').trim() : '';

    const produtoExiste = produtosExistentes.has(idmm.toLowerCase());
    if (produtoExiste) {
      avisos.push('Produto já existe - será criado apenas o movimento');
    }

    const fotos: string[] = [];
    const fotoColumns = [colMap.foto1, colMap.foto2, colMap.foto3, colMap.foto4];
    for (const fotoIdx of fotoColumns) {
      if (fotoIdx !== -1 && row[fotoIdx]) {
        const fotoUrl = String(row[fotoIdx]).trim();
        if (fotoUrl.startsWith('http://') || fotoUrl.startsWith('https://')) {
          fotos.push(fotoUrl);
        }
      }
    }

    linhasParsed.push({
      rowIndex: i + 1,
      idmm,
      tipoPedra,
      variedade,
      origemBloco: origemBloco || undefined,
      forma: 'bloco',
      nomeComercial: nomeComercial || undefined,
      acabamento: acabamento || undefined,
      comprimento: dimensoes.comprimento,
      largura: dimensoes.largura,
      altura: dimensoes.altura,
      espessura,
      pesoTon,
      parqueMM: parqueMMRaw,
      linha: linhaRaw || undefined,
      origemMaterial,
      quantidade,
      observacoes: observacoes || undefined,
      fotos: fotos.length > 0 ? fotos : undefined,
      erros,
      avisos,
      produtoExiste,
      localId: local?.id,
    });
  }

  return linhasParsed;
}

// ===================== PARSE CHAPAS =====================
function parseChapas(
  jsonData: unknown[][],
  headers: string[],
  locais: Local[],
  produtosExistentes: Map<string, string>
): LinhaExcelChapas[] {
  const colMap = {
    idmm: findColumnIndex(headers, ['id_mm_bloco', 'id_mm', 'idmm', 'id mm bloco', 'id-mm']),
    tipoPedra: findColumnIndex(headers, ['tipo_pedra', 'tipo pedra', 'tipo', 'material', 'pedra']),
    variedade: findColumnIndex(headers, ['variedade', 'variety']),
    origemBloco: findColumnIndex(headers, ['origem_bloco', 'origem bloco', 'origembloco', 'origem do bloco']),
    origem: findColumnIndex(headers, ['origem_material', 'origem material', 'origem']),
    parqueMM: findColumnIndex(headers, ['parque_mm', 'parque mm', 'parquemm', 'parque', 'local']),
    linha: findColumnIndex(headers, ['linha', 'corredor', 'fila', 'posicao']),
    pesoBloco: findColumnIndex(headers, ['peso_bloco_ton', 'peso_bloco', 'peso bloco', 'peso']),
    observacoes: findColumnIndex(headers, ['notas', 'observacoes', 'observações', 'obs']),
  };

  // Mapeamento das 4 pargas
  const pargaColumns = [1, 2, 3, 4].map(n => ({
    nome: findColumnIndex(headers, [`parga${n}_nome`, `parga${n}nome`, `parga ${n} nome`]),
    quantidade: findColumnIndex(headers, [`parga${n}_quantidade`, `parga${n}quantidade`, `parga ${n} quantidade`, `parga${n}_qtd`]),
    comprimento: findColumnIndex(headers, [`parga${n}_comprimento_cm`, `parga${n}comprimentocm`, `parga${n}_comprimento`]),
    altura: findColumnIndex(headers, [`parga${n}_altura_cm`, `parga${n}alturacm`, `parga${n}_altura`]),
    espessura: findColumnIndex(headers, [`parga${n}_espessura_cm`, `parga${n}espessuracm`, `parga${n}_espessura`]),
    foto1: findColumnIndex(headers, [`parga${n}_foto1_url`, `parga${n}foto1url`, `parga${n}_foto1`]),
    foto2: findColumnIndex(headers, [`parga${n}_foto2_url`, `parga${n}foto2url`, `parga${n}_foto2`]),
  }));

  if (colMap.idmm === -1) colMap.idmm = 0;
  if (colMap.tipoPedra === -1) colMap.tipoPedra = 1;

  const linhasParsed: LinhaExcelChapas[] = [];

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as (string | number | undefined)[];
    
    if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) {
      continue;
    }

    const idmm = String(row[colMap.idmm] || '').trim();
    if (!idmm) continue;

    const erros: string[] = [];
    const avisos: string[] = [];

    // MAPEAMENTO CORRIGIDO: Excel "Variedade" → DB "tipo_pedra"
    const variedadeRaw = colMap.variedade !== -1 ? String(row[colMap.variedade] || '').trim() : '';
    const tipoPedra = variedadeRaw || 'Não Informada';

    const variedade = '';
    const origemBloco = colMap.origemBloco !== -1 ? String(row[colMap.origemBloco] || '').trim() : '';

    const parqueMMRaw = String(row[colMap.parqueMM] || '').trim();
    const linhaRaw = colMap.linha !== -1 ? String(row[colMap.linha] || '').trim() : '';
    
    if (!parqueMMRaw) {
      erros.push('Parque MM é obrigatório');
    }
    
    const local = encontrarLocal(locais, parqueMMRaw);
    if (parqueMMRaw && !local) {
      erros.push(`Parque MM "${parqueMMRaw}" não encontrado na tabela de locais`);
    }

    const origemRaw = colMap.origem !== -1 ? String(row[colMap.origem] || '') : '';
    const origemMaterial = mapOrigemMaterial(origemRaw);

    const pesoBloco = colMap.pesoBloco !== -1 ? Number(row[colMap.pesoBloco]) || undefined : undefined;
    const observacoes = colMap.observacoes !== -1 ? String(row[colMap.observacoes] || '').trim() : '';

    // Parse das 4 pargas
    const pargas: [PargaExcel, PargaExcel, PargaExcel, PargaExcel] = [
      { nome: undefined, quantidade: undefined, comprimento: undefined, altura: undefined, espessura: undefined, foto1Url: undefined, foto2Url: undefined },
      { nome: undefined, quantidade: undefined, comprimento: undefined, altura: undefined, espessura: undefined, foto1Url: undefined, foto2Url: undefined },
      { nome: undefined, quantidade: undefined, comprimento: undefined, altura: undefined, espessura: undefined, foto1Url: undefined, foto2Url: undefined },
      { nome: undefined, quantidade: undefined, comprimento: undefined, altura: undefined, espessura: undefined, foto1Url: undefined, foto2Url: undefined },
    ];

    let quantidadeTotal = 0;
    let algumaPargaPreenchida = false;

    for (let p = 0; p < 4; p++) {
      const pc = pargaColumns[p];
      const nome = pc.nome !== -1 ? String(row[pc.nome] || '').trim() : undefined;
      const quantidade = pc.quantidade !== -1 ? Number(row[pc.quantidade]) || 0 : 0;
      const comprimento = pc.comprimento !== -1 ? Number(row[pc.comprimento]) || undefined : undefined;
      const altura = pc.altura !== -1 ? Number(row[pc.altura]) || undefined : undefined;
      const espessura = pc.espessura !== -1 ? Number(row[pc.espessura]) || undefined : undefined;
      const foto1Url = pc.foto1 !== -1 ? String(row[pc.foto1] || '').trim() : undefined;
      const foto2Url = pc.foto2 !== -1 ? String(row[pc.foto2] || '').trim() : undefined;

      if (quantidade > 0) {
        algumaPargaPreenchida = true;
        quantidadeTotal += quantidade;

        // Validar medidas obrigatórias
        if (!comprimento) erros.push(`Parga ${p + 1}: Comprimento é obrigatório`);
        if (!altura) erros.push(`Parga ${p + 1}: Altura é obrigatória`);
        if (!espessura) erros.push(`Parga ${p + 1}: Espessura é obrigatória`);

        // Validar foto obrigatória (apenas 1ª chapa)
        const foto1Valida = foto1Url && (foto1Url.startsWith('http://') || foto1Url.startsWith('https://'));
        if (!foto1Valida) erros.push(`Parga ${p + 1}: Foto da 1ª chapa é obrigatória`);
      }

      pargas[p] = {
        nome: nome || undefined,
        quantidade: quantidade || undefined,
        comprimento,
        altura,
        espessura,
        foto1Url: foto1Url && foto1Url.startsWith('http') ? foto1Url : undefined,
        foto2Url: foto2Url && foto2Url.startsWith('http') ? foto2Url : undefined,
      };
    }

    if (!algumaPargaPreenchida) {
      erros.push('Pelo menos uma parga deve estar preenchida com quantidade > 0');
    }

    if (quantidadeTotal <= 0) {
      erros.push('Quantidade total de chapas deve ser > 0');
    }

    const produtoExiste = produtosExistentes.has(idmm.toLowerCase());
    if (produtoExiste) {
      avisos.push('Produto já existe - será criado apenas o movimento');
    }

    linhasParsed.push({
      rowIndex: i + 1,
      idmm,
      tipoPedra,
      variedade,
      origemBloco: origemBloco || undefined,
      forma: 'chapa',
      parqueMM: parqueMMRaw,
      linha: linhaRaw || undefined,
      origemMaterial,
      pesoBloco,
      pargas,
      quantidadeTotal,
      observacoes: observacoes || undefined,
      erros,
      avisos,
      produtoExiste,
      localId: local?.id,
    });
  }

  return linhasParsed;
}

// ===================== PARSE LADRILHOS =====================
function parseLadrilhos(
  jsonData: unknown[][],
  headers: string[],
  locais: Local[],
  produtosExistentes: Map<string, string>
): LinhaExcelLadrilhos[] {
  const colMap = {
    idmm: findColumnIndex(headers, ['id_mm', 'idmm', 'id mm', 'id-mm', 'codigo', 'ref']),
    tipoPedra: findColumnIndex(headers, ['tipo_pedra', 'tipo pedra', 'tipo', 'material', 'pedra']),
    variedade: findColumnIndex(headers, ['variedade', 'variety']),
    origem: findColumnIndex(headers, ['origem_material', 'origem material', 'origem']),
    parqueMM: findColumnIndex(headers, ['parque_mm', 'parque mm', 'parquemm', 'parque', 'local']),
    linha: findColumnIndex(headers, ['linha', 'corredor', 'fila', 'posicao']),
    comprimento: findColumnIndex(headers, ['comprimento_cm', 'comprimento', 'comp', 'comprimento (cm)']),
    largura: findColumnIndex(headers, ['largura_cm', 'largura', 'larg', 'largura (cm)']),
    espessura: findColumnIndex(headers, ['espessura_cm', 'espessura', 'esp', 'espessura (cm)']),
    quantidade: findColumnIndex(headers, ['quantidade', 'qtd', 'qty', 'un', 'unidades', 'quantidade de chapas', 'num_pecas']),
    totalM2: findColumnIndex(headers, ['total mt2', 'total m2', 'total_m2', 'mt2', 'm2', 'area_m2', 'area']),
    acabamento: findColumnIndex(headers, ['acabamento', 'acabam', 'finish']),
    nomeComercial: findColumnIndex(headers, ['nome_comercial', 'nome comercial', 'nome', 'comercial']),
    observacoes: findColumnIndex(headers, ['notas', 'observacoes', 'observações', 'obs', 'nota']),
    foto1: findColumnIndex(headers, ['foto1_url', 'foto1', 'foto']),
    foto2: findColumnIndex(headers, ['foto2_url', 'foto2']),
  };

  // ID_MM pode não existir no ficheiro — gerar automaticamente MML01, MML02, ...
  const hasIdmmColumn = colMap.idmm !== -1;
  if (!hasIdmmColumn) {
    // Não forçar coluna 0 como idmm
  }
  if (colMap.tipoPedra === -1) colMap.tipoPedra = 1;

  const linhasParsed: LinhaExcelLadrilhos[] = [];
  let autoIdCounter = 1;

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as (string | number | undefined)[];
    
    if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) {
      continue;
    }

    // Gerar IDMM automaticamente se a coluna não existir
    let idmm: string;
    if (hasIdmmColumn) {
      idmm = String(row[colMap.idmm] || '').trim();
      if (!idmm) continue;
    } else {
      idmm = `MML${String(autoIdCounter).padStart(2, '0')}`;
      autoIdCounter++;
    }

    const erros: string[] = [];
    const avisos: string[] = [];

    // MAPEAMENTO CORRIGIDO: Excel "Variedade" → DB "tipo_pedra"
    const variedadeRaw = colMap.variedade !== -1 ? String(row[colMap.variedade] || '').trim() : '';
    const tipoPedra = variedadeRaw || 'Não confirmada';

    // Parque padrão MM001 se não existir no ficheiro
    const parqueMMRaw = colMap.parqueMM !== -1 ? String(row[colMap.parqueMM] || '').trim() : '';
    const parqueMM = parqueMMRaw || 'MM001';
    const linhaRaw = colMap.linha !== -1 ? String(row[colMap.linha] || '').trim() : '';
    
    const local = encontrarLocal(locais, parqueMM);
    if (!local) {
      erros.push(`Parque MM "${parqueMM}" não encontrado na tabela de locais`);
    }

    const origemRaw = colMap.origem !== -1 ? String(row[colMap.origem] || '') : '';
    const origemMaterial = mapOrigemMaterial(origemRaw);

    // Dimensões: default 0 se vazio ou inválido
    const comprimento = colMap.comprimento !== -1 ? Number(row[colMap.comprimento]) || 0 : 0;
    const largura = colMap.largura !== -1 ? Number(row[colMap.largura]) || 0 : 0;
    const espessura = colMap.espessura !== -1 ? Number(row[colMap.espessura]) || 0 : 0;
    const totalM2 = colMap.totalM2 !== -1 ? Number(row[colMap.totalM2]) || 0 : 0;
    const quantidadeRaw = colMap.quantidade !== -1 ? Number(row[colMap.quantidade]) || 0 : 0;

    // Calcular quantidade automaticamente: total m2 / área de cada peça
    let quantidade = quantidadeRaw;
    if (quantidade <= 0 && totalM2 > 0 && comprimento > 0 && largura > 0) {
      const areaPecaM2 = (comprimento * largura) / 10000; // cm² → m²
      quantidade = Math.round(totalM2 / areaPecaM2);
    }

    if (quantidade <= 0) erros.push('Não foi possível calcular a quantidade (verifique Total mt2 e dimensões)');

    const acabamento = colMap.acabamento !== -1 ? String(row[colMap.acabamento] || '').trim() : undefined;
    const nomeComercial = colMap.nomeComercial !== -1 ? String(row[colMap.nomeComercial] || '').trim() : undefined;
    const observacoes = colMap.observacoes !== -1 ? String(row[colMap.observacoes] || '').trim() : '';

    const produtoExiste = produtosExistentes.has(idmm.toLowerCase());
    if (produtoExiste) {
      avisos.push('Produto já existe - será criado apenas o movimento');
    }

    const fotos: string[] = [];
    const fotoColumns = [colMap.foto1, colMap.foto2];
    for (const fotoIdx of fotoColumns) {
      if (fotoIdx !== -1 && row[fotoIdx]) {
        const fotoUrl = String(row[fotoIdx]).trim();
        if (fotoUrl.startsWith('http://') || fotoUrl.startsWith('https://')) {
          fotos.push(fotoUrl);
        }
      }
    }

    linhasParsed.push({
      rowIndex: i + 1,
      idmm,
      tipoPedra,
      variedade: '',
      forma: 'ladrilho',
      parqueMM: parqueMM,
      linha: linhaRaw || undefined,
      origemMaterial,
      comprimento,
      largura,
      espessura,
      quantidade,
      acabamento: acabamento || undefined,
      nomeComercial: nomeComercial || undefined,
      observacoes: observacoes || undefined,
      fotos: fotos.length > 0 ? fotos : undefined,
      erros,
      avisos,
      produtoExiste,
      localId: local?.id,
    });
  }

  return linhasParsed;
}

// ===================== HOOK PARSE EXCEL =====================
export function useParseExcel() {
  const supabase = useSupabaseEmpresa();
  const [linhas, setLinhas] = useState<LinhaExcel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tipoAtual, setTipoAtual] = useState<TipoImportacao>('blocos');

  const parseFile = async (file: File, tipo: TipoImportacao = 'blocos') => {
    setIsLoading(true);
    setErro(null);
    setLinhas([]);
    setTipoAtual(tipo);

    try {
      const [locaisRes, produtosRes] = await Promise.all([
        supabase.from('locais').select('id, nome, codigo').eq('ativo', true),
        supabase.from('produtos').select('id, idmm').eq('ativo', true),
      ]);

      if (locaisRes.error) throw new Error('Erro ao carregar locais');
      
      // Se a query de produtos falhar (ex: recursão RLS na DB externa), continuar sem verificação
      let produtosExistentes = new Map<string, string>();
      if (produtosRes.error) {
        console.warn('Aviso: Não foi possível carregar produtos existentes, todos serão tratados como novos:', produtosRes.error.message);
      } else {
        produtosExistentes = new Map<string, string>(produtosRes.data.map((p: any) => [p.idmm.toLowerCase(), p.id]));
      }

      const locais = locaisRes.data as Local[];

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

      if (jsonData.length < 2) {
        throw new Error('O ficheiro não contém dados suficientes');
      }

      const headers = (jsonData[0] as string[]).map(h => String(h || '').toLowerCase().trim());

      let linhasParsed: LinhaExcel[];
      
      switch (tipo) {
        case 'chapas':
          linhasParsed = parseChapas(jsonData, headers, locais, produtosExistentes);
          break;
        case 'ladrilhos':
          linhasParsed = parseLadrilhos(jsonData, headers, locais, produtosExistentes);
          break;
        case 'blocos':
        default:
          linhasParsed = parseBlocos(jsonData, headers, locais, produtosExistentes);
          break;
      }

      setLinhas(linhasParsed);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao processar ficheiro');
    } finally {
      setIsLoading(false);
    }
  };

  const limpar = () => {
    setLinhas([]);
    setErro(null);
  };

  return {
    linhas,
    isLoading,
    erro,
    tipoAtual,
    parseFile,
    limpar,
  };
}

// ===================== HOOK EXECUTAR IMPORTAÇÃO =====================
export function useExecutarImportacao() {
  const supabase = useSupabaseEmpresa();
  const queryClient = useQueryClient();
  const { user, isSuperadmin } = useAuth();

  return useMutation({
    mutationFn: async ({ linhas, tipo }: { linhas: LinhaExcel[]; tipo: TipoImportacao }): Promise<ResultadoImportacao> => {
      if (!user) throw new Error('Utilizador não autenticado');
      if (!isSuperadmin) throw new Error('Apenas superadmins podem importar stock');

      const linhasValidas = linhas.filter(l => l.erros.length === 0);
      
      if (linhasValidas.length === 0) {
        throw new Error('Nenhuma linha válida para importar');
      }

      // Converter linhas para formato JSON que a RPC espera
      const rowsJson = linhasValidas.map(linha => {
        if (tipo === 'chapas') {
          const chapaLinha = linha as LinhaExcelChapas;
          return {
            tipo: 'chapa',
            idmm: chapaLinha.idmm,
            tipo_pedra: chapaLinha.tipoPedra,
            variedade: chapaLinha.variedade || undefined,
            origem_bloco: chapaLinha.origemBloco || undefined,
            forma: 'chapa',
            parque: chapaLinha.parqueMM,
            linha: chapaLinha.linha || undefined,
            peso_ton: chapaLinha.pesoBloco || undefined,
            quantidade: chapaLinha.quantidadeTotal,
            observacoes: chapaLinha.observacoes || undefined,
            // Pargas
            parga1_nome: chapaLinha.pargas[0]?.nome,
            parga1_quantidade: chapaLinha.pargas[0]?.quantidade,
            parga1_comprimento_cm: chapaLinha.pargas[0]?.comprimento,
            parga1_altura_cm: chapaLinha.pargas[0]?.altura,
            parga1_espessura_cm: chapaLinha.pargas[0]?.espessura,
            parga1_foto1_url: chapaLinha.pargas[0]?.foto1Url,
            parga1_foto2_url: chapaLinha.pargas[0]?.foto2Url,
            parga2_nome: chapaLinha.pargas[1]?.nome,
            parga2_quantidade: chapaLinha.pargas[1]?.quantidade,
            parga2_comprimento_cm: chapaLinha.pargas[1]?.comprimento,
            parga2_altura_cm: chapaLinha.pargas[1]?.altura,
            parga2_espessura_cm: chapaLinha.pargas[1]?.espessura,
            parga2_foto1_url: chapaLinha.pargas[1]?.foto1Url,
            parga2_foto2_url: chapaLinha.pargas[1]?.foto2Url,
            parga3_nome: chapaLinha.pargas[2]?.nome,
            parga3_quantidade: chapaLinha.pargas[2]?.quantidade,
            parga3_comprimento_cm: chapaLinha.pargas[2]?.comprimento,
            parga3_altura_cm: chapaLinha.pargas[2]?.altura,
            parga3_espessura_cm: chapaLinha.pargas[2]?.espessura,
            parga3_foto1_url: chapaLinha.pargas[2]?.foto1Url,
            parga3_foto2_url: chapaLinha.pargas[2]?.foto2Url,
            parga4_nome: chapaLinha.pargas[3]?.nome,
            parga4_quantidade: chapaLinha.pargas[3]?.quantidade,
            parga4_comprimento_cm: chapaLinha.pargas[3]?.comprimento,
            parga4_altura_cm: chapaLinha.pargas[3]?.altura,
            parga4_espessura_cm: chapaLinha.pargas[3]?.espessura,
            parga4_foto1_url: chapaLinha.pargas[3]?.foto1Url,
            parga4_foto2_url: chapaLinha.pargas[3]?.foto2Url,
          };
        } else if (tipo === 'ladrilhos') {
          const ladrilhoLinha = linha as LinhaExcelLadrilhos;
          return {
            tipo: 'ladrilho',
            idmm: ladrilhoLinha.idmm,
            tipo_pedra: ladrilhoLinha.tipoPedra,
            variedade: ladrilhoLinha.variedade || undefined,
            forma: 'ladrilho',
            parque: ladrilhoLinha.parqueMM,
            linha: ladrilhoLinha.linha || undefined,
            comprimento_cm: ladrilhoLinha.comprimento,
            largura_cm: ladrilhoLinha.largura,
            espessura_cm: ladrilhoLinha.espessura,
            quantidade: ladrilhoLinha.quantidade,
            acabamento: ladrilhoLinha.acabamento || undefined,
            nome_comercial: ladrilhoLinha.nomeComercial || undefined,
            observacoes: ladrilhoLinha.observacoes || undefined,
            foto1_url: ladrilhoLinha.fotos?.[0] || undefined,
            foto2_url: ladrilhoLinha.fotos?.[1] || undefined,
          };
        } else {
          // Blocos
          const blocoLinha = linha as LinhaExcelBlocos;
          return {
            tipo: 'bloco',
            idmm: blocoLinha.idmm,
            tipo_pedra: blocoLinha.tipoPedra,
            variedade: blocoLinha.variedade || undefined,
            origem_bloco: blocoLinha.origemBloco || undefined,
            forma: 'bloco',
            nome_comercial: blocoLinha.nomeComercial || undefined,
            acabamento: blocoLinha.acabamento || undefined,
            comprimento_cm: blocoLinha.comprimento || undefined,
            largura_cm: blocoLinha.largura || undefined,
            altura_cm: blocoLinha.altura || undefined,
            espessura_cm: blocoLinha.espessura || undefined,
            peso_ton: blocoLinha.pesoTon || undefined,
            parque: blocoLinha.parqueMM,
            linha: blocoLinha.linha || undefined,
            quantidade: blocoLinha.quantidade,
            observacoes: blocoLinha.observacoes || undefined,
            foto1_url: blocoLinha.fotos?.[0] || undefined,
            foto2_url: blocoLinha.fotos?.[1] || undefined,
            foto3_url: blocoLinha.fotos?.[2] || undefined,
            foto4_url: blocoLinha.fotos?.[3] || undefined,
          };
        }
      });

      // Chamar a RPC
      const { data, error } = await supabase.rpc('importar_stock_excel', {
        _rows: rowsJson as unknown as Record<string, unknown>[],
      });

      if (error) {
        console.error('Erro RPC importar_stock_excel:', error);

        const pgCode = (error as unknown as { code?: string }).code;
        const msg = String(error.message || '');
        if (pgCode === '42P01' && msg.toLowerCase().includes('auditoria')) {
          throw new Error(
            'Falha no backend: a tabela "auditoria" não existe. Crie a tabela e as respetivas políticas no backend antes de voltar a importar.'
          );
        }

        throw new Error(error.message || 'Erro ao executar importação');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Resposta inválida da função de importação');
      }

      const resultado = data as {
        sucesso: boolean;
        produtos_criados: number;
        movimentos_criados: number;
        linhas_ignoradas: number;
        linhas_processadas: number;
        erros: Array<{ linha: number; erro: string }>;
      };

      if (!resultado.sucesso) {
        const erros = Array.isArray(resultado.erros) ? resultado.erros : [];
        if (erros.length === 0) {
          throw new Error('A importação falhou, mas o backend não devolveu detalhes de erro.');
        }

        const maxItens = 6;
        const resumo = erros
          .slice(0, maxItens)
          .map((e) => `Linha ${e.linha}: ${e.erro}`)
          .join(' • ');

        const sufixo = erros.length > maxItens ? ` (e mais ${erros.length - maxItens})` : '';
        throw new Error(`A importação falhou. ${resumo}${sufixo}`);
      }

      return {
        sucesso: resultado.sucesso,
        totalLinhas: linhas.length,
        linhasProcessadas: resultado.linhas_processadas,
        produtosCriados: resultado.produtos_criados,
        movimentosCriados: resultado.movimentos_criados,
        linhasIgnoradas: resultado.linhas_ignoradas,
        erros: resultado.erros || [],
        dataHora: new Date().toISOString(),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['movimentos'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock-agregado'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
