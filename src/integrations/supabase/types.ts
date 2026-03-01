export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          data_hora: string
          descricao: string
          entidade: string
          entidade_id: string | null
          id: string
          tipo_acao: string
          user_email: string
          user_id: string
          user_nome: string
          user_role: string
        }
        Insert: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_hora?: string
          descricao: string
          entidade: string
          entidade_id?: string | null
          id?: string
          tipo_acao: string
          user_email: string
          user_id: string
          user_nome: string
          user_role: string
        }
        Update: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_hora?: string
          descricao?: string
          entidade?: string
          entidade_id?: string | null
          id?: string
          tipo_acao?: string
          user_email?: string
          user_id?: string
          user_nome?: string
          user_role?: string
        }
        Relationships: []
      }
      blocos: {
        Row: {
          altura: number | null
          bloco_origem: string | null
          comprimento: number | null
          created_at: string
          entrada_stock: string | null
          fornecedor: string | null
          foto1_url: string | null
          foto2_url: string | null
          id: string
          id_mm: string
          largura: number | null
          linha: string | null
          parque: string
          preco_unitario: number | null
          quantidade_kg: number | null
          quantidade_tons: number
          valor_inventario: number | null
          variedade: string | null
        }
        Insert: {
          altura?: number | null
          bloco_origem?: string | null
          comprimento?: number | null
          created_at?: string
          entrada_stock?: string | null
          fornecedor?: string | null
          foto1_url?: string | null
          foto2_url?: string | null
          id?: string
          id_mm: string
          largura?: number | null
          linha?: string | null
          parque: string
          preco_unitario?: number | null
          quantidade_kg?: number | null
          quantidade_tons?: number
          valor_inventario?: number | null
          variedade?: string | null
        }
        Update: {
          altura?: number | null
          bloco_origem?: string | null
          comprimento?: number | null
          created_at?: string
          entrada_stock?: string | null
          fornecedor?: string | null
          foto1_url?: string | null
          foto2_url?: string | null
          id?: string
          id_mm?: string
          largura?: number | null
          linha?: string | null
          parque?: string
          preco_unitario?: number | null
          quantidade_kg?: number | null
          quantidade_tons?: number
          valor_inventario?: number | null
          variedade?: string | null
        }
        Relationships: []
      }
      chapas: {
        Row: {
          altura: number | null
          bundle_id: string | null
          created_at: string
          entrada_stock: string | null
          fornecedor: string | null
          id: string
          id_mm: string
          largura: number | null
          linha: string | null
          num_chapas: number | null
          parga1_altura: number | null
          parga1_comprimento: number | null
          parga1_foto_primeira: string | null
          parga1_foto_ultima: string | null
          parga1_nome: string | null
          parga1_quantidade: number | null
          parga2_altura: number | null
          parga2_comprimento: number | null
          parga2_foto_primeira: string | null
          parga2_foto_ultima: string | null
          parga2_nome: string | null
          parga2_quantidade: number | null
          parga3_altura: number | null
          parga3_comprimento: number | null
          parga3_foto_primeira: string | null
          parga3_foto_ultima: string | null
          parga3_nome: string | null
          parga3_quantidade: number | null
          parga4_altura: number | null
          parga4_comprimento: number | null
          parga4_foto_primeira: string | null
          parga4_foto_ultima: string | null
          parga4_nome: string | null
          parga4_quantidade: number | null
          parque: string
          preco_unitario: number | null
          quantidade_m2: number
          valor_inventario: number | null
          variedade: string | null
        }
        Insert: {
          altura?: number | null
          bundle_id?: string | null
          created_at?: string
          entrada_stock?: string | null
          fornecedor?: string | null
          id?: string
          id_mm: string
          largura?: number | null
          linha?: string | null
          num_chapas?: number | null
          parga1_altura?: number | null
          parga1_comprimento?: number | null
          parga1_foto_primeira?: string | null
          parga1_foto_ultima?: string | null
          parga1_nome?: string | null
          parga1_quantidade?: number | null
          parga2_altura?: number | null
          parga2_comprimento?: number | null
          parga2_foto_primeira?: string | null
          parga2_foto_ultima?: string | null
          parga2_nome?: string | null
          parga2_quantidade?: number | null
          parga3_altura?: number | null
          parga3_comprimento?: number | null
          parga3_foto_primeira?: string | null
          parga3_foto_ultima?: string | null
          parga3_nome?: string | null
          parga3_quantidade?: number | null
          parga4_altura?: number | null
          parga4_comprimento?: number | null
          parga4_foto_primeira?: string | null
          parga4_foto_ultima?: string | null
          parga4_nome?: string | null
          parga4_quantidade?: number | null
          parque: string
          preco_unitario?: number | null
          quantidade_m2?: number
          valor_inventario?: number | null
          variedade?: string | null
        }
        Update: {
          altura?: number | null
          bundle_id?: string | null
          created_at?: string
          entrada_stock?: string | null
          fornecedor?: string | null
          id?: string
          id_mm?: string
          largura?: number | null
          linha?: string | null
          num_chapas?: number | null
          parga1_altura?: number | null
          parga1_comprimento?: number | null
          parga1_foto_primeira?: string | null
          parga1_foto_ultima?: string | null
          parga1_nome?: string | null
          parga1_quantidade?: number | null
          parga2_altura?: number | null
          parga2_comprimento?: number | null
          parga2_foto_primeira?: string | null
          parga2_foto_ultima?: string | null
          parga2_nome?: string | null
          parga2_quantidade?: number | null
          parga3_altura?: number | null
          parga3_comprimento?: number | null
          parga3_foto_primeira?: string | null
          parga3_foto_ultima?: string | null
          parga3_nome?: string | null
          parga3_quantidade?: number | null
          parga4_altura?: number | null
          parga4_comprimento?: number | null
          parga4_foto_primeira?: string | null
          parga4_foto_ultima?: string | null
          parga4_nome?: string | null
          parga4_quantidade?: number | null
          parque?: string
          preco_unitario?: number | null
          quantidade_m2?: number
          valor_inventario?: number | null
          variedade?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          ativo: boolean
          codigo_postal: string | null
          created_at: string
          email: string | null
          id: string
          localidade: string | null
          morada: string | null
          nif: string | null
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          localidade?: string | null
          morada?: string | null
          nif?: string | null
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          localidade?: string | null
          morada?: string | null
          nif?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ladrilho: {
        Row: {
          acabamento: string | null
          altura: number | null
          butch_no: string | null
          comprimento: number | null
          created_at: string
          dimensoes: string | null
          entrada_stock: string | null
          espessura: number | null
          foto_amostra_url: string | null
          id: string
          id_mm: string | null
          largura: number | null
          nota: string | null
          num_pecas: number | null
          parque: string
          peso: number | null
          preco_unitario: number | null
          quantidade_m2: number
          tipo: string | null
          valor_inventario: number | null
          valorizacao: number | null
          variedade: string | null
        }
        Insert: {
          acabamento?: string | null
          altura?: number | null
          butch_no?: string | null
          comprimento?: number | null
          created_at?: string
          dimensoes?: string | null
          entrada_stock?: string | null
          espessura?: number | null
          foto_amostra_url?: string | null
          id?: string
          id_mm?: string | null
          largura?: number | null
          nota?: string | null
          num_pecas?: number | null
          parque: string
          peso?: number | null
          preco_unitario?: number | null
          quantidade_m2?: number
          tipo?: string | null
          valor_inventario?: number | null
          valorizacao?: number | null
          variedade?: string | null
        }
        Update: {
          acabamento?: string | null
          altura?: number | null
          butch_no?: string | null
          comprimento?: number | null
          created_at?: string
          dimensoes?: string | null
          entrada_stock?: string | null
          espessura?: number | null
          foto_amostra_url?: string | null
          id?: string
          id_mm?: string | null
          largura?: number | null
          nota?: string | null
          num_pecas?: number | null
          parque?: string
          peso?: number | null
          preco_unitario?: number | null
          quantidade_m2?: number
          tipo?: string | null
          valor_inventario?: number | null
          valorizacao?: number | null
          variedade?: string | null
        }
        Relationships: []
      }
      locais: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          morada: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          id?: string
          morada?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          morada?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      movimentos: {
        Row: {
          cancelado: boolean
          cancelado_em: string | null
          cancelado_por: string | null
          cliente_id: string | null
          created_at: string
          data_movimento: string
          id: string
          local_destino_id: string | null
          local_origem_id: string | null
          matricula_viatura: string | null
          motivo_cancelamento: string | null
          numero_documento: string | null
          observacoes: string | null
          operador_id: string
          origem_material: Database["public"]["Enums"]["origem_material"] | null
          produto_id: string
          quantidade: number
          tipo: Database["public"]["Enums"]["tipo_movimento"]
          tipo_documento: Database["public"]["Enums"]["tipo_documento"]
          updated_at: string
        }
        Insert: {
          cancelado?: boolean
          cancelado_em?: string | null
          cancelado_por?: string | null
          cliente_id?: string | null
          created_at?: string
          data_movimento?: string
          id?: string
          local_destino_id?: string | null
          local_origem_id?: string | null
          matricula_viatura?: string | null
          motivo_cancelamento?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          operador_id: string
          origem_material?:
            | Database["public"]["Enums"]["origem_material"]
            | null
          produto_id: string
          quantidade: number
          tipo: Database["public"]["Enums"]["tipo_movimento"]
          tipo_documento: Database["public"]["Enums"]["tipo_documento"]
          updated_at?: string
        }
        Update: {
          cancelado?: boolean
          cancelado_em?: string | null
          cancelado_por?: string | null
          cliente_id?: string | null
          created_at?: string
          data_movimento?: string
          id?: string
          local_destino_id?: string | null
          local_origem_id?: string | null
          matricula_viatura?: string | null
          motivo_cancelamento?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          operador_id?: string
          origem_material?:
            | Database["public"]["Enums"]["origem_material"]
            | null
          produto_id?: string
          quantidade?: number
          tipo?: Database["public"]["Enums"]["tipo_movimento"]
          tipo_documento?: Database["public"]["Enums"]["tipo_documento"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_local_destino_id_fkey"
            columns: ["local_destino_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_local_origem_id_fkey"
            columns: ["local_origem_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          acabamento: string | null
          altura_cm: number | null
          area_m2: number | null
          ativo: boolean
          comprimento_cm: number | null
          created_at: string
          espessura_cm: number | null
          forma: Database["public"]["Enums"]["forma_produto"]
          foto1_hd_url: string | null
          foto1_url: string | null
          foto2_hd_url: string | null
          foto2_url: string | null
          foto3_hd_url: string | null
          foto3_url: string | null
          foto4_hd_url: string | null
          foto4_url: string | null
          id: string
          idmm: string
          largura_cm: number | null
          latitude: number | null
          linha: string | null
          longitude: number | null
          nome_comercial: string | null
          observacoes: string | null
          origem_bloco: string | null
          parga1_altura_cm: number | null
          parga1_comprimento_cm: number | null
          parga1_espessura_cm: number | null
          parga1_foto1_url: string | null
          parga1_foto2_url: string | null
          parga1_nome: string | null
          parga1_quantidade: number | null
          parga2_altura_cm: number | null
          parga2_comprimento_cm: number | null
          parga2_espessura_cm: number | null
          parga2_foto1_url: string | null
          parga2_foto2_url: string | null
          parga2_nome: string | null
          parga2_quantidade: number | null
          parga3_altura_cm: number | null
          parga3_comprimento_cm: number | null
          parga3_espessura_cm: number | null
          parga3_foto1_url: string | null
          parga3_foto2_url: string | null
          parga3_nome: string | null
          parga3_quantidade: number | null
          parga4_altura_cm: number | null
          parga4_comprimento_cm: number | null
          parga4_espessura_cm: number | null
          parga4_foto1_url: string | null
          parga4_foto2_url: string | null
          parga4_nome: string | null
          parga4_quantidade: number | null
          peso_ton: number | null
          qr_code_data: string | null
          qr_code_url: string | null
          quantidade_total_chapas: number | null
          tipo_pedra: string
          updated_at: string
          valorizacao: number | null
          variedade: string | null
          volume_m3: number | null
        }
        Insert: {
          acabamento?: string | null
          altura_cm?: number | null
          area_m2?: number | null
          ativo?: boolean
          comprimento_cm?: number | null
          created_at?: string
          espessura_cm?: number | null
          forma: Database["public"]["Enums"]["forma_produto"]
          foto1_hd_url?: string | null
          foto1_url?: string | null
          foto2_hd_url?: string | null
          foto2_url?: string | null
          foto3_hd_url?: string | null
          foto3_url?: string | null
          foto4_hd_url?: string | null
          foto4_url?: string | null
          id?: string
          idmm: string
          largura_cm?: number | null
          latitude?: number | null
          linha?: string | null
          longitude?: number | null
          nome_comercial?: string | null
          observacoes?: string | null
          origem_bloco?: string | null
          parga1_altura_cm?: number | null
          parga1_comprimento_cm?: number | null
          parga1_espessura_cm?: number | null
          parga1_foto1_url?: string | null
          parga1_foto2_url?: string | null
          parga1_nome?: string | null
          parga1_quantidade?: number | null
          parga2_altura_cm?: number | null
          parga2_comprimento_cm?: number | null
          parga2_espessura_cm?: number | null
          parga2_foto1_url?: string | null
          parga2_foto2_url?: string | null
          parga2_nome?: string | null
          parga2_quantidade?: number | null
          parga3_altura_cm?: number | null
          parga3_comprimento_cm?: number | null
          parga3_espessura_cm?: number | null
          parga3_foto1_url?: string | null
          parga3_foto2_url?: string | null
          parga3_nome?: string | null
          parga3_quantidade?: number | null
          parga4_altura_cm?: number | null
          parga4_comprimento_cm?: number | null
          parga4_espessura_cm?: number | null
          parga4_foto1_url?: string | null
          parga4_foto2_url?: string | null
          parga4_nome?: string | null
          parga4_quantidade?: number | null
          peso_ton?: number | null
          qr_code_data?: string | null
          qr_code_url?: string | null
          quantidade_total_chapas?: number | null
          tipo_pedra: string
          updated_at?: string
          valorizacao?: number | null
          variedade?: string | null
          volume_m3?: number | null
        }
        Update: {
          acabamento?: string | null
          altura_cm?: number | null
          area_m2?: number | null
          ativo?: boolean
          comprimento_cm?: number | null
          created_at?: string
          espessura_cm?: number | null
          forma?: Database["public"]["Enums"]["forma_produto"]
          foto1_hd_url?: string | null
          foto1_url?: string | null
          foto2_hd_url?: string | null
          foto2_url?: string | null
          foto3_hd_url?: string | null
          foto3_url?: string | null
          foto4_hd_url?: string | null
          foto4_url?: string | null
          id?: string
          idmm?: string
          largura_cm?: number | null
          latitude?: number | null
          linha?: string | null
          longitude?: number | null
          nome_comercial?: string | null
          observacoes?: string | null
          origem_bloco?: string | null
          parga1_altura_cm?: number | null
          parga1_comprimento_cm?: number | null
          parga1_espessura_cm?: number | null
          parga1_foto1_url?: string | null
          parga1_foto2_url?: string | null
          parga1_nome?: string | null
          parga1_quantidade?: number | null
          parga2_altura_cm?: number | null
          parga2_comprimento_cm?: number | null
          parga2_espessura_cm?: number | null
          parga2_foto1_url?: string | null
          parga2_foto2_url?: string | null
          parga2_nome?: string | null
          parga2_quantidade?: number | null
          parga3_altura_cm?: number | null
          parga3_comprimento_cm?: number | null
          parga3_espessura_cm?: number | null
          parga3_foto1_url?: string | null
          parga3_foto2_url?: string | null
          parga3_nome?: string | null
          parga3_quantidade?: number | null
          parga4_altura_cm?: number | null
          parga4_comprimento_cm?: number | null
          parga4_espessura_cm?: number | null
          parga4_foto1_url?: string | null
          parga4_foto2_url?: string | null
          parga4_nome?: string | null
          parga4_quantidade?: number | null
          peso_ton?: number | null
          qr_code_data?: string | null
          qr_code_url?: string | null
          quantidade_total_chapas?: number | null
          tipo_pedra?: string
          updated_at?: string
          valorizacao?: number | null
          variedade?: string | null
          volume_m3?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          local_id: string | null
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          local_id?: string | null
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          local_id?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          id: string
          local_id: string
          produto_id: string
          quantidade: number
          updated_at: string
        }
        Insert: {
          id?: string
          local_id: string
          produto_id: string
          quantidade?: number
          updated_at?: string
        }
        Update: {
          id?: string
          local_id?: string
          produto_id?: string
          quantidade?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_local: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_above: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "operador" | "admin" | "superadmin"
      forma_produto: "bloco" | "chapa" | "ladrilho"
      origem_material: "adquirido" | "producao_propria"
      tipo_documento:
        | "guia_transporte"
        | "guia_transferencia"
        | "factura"
        | "sem_documento"
      tipo_movimento: "entrada" | "transferencia" | "saida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["operador", "admin", "superadmin"],
      forma_produto: ["bloco", "chapa", "ladrilho"],
      origem_material: ["adquirido", "producao_propria"],
      tipo_documento: [
        "guia_transporte",
        "guia_transferencia",
        "factura",
        "sem_documento",
      ],
      tipo_movimento: ["entrada", "transferencia", "saida"],
    },
  },
} as const
