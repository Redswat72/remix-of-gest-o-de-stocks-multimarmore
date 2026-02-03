import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import * as XLSX from 'xlsx';
import type { FormaProduto, OrigemMaterial } from '@/types/database';

export interface LinhaExcel {
  rowIndex: number;
  idmm: string;
  variedade: string;
  forma: FormaProduto;
  nomeComercial?: string;
  acabamento?: string;
  comprimento?: number;
  largura?: number;
  altura?: number;
  espessura?: number;
  pesoTon?: number;
  parqueMM: string;
  linha?: string;
  origemMaterial?: OrigemMaterial;
  quantidade: number;
  observacoes?: string;
  fotos?: string[];
  erros: string[];
  avisos: string[];
  produtoExiste: boolean;
  localId?: string;
}

// Interface para os dados que serão enviados à RPC
interface LinhaRPC {
  idmm: string;
  variedade: string;
  forma: string;
  nome_comercial?: string;
  acabamento?: string;
  comprimento_cm?: number;
  largura_cm?: number;
  altura_cm?: number;
  espessura_cm?: number;
  peso_ton?: number;
  parque: string;
  linha?: string;
  quantidade: number;
  observacoes?: string;
  foto1_url?: string;
  foto2_url?: string;
  foto3_url?: string;
  foto4_url?: string;
}

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

// Função para parsear dimensões do Excel (ex: "200x150x80" ou colunas separadas)
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

// Função para mapear forma do produto
function mapForma(valor: string | undefined): FormaProduto {
  if (!valor) return 'bloco';
  
  const v = String(valor).toLowerCase().trim();
  if (v.includes('chapa')) return 'chapa';
  if (v.includes('ladrilho') || v.includes('azulejo') || v.includes('mosaico')) return 'ladrilho';
  return 'bloco';
}

// Função para encontrar local pelo nome ou código
function encontrarLocal(locais: Local[], nomeOuCodigo: string): Local | undefined {
  if (!nomeOuCodigo) return undefined;
  
  const busca = String(nomeOuCodigo).toLowerCase().trim();
  return locais.find(l => 
    l.nome.toLowerCase() === busca || 
    l.codigo.toLowerCase() === busca ||
    l.nome.toLowerCase().includes(busca) ||
    busca.includes(l.codigo.toLowerCase())
  );
}

export function useParseExcel() {
  const [linhas, setLinhas] = useState<LinhaExcel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const parseFile = async (file: File) => {
    setIsLoading(true);
    setErro(null);
    setLinhas([]);

    try {
      // Buscar locais e produtos existentes
      const [locaisRes, produtosRes] = await Promise.all([
        supabase.from('locais').select('id, nome, codigo').eq('ativo', true),
        supabase.from('produtos').select('id, idmm').eq('ativo', true),
      ]);

      if (locaisRes.error) throw new Error('Erro ao carregar locais');
      if (produtosRes.error) throw new Error('Erro ao carregar produtos');

      const locais = locaisRes.data as Local[];
      const produtosExistentes = new Map(produtosRes.data.map(p => [p.idmm.toLowerCase(), p.id]));

      // Ler ficheiro Excel
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

      if (jsonData.length < 2) {
        throw new Error('O ficheiro não contém dados suficientes');
      }

      // Identificar cabeçalhos (primeira linha)
      const headers = (jsonData[0] as string[]).map(h => String(h || '').toLowerCase().trim());

      // Função auxiliar para normalizar nomes de colunas (remove acentos, underscores, espaços)
      const normalizeColumnName = (name: string): string => {
        return name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[_\s]+/g, '') // Remove underscores e espaços
          .trim();
      };

      // Função para encontrar coluna com correspondência flexível
      const findColumnIndex = (possibleNames: string[]): number => {
        const normalizedHeaders = headers.map(normalizeColumnName);
        const normalizedNames = possibleNames.map(normalizeColumnName);

        // Prioridade 1: Match exato
        for (const name of normalizedNames) {
          const idx = normalizedHeaders.indexOf(name);
          if (idx !== -1) return idx;
        }

        // Prioridade 2: Começa com
        for (const name of normalizedNames) {
          const idx = normalizedHeaders.findIndex(h => h.startsWith(name));
          if (idx !== -1) return idx;
        }

        // Prioridade 3: Contém (fallback)
        for (const name of normalizedNames) {
          const idx = normalizedHeaders.findIndex(h => h.includes(name));
          if (idx !== -1) return idx;
        }

        return -1;
      };

      // Mapear colunas com correspondência flexível
      const colMap = {
        idmm: findColumnIndex(['id_mm', 'idmm', 'id mm', 'id-mm', 'codigo', 'ref']),
        variedade: findColumnIndex(['variedade', 'tipo_pedra', 'tipo pedra', 'tipo', 'material', 'pedra']),
        nomeComercial: findColumnIndex(['nome_comercial', 'nome comercial', 'nome', 'comercial']),
        forma: findColumnIndex(['forma', 'tipo_produto', 'tipo produto', 'formato']),
        acabamento: findColumnIndex(['acabamento', 'acabam', 'finish']),
        dimensoes: findColumnIndex(['dimensoes', 'dimensões', 'dim']),
        comprimento: findColumnIndex(['comprimento_cm', 'comprimento', 'comp', 'c']),
        largura: findColumnIndex(['largura_cm', 'largura', 'larg', 'l']),
        altura: findColumnIndex(['altura_cm', 'altura', 'alt', 'h']),
        espessura: findColumnIndex(['espessura_cm', 'espessura', 'esp', 'e']),
        pesoTon: findColumnIndex(['peso_ton', 'peso ton', 'peso', 'ton', 'toneladas']),
        parqueMM: findColumnIndex(['parque_mm', 'parque mm', 'parquemm', 'parque', 'local', 'localizacao', 'localização']),
        linha: findColumnIndex(['linha', 'corredor', 'fila', 'posicao', 'posição']),
        origem: findColumnIndex(['origem_material', 'origem material', 'origem', 'proveniencia', 'proveniência']),
        quantidade: findColumnIndex(['quantidade', 'qtd', 'qty', 'un', 'unidades']),
        observacoes: findColumnIndex(['notas', 'observacoes', 'observações', 'obs', 'danos', 'defeitos']),
        foto1: findColumnIndex(['foto1_url', 'foto1', 'foto', 'imagem', 'url']),
        foto2: findColumnIndex(['foto2_url', 'foto2']),
        foto3: findColumnIndex(['foto3_url', 'foto3']),
        foto4: findColumnIndex(['foto4_url', 'foto4']),
        data: findColumnIndex(['data', 'data_registo', 'data registo', 'date']),
      };

      // Se IDMM não encontrado, tentar coluna A
      if (colMap.idmm === -1) colMap.idmm = 0;
      if (colMap.variedade === -1) colMap.variedade = 1;

      console.log('Colunas mapeadas:', { headers, colMap });

      const linhasParsed: LinhaExcel[] = [];

      // Processar linhas de dados (começar na linha 2)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as (string | number | undefined)[];
        
        // Ignorar linhas vazias
        if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) {
          continue;
        }

        const idmm = String(row[colMap.idmm] || '').trim();
        
        // Ignorar linhas sem IDMM
        if (!idmm) continue;

        const erros: string[] = [];
        const avisos: string[] = [];

        const variedade = String(row[colMap.variedade] || '').trim();
        if (!variedade) erros.push('Variedade/Tipo de pedra obrigatório');

        const parqueMMRaw = String(row[colMap.parqueMM] || '').trim();
        const linhaRaw = colMap.linha !== -1 ? String(row[colMap.linha] || '').trim() : '';
        
        if (!parqueMMRaw) {
          erros.push('Parque MM é obrigatório');
        }
        
        const local = encontrarLocal(locais, parqueMMRaw);
        if (parqueMMRaw && !local) {
          erros.push(`Parque MM "${parqueMMRaw}" não encontrado na tabela de locais`);
        }

        // Parsear dimensões
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

        const origemRaw = colMap.origem !== -1 ? String(row[colMap.origem] || '') : '';
        const origemMaterial = mapOrigemMaterial(origemRaw);

        const formaRaw = colMap.forma !== -1 ? String(row[colMap.forma] || '') : '';
        const forma = mapForma(formaRaw);

        const nomeComercial = colMap.nomeComercial !== -1 ? String(row[colMap.nomeComercial] || '').trim() : undefined;
        const acabamento = colMap.acabamento !== -1 ? String(row[colMap.acabamento] || '').trim() : undefined;
        const observacoes = colMap.observacoes !== -1 ? String(row[colMap.observacoes] || '').trim() : '';

        // Verificar se produto existe
        const produtoExiste = produtosExistentes.has(idmm.toLowerCase());
        if (produtoExiste) {
          avisos.push('Produto já existe - será criado apenas o movimento');
        }

        // Extrair fotos (até 4 - usando colunas individuais mapeadas)
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
          variedade,
          forma,
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
    parseFile,
    limpar,
  };
}

export function useExecutarImportacao() {
  const queryClient = useQueryClient();
  const { user, isSuperadmin } = useAuth();

  return useMutation({
    mutationFn: async (linhas: LinhaExcel[]): Promise<ResultadoImportacao> => {
      if (!user) throw new Error('Utilizador não autenticado');
      if (!isSuperadmin) throw new Error('Apenas superadmins podem importar stock');

      // Filtrar linhas válidas (sem erros)
      const linhasValidas = linhas.filter(l => l.erros.length === 0);
      
      if (linhasValidas.length === 0) {
        throw new Error('Nenhuma linha válida para importar');
      }

      // Converter linhas para formato JSON que a RPC espera
      const rowsJson: LinhaRPC[] = linhasValidas.map(linha => ({
        idmm: linha.idmm,
        variedade: linha.variedade,
        forma: linha.forma,
        nome_comercial: linha.nomeComercial || undefined,
        acabamento: linha.acabamento || undefined,
        comprimento_cm: linha.comprimento || undefined,
        largura_cm: linha.largura || undefined,
        altura_cm: linha.altura || undefined,
        espessura_cm: linha.espessura || undefined,
        peso_ton: linha.pesoTon || undefined,
        parque: linha.parqueMM,
        linha: linha.linha || undefined,
        quantidade: linha.quantidade,
        observacoes: linha.observacoes || undefined,
        foto1_url: linha.fotos?.[0] || undefined,
        foto2_url: linha.fotos?.[1] || undefined,
        foto3_url: linha.fotos?.[2] || undefined,
        foto4_url: linha.fotos?.[3] || undefined,
      }));

      // Chamar a RPC - única chamada ao backend
      const { data, error } = await supabase.rpc('importar_stock_excel', {
        _rows: rowsJson as unknown as Record<string, unknown>[],
      });

      if (error) {
        console.error('Erro RPC importar_stock_excel:', error);
        throw new Error(error.message || 'Erro ao executar importação');
      }

      // Verificar resposta da RPC
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
        throw new Error('A importação falhou. Verifique os erros retornados.');
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
