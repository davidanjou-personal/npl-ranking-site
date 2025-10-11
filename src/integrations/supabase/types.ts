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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      import_history: {
        Row: {
          created_at: string
          error_log: Json | null
          failed_rows: number
          file_name: string
          id: string
          imported_by: string
          successful_rows: number
          total_rows: number
        }
        Insert: {
          created_at?: string
          error_log?: Json | null
          failed_rows: number
          file_name: string
          id?: string
          imported_by: string
          successful_rows: number
          total_rows: number
        }
        Update: {
          created_at?: string
          error_log?: Json | null
          failed_rows?: number
          file_name?: string
          id?: string
          imported_by?: string
          successful_rows?: number
          total_rows?: number
        }
        Relationships: []
      }
      match_results: {
        Row: {
          created_at: string | null
          finishing_position: Database["public"]["Enums"]["finishing_position"]
          id: string
          match_id: string | null
          player_id: string | null
          points_awarded: number
        }
        Insert: {
          created_at?: string | null
          finishing_position: Database["public"]["Enums"]["finishing_position"]
          id?: string
          match_id?: string | null
          player_id?: string | null
          points_awarded?: number
        }
        Update: {
          created_at?: string | null
          finishing_position?: Database["public"]["Enums"]["finishing_position"]
          id?: string
          match_id?: string | null
          player_id?: string | null
          points_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          category: Database["public"]["Enums"]["player_category"]
          created_at: string | null
          created_by: string | null
          id: string
          import_id: string | null
          match_date: string
          tier: Database["public"]["Enums"]["tournament_tier"]
          tournament_name: string
        }
        Insert: {
          category: Database["public"]["Enums"]["player_category"]
          created_at?: string | null
          created_by?: string | null
          id?: string
          import_id?: string | null
          match_date: string
          tier?: Database["public"]["Enums"]["tournament_tier"]
          tournament_name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["player_category"]
          created_at?: string | null
          created_by?: string | null
          id?: string
          import_id?: string | null
          match_date?: string
          tier?: Database["public"]["Enums"]["tournament_tier"]
          tournament_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_history"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar_url: string | null
          country: string
          created_at: string | null
          date_of_birth: string | null
          dupr_id: string | null
          email: string | null
          gender: string
          id: string
          name: string
          player_code: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          country: string
          created_at?: string | null
          date_of_birth?: string | null
          dupr_id?: string | null
          email?: string | null
          gender: string
          id?: string
          name: string
          player_code: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string
          created_at?: string | null
          date_of_birth?: string | null
          dupr_id?: string | null
          email?: string | null
          gender?: string
          id?: string
          name?: string
          player_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      current_rankings: {
        Row: {
          category: Database["public"]["Enums"]["player_category"] | null
          country: string | null
          gender: string | null
          name: string | null
          player_id: string | null
          rank: number | null
          total_points: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      expiring_points: {
        Row: {
          category: Database["public"]["Enums"]["player_category"] | null
          country: string | null
          expiring_points: number | null
          name: string | null
          next_expiry_date: string | null
          player_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_rankings: {
        Row: {
          category: Database["public"]["Enums"]["player_category"] | null
          created_at: string | null
          id: string | null
          player_id: string | null
          rank: number | null
          total_points: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players_public: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          dupr_id: string | null
          gender: string | null
          id: string | null
          name: string | null
          player_code: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_audit_log: {
        Args: {
          _action: string
          _new_data?: Json
          _old_data?: Json
          _record_id: string
          _table_name: string
        }
        Returns: undefined
      }
      generate_player_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_player_ranking_summary: {
        Args: {
          p_category: Database["public"]["Enums"]["player_category"]
          p_player_id: string
        }
        Returns: {
          active_points: number
          active_rank: number
          expiring_points: number
          lifetime_points: number
          lifetime_rank: number
          next_expiry_date: string
        }[]
      }
      get_players_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          country: string
          created_at: string
          dupr_id: string
          gender: string
          id: string
          name: string
          player_code: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_player_rankings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      finishing_position:
        | "winner"
        | "second"
        | "third"
        | "fourth"
        | "quarterfinalist"
        | "round_of_16"
        | "event_win"
      match_result: "win" | "loss"
      player_category:
        | "mens_singles"
        | "womens_singles"
        | "mens_doubles"
        | "womens_doubles"
        | "mixed_doubles"
      tournament_tier: "tier1" | "tier2" | "tier3" | "tier4" | "historic"
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
      app_role: ["admin", "user"],
      finishing_position: [
        "winner",
        "second",
        "third",
        "fourth",
        "quarterfinalist",
        "round_of_16",
        "event_win",
      ],
      match_result: ["win", "loss"],
      player_category: [
        "mens_singles",
        "womens_singles",
        "mens_doubles",
        "womens_doubles",
        "mixed_doubles",
      ],
      tournament_tier: ["tier1", "tier2", "tier3", "tier4", "historic"],
    },
  },
} as const
