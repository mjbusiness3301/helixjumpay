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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          affiliate_id: string | null
          amount: number | null
          created_at: string
          event_type: string
          id: string
        }
        Insert: {
          affiliate_id?: string | null
          amount?: number | null
          created_at?: string
          event_type: string
          id?: string
        }
        Update: {
          affiliate_id?: string | null
          amount?: number | null
          created_at?: string
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          balance: number
          commission: number
          created_at: string
          deposit_value: number
          display_id: number
          email: string
          id: string
          name: string
          phone: string | null
          ref_code: string | null
          status: string
          total_deposits: number
          total_registrations: number
          trend: number
          user_id: string | null
        }
        Insert: {
          balance?: number
          commission?: number
          created_at?: string
          deposit_value?: number
          display_id?: number
          email: string
          id?: string
          name: string
          phone?: string | null
          ref_code?: string | null
          status?: string
          total_deposits?: number
          total_registrations?: number
          trend?: number
          user_id?: string | null
        }
        Update: {
          balance?: number
          commission?: number
          created_at?: string
          deposit_value?: number
          display_id?: number
          email?: string
          id?: string
          name?: string
          phone?: string | null
          ref_code?: string | null
          status?: string
          total_deposits?: number
          total_registrations?: number
          trend?: number
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_table: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount_cents: number
          bonus_cents: number
          confirmed_at: string | null
          created_at: string
          external_id: string | null
          id: string
          lead_id: string | null
          lead_name: string | null
          lead_phone: string | null
          pix_code: string | null
          status: string
        }
        Insert: {
          amount_cents: number
          bonus_cents?: number
          confirmed_at?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          pix_code?: string | null
          status?: string
        }
        Update: {
          amount_cents?: number
          bonus_cents?: number
          confirmed_at?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          pix_code?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_deposits"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          balance_source: string | null
          bet_cents: number
          created_at: string
          earned_cents: number
          ended_at: string | null
          id: string
          is_free_test: boolean
          lead_id: string | null
          lead_name: string | null
          platforms_passed: number
          result: string
          target_cents: number
        }
        Insert: {
          balance_source?: string | null
          bet_cents?: number
          created_at?: string
          earned_cents?: number
          ended_at?: string | null
          id?: string
          is_free_test?: boolean
          lead_id?: string | null
          lead_name?: string | null
          platforms_passed?: number
          result?: string
          target_cents?: number
        }
        Update: {
          balance_source?: string | null
          bet_cents?: number
          created_at?: string
          earned_cents?: number
          ended_at?: string | null
          id?: string
          is_free_test?: boolean
          lead_id?: string | null
          lead_name?: string | null
          platforms_passed?: number
          result?: string
          target_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_deposits"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_stats: {
        Row: {
          biggest_win_cents: number
          id: number
          online_players: number
          total_paid_today_cents: number
          updated_at: string
        }
        Insert: {
          biggest_win_cents?: number
          id?: number
          online_players?: number
          total_paid_today_cents?: number
          updated_at?: string
        }
        Update: {
          biggest_win_cents?: number
          id?: number
          online_players?: number
          total_paid_today_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          affiliate_id: string | null
          balance_cents: number
          bonus_balance_cents: number
          created_at: string
          id: string
          ip_address: string | null
          name: string
          password: string | null
          password_hash: string | null
          phone: string
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          affiliate_id?: string | null
          balance_cents?: number
          bonus_balance_cents?: number
          created_at?: string
          id?: string
          ip_address?: string | null
          name: string
          password?: string | null
          password_hash?: string | null
          phone: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          affiliate_id?: string | null
          balance_cents?: number
          bonus_balance_cents?: number
          created_at?: string
          id?: string
          ip_address?: string | null
          name?: string
          password?: string | null
          password_hash?: string | null
          phone?: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          id: string
          identifier: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          id?: string
          identifier: string
          success?: boolean
        }
        Update: {
          attempted_at?: string
          id?: string
          identifier?: string
          success?: boolean
        }
        Relationships: []
      }
      session_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          lead_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          lead_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          lead_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_tokens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_tokens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_tokens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_deposits"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          affiliate_email: string
          affiliate_id: string
          affiliate_name: string
          amount: number
          id: string
          requested_at: string
          status: string
        }
        Insert: {
          affiliate_email: string
          affiliate_id: string
          affiliate_name: string
          amount: number
          id?: string
          requested_at?: string
          status?: string
        }
        Update: {
          affiliate_email?: string
          affiliate_id?: string
          affiliate_name?: string
          amount?: number
          id?: string
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leads_safe: {
        Row: {
          affiliate_id: string | null
          balance_cents: number | null
          bonus_balance_cents: number | null
          created_at: string | null
          id: string | null
          ip_address: string | null
          name: string | null
          phone: string | null
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          affiliate_id?: string | null
          balance_cents?: number | null
          bonus_balance_cents?: number | null
          created_at?: string | null
          id?: string | null
          ip_address?: string | null
          name?: string | null
          phone?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          affiliate_id?: string | null
          balance_cents?: number | null
          bonus_balance_cents?: number | null
          created_at?: string | null
          id?: string | null
          ip_address?: string | null
          name?: string | null
          phone?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_with_deposits: {
        Row: {
          confirmed_deposits: number | null
          id: string | null
          name: string | null
          pending_deposits: number | null
          phone: string | null
          registered_at: string | null
          total_deposited_cents: number | null
          total_deposits: number | null
          total_pending_cents: number | null
        }
        Relationships: []
      }
      recent_deposits: {
        Row: {
          amount_cents: number | null
          confirmed_at: string | null
          created_at: string | null
          id: string | null
          lead_name: string | null
          lead_phone: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      deduct_balance: {
        Args: { p_amount: number; p_lead_id: string }
        Returns: number
      }
      increment_balance: {
        Args: { p_amount: number; p_lead_id: string }
        Returns: number
      }
      lead_get_by_token: { Args: { p_token: string }; Returns: Json }
      lead_login: {
        Args: { p_password: string; p_phone: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
