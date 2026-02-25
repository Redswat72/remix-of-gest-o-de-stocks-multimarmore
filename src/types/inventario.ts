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
  fornecedor: string | null;
  preco_unitario: number | null;
  valor_inventario: number | null;
  entrada_stock: string | null;
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
  created_at: string;
}

export interface Ladrilho {
  id: string;
  parque: string;
  dimensoes: string | null;
  largura: number | null;
  altura: number | null;
  num_pecas: number | null;
  quantidade_m2: number;
  peso: number | null;
  butch_no: string | null;
  variedade: string | null;
  preco_unitario: number | null;
  valor_inventario: number | null;
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
