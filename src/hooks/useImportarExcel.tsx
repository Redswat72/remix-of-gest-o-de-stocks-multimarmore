import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import * as XLSX from 'xlsx';
import type { FormaProduto, OrigemMaterial, TipoDocumento } from '@/types/database';

export interface LinhaExcel {
  rowIndex: number;
  idmm: string;
  variedade: string;
  forma: FormaProduto;
  comprimento?: number;
  largura?: number;
  altura?: number;
  espessura?: number;
  pesoTon?: number;
  localizacao: string;
  origemMaterial?: OrigemMaterial;
  quantidade: number;
  observacoes?: string;
  fotos?: string[];
  erros: string[];
  avisos: string[];
  produtoExiste: boolean;
  localId?: string;
}

export interface ResultadoImportacao {
  totalLinhas: number;
  linhasProcessadas: number;
  produtosCriados: number;
  movimentosCriados: number;
  erros: number;
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
      
      // Mapear colunas
      const colMap = {
        idmm: headers.findIndex(h => h.includes('id') && h.includes('mm') || h === 'idmm' || h === 'id mm'),
        variedade: headers.findIndex(h => h.includes('variedade') || h.includes('tipo') || h.includes('pedra') || h.includes('material')),
        forma: headers.findIndex(h => h.includes('forma') || h.includes('tipo produto')),
        dimensoes: headers.findIndex(h => h.includes('dimensões') || h.includes('dimensoes') || h.includes('dim')),
        comprimento: headers.findIndex(h => h.includes('comprimento') || h.includes('comp') || h === 'c'),
        largura: headers.findIndex(h => h.includes('largura') || h.includes('larg') || h === 'l'),
        altura: headers.findIndex(h => h.includes('altura') || h.includes('alt') || h === 'a' || h === 'h'),
        espessura: headers.findIndex(h => h.includes('espessura') || h.includes('esp') || h === 'e'),
        pesoTon: headers.findIndex(h => h.includes('peso') || h.includes('ton') || h === 'peso_ton' || h === 'pesoton'),
        localizacao: headers.findIndex(h => h.includes('localização') || h.includes('localizacao') || h.includes('local') || h.includes('parque')),
        origem: headers.findIndex(h => h.includes('origem') || h.includes('proveniência') || h.includes('proveniencia')),
        quantidade: headers.findIndex(h => h.includes('quantidade') || h.includes('qtd') || h.includes('qty') || h === 'un'),
        observacoes: headers.findIndex(h => h.includes('observações') || h.includes('observacoes') || h.includes('notas') || h.includes('danos') || h.includes('obs')),
        foto1: headers.findIndex(h => h.includes('foto') || h.includes('imagem') || h.includes('url')),
      };

      // Se IDMM não encontrado, tentar coluna A
      if (colMap.idmm === -1) colMap.idmm = 0;
      if (colMap.variedade === -1) colMap.variedade = 1;
      if (colMap.localizacao === -1) colMap.localizacao = headers.findIndex(h => !h.includes('enviado'));

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

        const localizacaoRaw = String(row[colMap.localizacao] || '').trim();
        const local = encontrarLocal(locais, localizacaoRaw);
        if (!local) {
          erros.push(`Local "${localizacaoRaw}" não encontrado`);
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

        // Validar peso obrigatório para blocos
        if (forma === 'bloco' && !pesoTon) {
          erros.push('Peso em toneladas é obrigatório para blocos');
        }

        const observacoes = colMap.observacoes !== -1 ? String(row[colMap.observacoes] || '').trim() : '';

        // Verificar se produto existe
        const produtoExiste = produtosExistentes.has(idmm.toLowerCase());
        if (produtoExiste) {
          avisos.push('Produto já existe - será criado apenas o movimento');
        }

        // Extrair fotos (até 4)
        const fotos: string[] = [];
        if (colMap.foto1 !== -1) {
          for (let j = 0; j < 4; j++) {
            const fotoIdx = colMap.foto1 + j;
            if (row[fotoIdx] && String(row[fotoIdx]).startsWith('http')) {
              fotos.push(String(row[fotoIdx]));
            }
          }
        }

        linhasParsed.push({
          rowIndex: i + 1,
          idmm,
          variedade,
          forma,
          comprimento: dimensoes.comprimento,
          largura: dimensoes.largura,
          altura: dimensoes.altura,
          espessura,
          pesoTon,
          localizacao: localizacaoRaw,
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (linhas: LinhaExcel[]): Promise<ResultadoImportacao> => {
      if (!user) throw new Error('Utilizador não autenticado');

      // Filtrar linhas válidas (sem erros)
      const linhasValidas = linhas.filter(l => l.erros.length === 0);
      
      if (linhasValidas.length === 0) {
        throw new Error('Nenhuma linha válida para importar');
      }

      let produtosCriados = 0;
      let movimentosCriados = 0;
      let erros = 0;

      // Buscar produtos existentes
      const { data: produtosExistentes } = await supabase
        .from('produtos')
        .select('id, idmm')
        .eq('ativo', true);

      const produtosMap = new Map(
        (produtosExistentes || []).map(p => [p.idmm.toLowerCase(), p.id])
      );

      for (const linha of linhasValidas) {
        try {
          let produtoId = produtosMap.get(linha.idmm.toLowerCase());

          // Criar produto se não existir
          if (!produtoId) {
            const { data: novoProduto, error: produtoError } = await supabase
              .from('produtos')
              .insert({
                idmm: linha.idmm,
                tipo_pedra: linha.variedade,
                forma: linha.forma,
                comprimento_cm: linha.comprimento || null,
                largura_cm: linha.largura || null,
                altura_cm: linha.altura || null,
                espessura_cm: linha.espessura || null,
                peso_ton: linha.pesoTon || null,
                observacoes: linha.observacoes || null,
                foto1_url: linha.fotos?.[0] || null,
                foto2_url: linha.fotos?.[1] || null,
                foto3_url: linha.fotos?.[2] || null,
                foto4_url: linha.fotos?.[3] || null,
              })
              .select('id')
              .single();

            if (produtoError) throw produtoError;
            
            produtoId = novoProduto.id;
            produtosMap.set(linha.idmm.toLowerCase(), produtoId);
            produtosCriados++;
          }

          // Criar movimento de entrada
          const { error: movimentoError } = await supabase
            .from('movimentos')
            .insert({
              tipo: 'entrada' as const,
              tipo_documento: 'sem_documento' as TipoDocumento,
              produto_id: produtoId,
              quantidade: linha.quantidade,
              local_destino_id: linha.localId,
              origem_material: linha.origemMaterial || null,
              observacoes: `Importação Excel: ${linha.observacoes || 'Sem observações'}`,
              operador_id: user.id,
            });

          if (movimentoError) throw movimentoError;
          movimentosCriados++;

        } catch (error) {
          console.error(`Erro na linha ${linha.rowIndex}:`, error);
          erros++;
        }
      }

      // Registar na auditoria
      await supabase.from('auditoria').insert({
        user_id: user.id,
        user_nome: 'Sistema',
        user_email: user.email || 'sistema@app',
        user_role: 'superadmin',
        tipo_acao: 'importacao_excel',
        entidade: 'stock',
        descricao: `Importação Excel: ${linhasValidas.length} linhas processadas, ${produtosCriados} produtos criados, ${movimentosCriados} movimentos criados, ${erros} erros`,
        dados_novos: {
          total_linhas: linhas.length,
          linhas_validas: linhasValidas.length,
          produtos_criados: produtosCriados,
          movimentos_criados: movimentosCriados,
          erros,
        },
      });

      return {
        totalLinhas: linhas.length,
        linhasProcessadas: linhasValidas.length,
        produtosCriados,
        movimentosCriados,
        erros,
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
