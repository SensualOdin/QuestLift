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
      achievements: {
        Row: {
          category: string
          condition_type: string
          condition_value: number
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          reward_scraps: number | null
        }
        Insert: {
          category: string
          condition_type: string
          condition_value: number
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          reward_scraps?: number | null
        }
        Update: {
          category?: string
          condition_type?: string
          condition_value?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          reward_scraps?: number | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          equipment: string | null
          exercise_type: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          equipment?: string | null
          exercise_type: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          equipment?: string | null
          exercise_type?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      parties: {
        Row: {
          created_at: string
          id: string
          join_code: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          join_code: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          join_code?: string
          name?: string
        }
        Relationships: []
      }
      party_members: {
        Row: {
          joined_at: string
          party_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          joined_at?: string
          party_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          joined_at?: string
          party_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "party_members_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pr_hypes: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          to_user_id: string
          workout_set_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          to_user_id: string
          workout_set_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          to_user_id?: string
          workout_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pr_hypes_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_hypes_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_hypes_workout_set_id_fkey"
            columns: ["workout_set_id"]
            isOneToOne: false
            referencedRelation: "workout_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      raid_damage: {
        Row: {
          created_at: string
          damage: number
          damage_type: string
          id: string
          raid_id: string
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          damage: number
          damage_type?: string
          id?: string
          raid_id: string
          user_id: string
          workout_id: string
        }
        Update: {
          created_at?: string
          damage?: number
          damage_type?: string
          id?: string
          raid_id?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raid_damage_raid_id_fkey"
            columns: ["raid_id"]
            isOneToOne: false
            referencedRelation: "raids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raid_damage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raid_damage_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      raids: {
        Row: {
          boss_max_hp: number
          boss_name: string
          boss_resistance: string | null
          boss_weakness: string | null
          created_at: string
          end_time: string
          id: string
          party_id: string
          shield_hp: number | null
          shield_hp_current: number | null
          shield_type: string | null
          start_time: string
          status: string | null
        }
        Insert: {
          boss_max_hp: number
          boss_name: string
          boss_resistance?: string | null
          boss_weakness?: string | null
          created_at?: string
          end_time: string
          id?: string
          party_id: string
          shield_hp?: number | null
          shield_hp_current?: number | null
          shield_type?: string | null
          start_time: string
          status?: string | null
        }
        Update: {
          boss_max_hp?: number
          boss_name?: string
          boss_resistance?: string | null
          boss_weakness?: string | null
          created_at?: string
          end_time?: string
          id?: string
          party_id?: string
          shield_hp?: number | null
          shield_hp_current?: number | null
          shield_type?: string | null
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raids_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      roast_reports: {
        Row: {
          created_at: string
          id: string
          mvp_user_id: string | null
          party_id: string
          report_text: string
          slacker_user_id: string | null
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          mvp_user_id?: string | null
          party_id: string
          report_text: string
          slacker_user_id?: string | null
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          mvp_user_id?: string | null
          party_id?: string
          report_text?: string
          slacker_user_id?: string | null
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "roast_reports_mvp_user_id_fkey"
            columns: ["mvp_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roast_reports_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roast_reports_slacker_user_id_fkey"
            columns: ["slacker_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          cost: number
          created_at: string
          description: string | null
          id: string
          name: string
          preview_value: string | null
          rarity: string
          type: string
        }
        Insert: {
          cost: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          preview_value?: string | null
          rarity?: string
          type: string
        }
        Update: {
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          preview_value?: string | null
          rarity?: string
          type?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_purchases: {
        Row: {
          id: string
          item_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          class_name: string | null
          con_sets_lifetime: number | null
          created_at: string
          current_streak: number | null
          dex_minutes_lifetime: number | null
          display_name: string
          equipped_frame: string | null
          equipped_title: string | null
          id: string
          iron_scraps: number | null
          last_workout_date: string | null
          level: number | null
          str_volume_lifetime: number | null
          wis_minutes_lifetime: number | null
          xp_current: number | null
        }
        Insert: {
          avatar_url?: string | null
          class_name?: string | null
          con_sets_lifetime?: number | null
          created_at?: string
          current_streak?: number | null
          dex_minutes_lifetime?: number | null
          display_name: string
          equipped_frame?: string | null
          equipped_title?: string | null
          id: string
          iron_scraps?: number | null
          last_workout_date?: string | null
          level?: number | null
          str_volume_lifetime?: number | null
          wis_minutes_lifetime?: number | null
          xp_current?: number | null
        }
        Update: {
          avatar_url?: string | null
          class_name?: string | null
          con_sets_lifetime?: number | null
          created_at?: string
          current_streak?: number | null
          dex_minutes_lifetime?: number | null
          display_name?: string
          equipped_frame?: string | null
          equipped_title?: string | null
          id?: string
          iron_scraps?: number | null
          last_workout_date?: string | null
          level?: number | null
          str_volume_lifetime?: number | null
          wis_minutes_lifetime?: number | null
          xp_current?: number | null
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          is_pr: boolean | null
          reps: number | null
          rpe: number | null
          set_order: number
          weight: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          is_pr?: boolean | null
          reps?: number | null
          rpe?: number | null
          set_order: number
          weight?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          is_pr?: boolean | null
          reps?: number | null
          rpe?: number | null
          set_order?: number
          weight?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_exercises: {
        Row: {
          default_sets: number | null
          exercise_id: string
          id: string
          sort_order: number
          template_id: string
        }
        Insert: {
          default_sets?: number | null
          exercise_id: string
          id?: string
          sort_order: number
          template_id: string
        }
        Update: {
          default_sets?: number | null
          exercise_id?: string
          id?: string
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          name: string | null
          notes: string | null
          start_time: string
          total_volume: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          start_time: string
          total_volume?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          start_time?: string
          total_volume?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_hype_xp: {
        Args: { pr_owner_id: string; xp_amount: number }
        Returns: undefined
      }
      increment_xp: {
        Args: { user_id: string; xp_amount: number }
        Returns: undefined
      }
      is_party_member: {
        Args: { p_party_id: string; p_user_id: string }
        Returns: boolean
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
