// Helpers para preparação de dados CRM
// Funções utilitárias para transformar dados de produtos

import type { Produto, FormaProduto } from '@/types/database';
import type { 
  ProdutoCrmData, 
  FotoHdMetadata, 
  PartilhaComercial 
} from '@/types/crm';
import { HD_SLOT_LABELS, HD_SLOTS_COUNT } from '@/types/crm';

/**
 * Formata dimensões do produto para exibição
 */
export function formatarDimensoes(produto: Produto): string | null {
  if (produto.forma === 'bloco') {
    if (produto.comprimento_cm && produto.largura_cm && produto.altura_cm) {
      return `${produto.comprimento_cm} × ${produto.largura_cm} × ${produto.altura_cm} cm`;
    }
  } else {
    if (produto.comprimento_cm && produto.largura_cm) {
      const dim = `${produto.comprimento_cm} × ${produto.largura_cm}`;
      if (produto.espessura_cm) {
        return `${dim} × ${produto.espessura_cm} cm`;
      }
      return `${dim} cm`;
    }
  }
  return null;
}

/**
 * Extrai URLs de fotos operacionais do produto
 */
export function extrairFotosOperacionais(produto: Produto): string[] {
  return [
    produto.foto1_url,
    produto.foto2_url,
    produto.foto3_url,
    produto.foto4_url,
  ].filter((url): url is string => Boolean(url));
}

/**
 * Extrai metadados de fotos HD do produto
 */
export function extrairFotosHd(produto: Produto): FotoHdMetadata[] {
  const fotos: FotoHdMetadata[] = [];
  const labels = HD_SLOT_LABELS[produto.forma];
  const maxSlots = HD_SLOTS_COUNT[produto.forma];
  
  const urls = [
    { url: produto.foto1_hd_url, slot: 'F1' as const },
    { url: produto.foto2_hd_url, slot: 'F2' as const },
    { url: produto.foto3_hd_url, slot: 'F3' as const },
    { url: produto.foto4_hd_url, slot: 'F4' as const },
  ];

  urls.forEach(({ url, slot }, index) => {
    if (url && index < maxSlots) {
      fotos.push({
        url,
        slot,
        label: labels[slot] || `Foto ${index + 1}`,
        idmm: produto.idmm,
        tipoPedra: produto.tipo_pedra,
        forma: produto.forma,
      });
    }
  });

  return fotos;
}

/**
 * Transforma produto em estrutura CRM
 */
export function transformarParaCrm(produto: Produto): ProdutoCrmData {
  return {
    id: produto.id,
    idmm: produto.idmm,
    tipoPedra: produto.tipo_pedra,
    nomeComercial: produto.nome_comercial,
    forma: produto.forma,
    acabamento: produto.acabamento,
    dimensoes: {
      comprimentoCm: produto.comprimento_cm,
      larguraCm: produto.largura_cm,
      alturaCm: produto.altura_cm,
      espessuraCm: produto.espessura_cm,
    },
    metricas: {
      areaM2: produto.area_m2,
      volumeM3: produto.volume_m3,
    },
    localizacao: produto.latitude && produto.longitude
      ? { latitude: produto.latitude, longitude: produto.longitude }
      : null,
    fotosOperacionais: extrairFotosOperacionais(produto),
    fotosHd: extrairFotosHd(produto),
    observacoes: produto.observacoes,
    ativo: produto.ativo,
    criadoEm: produto.created_at,
    atualizadoEm: produto.updated_at,
  };
}

/**
 * Prepara dados para partilha comercial
 */
export function prepararPartilhaComercial(
  produto: Produto,
  fotosHdComSignedUrls: FotoHdMetadata[],
  expiraEmHoras: number = 24
): PartilhaComercial {
  const agora = new Date();
  const expira = new Date(agora.getTime() + expiraEmHoras * 60 * 60 * 1000);

  return {
    produto: {
      idmm: produto.idmm,
      tipoPedra: produto.tipo_pedra,
      nomeComercial: produto.nome_comercial,
      forma: produto.forma,
      acabamento: produto.acabamento,
      dimensoesFormatadas: formatarDimensoes(produto),
      areaM2: produto.area_m2,
      volumeM3: produto.volume_m3,
    },
    fotosHd: fotosHdComSignedUrls,
    criadoEm: agora.toISOString(),
    expiraEm: expira.toISOString(),
  };
}

/**
 * Verifica se o produto tem fotos HD
 */
export function temFotosHd(produto: Produto): boolean {
  return Boolean(
    produto.foto1_hd_url ||
    produto.foto2_hd_url ||
    produto.foto3_hd_url ||
    produto.foto4_hd_url
  );
}

/**
 * Conta número de fotos HD do produto
 */
export function contarFotosHd(produto: Produto): number {
  return [
    produto.foto1_hd_url,
    produto.foto2_hd_url,
    produto.foto3_hd_url,
    produto.foto4_hd_url,
  ].filter(Boolean).length;
}
