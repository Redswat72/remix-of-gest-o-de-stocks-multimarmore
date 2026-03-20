export type StoreProductType = 'bloco' | 'chapa' | 'ladrilho' | 'banda';
export type StoreProductStatus = 'disponivel' | 'reservado' | 'vendido';

export interface StoreProduct {
  id: string;
  internal_id: string;
  name: string;
  type: StoreProductType;
  status: StoreProductStatus;
  length: number | null;
  width: number | null;
  height: number | null;
  thickness: number | null;
  volume: number | null;
  weight: number | null;
  observations: string | null;
  images: string[];
  variety: string | null;
  finish: string | null;
  line: string | null;
  // Inventory-specific fields
  quantidade: number | null;
  unidade: string | null;         // 'ton' | 'm²'
  blocoOrigem: string | null;
  bundleId: string | null;
  numChapas: number | null;
  dimensoes: string | null;
  butchNo: string | null;
  numPecas: number | null;
  peso: number | null;
  acabamento: string | null;
  // Pargas (chapa sections with photos)
  pargas: StoreProductParga[];
}

export interface StoreProductParga {
  nome: string;
  quantidade: number | null;
  comprimento: number | null;
  altura: number | null;
  fotoPrimeira: string | null;
  fotoUltima: string | null;
}

export interface StoreFilters {
  search: string;
  types: StoreProductType[];
  stone: string;
  lengthRange: [number, number];
  widthRange: [number, number];
  heightRange: [number, number];
}

export const DEFAULT_STORE_FILTERS: StoreFilters = {
  search: '',
  types: [],
  stone: '',
  lengthRange: [0, 500],
  widthRange: [0, 300],
  heightRange: [0, 300],
};

export const STORE_PRODUCT_TYPE_KEYS: StoreProductType[] = [
  'bloco',
  'chapa',
  'ladrilho',
  'banda',
];

export const STORE_TYPE_LABELS: Record<StoreProductType, string> = {
  bloco: 'Blocos',
  chapa: 'Chapas',
  ladrilho: 'Ladrilho',
  banda: 'Bandas',
};

export const STORE_STATUS_LABELS: Record<StoreProductStatus, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
};

export type CompanySlug = 'multimarmore' | 'magratex';

export interface StoreConfig {
  slug: CompanySlug;
  displayName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string[];
  heroTitle: string;
  heroSubtitle: string;
  stats: { value: string; label: string }[];
}
