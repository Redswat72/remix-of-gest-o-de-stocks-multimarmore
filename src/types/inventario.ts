export interface Bloco {
  id: string;
  id_mm: string;
  parque: string;
  linha: string | null;
  bloco_origem: string | null;
  comprimento: number | null;
  largura: number | null;
  altura: number | null;
  variedade: string | null;
  quantidade_tons: number;
  quantidade_kg: number | null;
  fornecedor: string | null;
  preco_unitario: number | null;
  valor_inventario: number | null;
  entrada_stock: string | null;
  foto1_url: string | null;
  foto2_url: string | null;
  created_at: string;
}

export interface Chapa {
  id: string;
  id_mm: string;
  bundle_id: string | null;
  parque: string;
  linha: string | null;
  num_chapas: number | null;
  largura: number | null;
  altura: number | null;
  variedade: string | null;
  quantidade_m2: number;
  fornecedor: string | null;
  preco_unitario: number | null;
  valor_inventario: number | null;
  entrada_stock: string | null;
  parga1_nome: string | null;
  parga1_quantidade: number | null;
  parga1_comprimento: number | null;
  parga1_altura: number | null;
  parga1_foto_primeira: string | null;
  parga1_foto_ultima: string | null;
  parga2_nome: string | null;
  parga2_quantidade: number | null;
  parga2_comprimento: number | null;
  parga2_altura: number | null;
  parga2_foto_primeira: string | null;
  parga2_foto_ultima: string | null;
  parga3_nome: string | null;
  parga3_quantidade: number | null;
  parga3_comprimento: number | null;
  parga3_altura: number | null;
  parga3_foto_primeira: string | null;
  parga3_foto_ultima: string | null;
  parga4_nome: string | null;
  parga4_quantidade: number | null;
  parga4_comprimento: number | null;
  parga4_altura: number | null;
  parga4_foto_primeira: string | null;
  parga4_foto_ultima: string | null;
  acabamento: string | null;
  created_at: string;
}

export interface Ladrilho {
  id: string;
  id_mm: string | null;
  parque: string;
  tipo: string | null;
  dimensoes: string | null;
  comprimento: number | null;
  largura: number | null;
  altura: number | null;
  espessura: number | null;
  num_pecas: number | null;
  quantidade_m2: number;
  peso: number | null;
  butch_no: string | null;
  variedade: string | null;
  acabamento: string | null;
  nota: string | null;
  valorizacao: number | null;
  preco_unitario: number | null;
  valor_inventario: number | null;
  entrada_stock: string | null;
  foto_amostra_url: string | null;
  created_at: string;
}

export interface Banda {
  id: string;
  idmm: string;
  parque: string;
  linha: string | null;
  largura: number | null;
  altura: number | null;
  espessura: number | null;
  variedade: string | null;
  quantidade_m2: number;
  fornecedor: string | null;
  preco_unitario: number | null;
  valor_inventario: number | null;
  entrada_stock: string | null;
  created_at: string;
}

export interface ResumoInventario {
  total_blocos: number;
  total_tons: number;
  total_chapas: number;
  total_m2_chapas: number;
  total_ladrilho: number;
  total_m2_ladrilho: number;
  valor_total: number;
}
