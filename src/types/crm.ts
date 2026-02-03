// Tipos preparados para integração futura com CRM
// Estrutura de metadados de produto e fotos HD

import type { Produto, FormaProduto } from './database';

/**
 * Metadados de uma foto HD para integração CRM
 * Estrutura padronizada para exportação
 */
export interface FotoHdMetadata {
  /** URL da foto HD */
  url: string;
  /** URL temporária assinada (signed URL) para partilha */
  signedUrl?: string;
  /** Slot da foto (F1, F2, F3, F4) */
  slot: 'F1' | 'F2' | 'F3' | 'F4';
  /** Label descritivo do lado (ex: "Lado A", "Frente") */
  label: string;
  /** IDMM do produto */
  idmm: string;
  /** Tipo de pedra */
  tipoPedra: string;
  /** Forma do produto */
  forma: FormaProduto;
  /** Data de expiração da URL assinada */
  expiresAt?: string;
}

/**
 * Dados comerciais do produto para CRM
 * Contém informação essencial para integração
 */
export interface ProdutoCrmData {
  /** Identificador único do produto */
  id: string;
  /** Código de identificação Multimármore */
  idmm: string;
  /** Tipo de pedra */
  tipoPedra: string;
  /** Nome comercial */
  nomeComercial: string | null;
  /** Forma do produto */
  forma: FormaProduto;
  /** Acabamento da pedra */
  acabamento: string | null;
  /** Dimensões */
  dimensoes: {
    comprimentoCm: number | null;
    larguraCm: number | null;
    alturaCm: number | null;
    espessuraCm: number | null;
  };
  /** Métricas calculadas */
  metricas: {
    areaM2: number | null;
    volumeM3: number | null;
  };
  /** Localização GPS */
  localizacao: {
    latitude: number | null;
    longitude: number | null;
  } | null;
  /** Fotos operacionais (comprimidas) */
  fotosOperacionais: string[];
  /** Fotos HD com metadados */
  fotosHd: FotoHdMetadata[];
  /** Observações */
  observacoes: string | null;
  /** Estado do produto */
  ativo: boolean;
  /** Data de criação */
  criadoEm: string;
  /** Data de última atualização */
  atualizadoEm: string;
}

/**
 * Dados para partilha comercial (links temporários)
 */
export interface PartilhaComercial {
  /** Dados básicos do produto */
  produto: {
    idmm: string;
    tipoPedra: string;
    nomeComercial: string | null;
    forma: FormaProduto;
    acabamento: string | null;
    dimensoesFormatadas: string | null;
    areaM2: number | null;
    volumeM3: number | null;
  };
  /** Links temporários das fotos HD */
  fotosHd: FotoHdMetadata[];
  /** Data de criação da partilha */
  criadoEm: string;
  /** Data de expiração dos links */
  expiraEm: string;
}

// Labels HD por forma do produto
export const HD_SLOT_LABELS: Record<FormaProduto, Record<string, string>> = {
  bloco: {
    F1: 'Lado A',
    F2: 'Lado B',
    F3: 'Lado C',
    F4: 'Lado D',
  },
  chapa: {
    F1: 'Frente',
    F2: 'Verso',
  },
  ladrilho: {
    F1: 'Frente',
    F2: 'Verso',
  },
};

/**
 * Número máximo de slots HD por forma
 */
export const HD_SLOTS_COUNT: Record<FormaProduto, number> = {
  bloco: 4,
  chapa: 2,
  ladrilho: 2,
};
