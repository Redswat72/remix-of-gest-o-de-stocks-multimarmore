// Tipos da base de dados Multimármore

export type AppRole = 'operador' | 'admin' | 'superadmin';
export type FormaProduto = 'bloco' | 'chapa' | 'ladrilho';
export type TipoMovimento = 'entrada' | 'transferencia' | 'saida';
export type TipoDocumento = 'guia_transporte' | 'guia_transferencia' | 'factura' | 'sem_documento';
export type OrigemMaterial = 'adquirido' | 'producao_propria';

export interface Local {
  id: string;
  codigo: string;
  nome: string;
  morada: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  local_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  local?: Local;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Cliente {
  id: string;
  nome: string;
  nif: string | null;
  morada: string | null;
  codigo_postal: string | null;
  localidade: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  idmm: string;
  tipo_pedra: string;
  nome_comercial: string | null;
  forma: FormaProduto;
  acabamento: string | null;
  comprimento_cm: number | null;
  largura_cm: number | null;
  altura_cm: number | null;
  espessura_cm: number | null;
  peso_ton: number | null;
  area_m2: number | null;
  volume_m3: number | null;
  linha: string | null;
  foto1_url: string | null;
  foto2_url: string | null;
  foto3_url: string | null;
  foto4_url: string | null;
  foto1_hd_url: string | null;
  foto2_hd_url: string | null;
  foto3_hd_url: string | null;
  foto4_hd_url: string | null;
  latitude: number | null;
  longitude: number | null;
  qr_code_url: string | null;
  qr_code_data: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Campos de pargas (apenas para chapas)
  parga1_nome: string | null;
  parga1_quantidade: number | null;
  parga2_nome: string | null;
  parga2_quantidade: number | null;
  parga3_nome: string | null;
  parga3_quantidade: number | null;
  parga4_nome: string | null;
  parga4_quantidade: number | null;
  quantidade_total_chapas: number | null;
}

export interface Stock {
  id: string;
  produto_id: string;
  local_id: string;
  quantidade: number;
  updated_at: string;
  produto?: Produto;
  local?: Local;
}

export interface Movimento {
  id: string;
  tipo: TipoMovimento;
  tipo_documento: TipoDocumento;
  numero_documento: string | null;
  origem_material: OrigemMaterial | null;
  produto_id: string;
  quantidade: number;
  local_origem_id: string | null;
  local_destino_id: string | null;
  cliente_id: string | null;
  matricula_viatura: string | null;
  operador_id: string;
  cancelado: boolean;
  cancelado_por: string | null;
  cancelado_em: string | null;
  motivo_cancelamento: string | null;
  observacoes: string | null;
  data_movimento: string;
  created_at: string;
  updated_at: string;
  produto?: Produto;
  local_origem?: Local;
  local_destino?: Local;
  cliente?: Cliente;
  operador?: Profile;
}

// Tipos para formulários
export interface MovimentoFormData {
  tipo: TipoMovimento;
  tipo_documento: TipoDocumento;
  numero_documento?: string;
  origem_material?: OrigemMaterial;
  produto_id: string;
  quantidade: number;
  local_origem_id?: string;
  local_destino_id?: string;
  cliente_id?: string;
  matricula_viatura?: string;
  observacoes?: string;
}

export interface ProdutoFormData {
  idmm: string;
  tipo_pedra: string;
  nome_comercial?: string;
  forma: FormaProduto;
  acabamento?: string;
  comprimento_cm?: number;
  largura_cm?: number;
  altura_cm?: number;
  espessura_cm?: number;
  peso_ton?: number;
  observacoes?: string;
  // Campos de pargas (apenas para chapas)
  parga1_nome?: string;
  parga1_quantidade?: number;
  parga2_nome?: string;
  parga2_quantidade?: number;
  parga3_nome?: string;
  parga3_quantidade?: number;
  parga4_nome?: string;
  parga4_quantidade?: number;
}

export interface ClienteFormData {
  nome: string;
  nif?: string;
  morada?: string;
  codigo_postal?: string;
  localidade?: string;
  telefone?: string;
  email?: string;
}

export interface LocalFormData {
  codigo: string;
  nome: string;
  morada?: string;
}
