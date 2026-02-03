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
          foto1_url: string | null
          foto2_url: string | null
          foto3_url: string | null
          id: string
          idmm: string
          largura_cm: number | null
          latitude: number | null
          longitude: number | null
          nome_comercial: string | null
          observacoes: string | null
          tipo_pedra: string
          updated_at: string
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
          foto1_url?: string | null
          foto2_url?: string | null
          foto3_url?: string | null
          id?: string
          idmm: string
          largura_cm?: number | null
          latitude?: number | null
          longitude?: number | null
          nome_comercial?: string | null
          observacoes?: string | null
          tipo_pedra: string
          updated_at?: string
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
          foto1_url?: string | null
          foto2_url?: string | null
          foto3_url?: string | null
          id?: string
          idmm?: string
          largura_cm?: number | null
          latitude?: number | null
          longitude?: number | null
          nome_comercial?: string | null
          observacoes?: string | null
          tipo_pedra?: string
          updated_at?: string
          volume_m3?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          local_id: string | null
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          local_id?: string | null
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          local_id?: string | null
          nome?: string
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
