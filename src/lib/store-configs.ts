import type { StoreConfig, CompanySlug } from '@/types/store';

export const STORE_CONFIGS: Record<CompanySlug, StoreConfig> = {
  multimarmore: {
    slug: 'multimarmore',
    displayName: 'Multimarmore',
    tagline: 'Crafting Iconic Elegance',
    email: 'info@multimarmore.pt',
    phone: '+351 268 891 650',
    whatsapp: '+351964922732',
    address: [
      'Olival Francisco Miguel',
      'Estrada Nacional 255 – Km 1,2',
      '7150-000 Borba – Portugal',
    ],
    heroTitle: 'Mármores, Granitos & Calcários de Excelência',
    heroSubtitle: 'Descubra a nossa coleção premium de pedra natural. Qualidade certificada com mais de 25 anos de experiência.',
    stats: [
      { value: '500+', label: 'Produtos Premium' },
      { value: '25+', label: 'Anos de Experiência' },
      { value: '50+', label: 'Países Servidos' },
    ],
  },
  magratex: {
    slug: 'magratex',
    displayName: 'Magratex',
    tagline: 'Natural Stone Excellence',
    email: 'info@magratex.pt',
    phone: '+351 268 891 650',
    whatsapp: '+351964922732',
    address: [
      'Olival Francisco Miguel',
      'Estrada Nacional 255 – Km 1,2',
      '7150-000 Borba – Portugal',
    ],
    heroTitle: 'Pedra Natural de Qualidade Superior',
    heroSubtitle: 'Blocos, chapas e ladrilho em mármore, granito e calcário. Entrega global com garantia de qualidade.',
    stats: [
      { value: '2000+', label: 'Itens em Stock' },
      { value: '25+', label: 'Anos de Experiência' },
      { value: '30+', label: 'Variedades' },
    ],
  },
};

export function getStoreConfig(slug: string): StoreConfig | null {
  return STORE_CONFIGS[slug as CompanySlug] ?? null;
}
