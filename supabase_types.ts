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
      attendances: {
        Row: {
          attendance_type: string
          bukti_dinas_luar_url: string | null
          created_at: string | null
          has_surat_tugas: boolean | null
          id: string
          latitude: number
          longitude: number
          note: string | null
          photo_url: string
          status: string
          user_id: string | null
        }
        Insert: {
          attendance_type: string
          bukti_dinas_luar_url?: string | null
          created_at?: string | null
          has_surat_tugas?: boolean | null
          id?: string
          latitude: number
          longitude: number
          note?: string | null
          photo_url: string
          status?: string
          user_id?: string | null
        }
        Update: {
          attendance_type?: string
          bukti_dinas_luar_url?: string | null
          created_at?: string | null
          has_surat_tugas?: boolean | null
          id?: string
          latitude?: number
          longitude?: number
          note?: string | null
          photo_url?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_attendance_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_permits: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          document_url: string | null
          end_date: string
          id: string
          permit_type: string
          start_date: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_url?: string | null
          end_date: string
          id?: string
          permit_type: string
          start_date: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_url?: string | null
          end_date?: string
          id?: string
          permit_type?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_permits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_attendance_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_permits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_permits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_attendance_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_permits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_passwords: {
        Row: {
          created_at: string | null
          id: string
          password: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_passwords_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_attendance_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_passwords_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_work_schedules: {
        Row: {
          check_in_end: string
          check_in_start: string
          check_out_end: string
          check_out_start: string
          created_at: string | null
          id: string
          is_active: boolean
          reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          check_in_end?: string
          check_in_start?: string
          check_out_end?: string
          check_out_start?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          check_in_end?: string
          check_in_start?: string
          check_out_end?: string
          check_out_start?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_work_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_attendance_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_work_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          is_struktural: boolean | null
          password_hash: string
          role: string
          sort_order: number | null
          unit_kerja: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          is_struktural?: boolean | null
          password_hash: string
          role?: string
          sort_order?: number | null
          unit_kerja?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          is_struktural?: boolean | null
          password_hash?: string
          role?: string
          sort_order?: number | null
          unit_kerja?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      users_status_backup: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string | null
          password_hash: string | null
          role: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_attendance_stats: {
        Row: {
          full_name: string | null
          hadir_count: number | null
          id: string | null
          kurang_jam_count: number | null
          role: string | null
          terlambat_count: number | null
          total_days: number | null
          total_dinas_luar: number | null
          total_masuk: number | null
          total_pulang: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      clean_name: { Args: { name_input: string }; Returns: string }
      clean_name_v2: { Args: { name_input: string }; Returns: string }
      create_leave_permit: {
        Args: {
          p_created_by?: string
          p_description?: string
          p_document_url?: string
          p_end_date: string
          p_permit_type: string
          p_start_date: string
          p_user_id: string
        }
        Returns: string
      }
      create_user: {
        Args: {
          p_full_name: string
          p_password: string
          p_role?: string
          p_unit_kerja?: string
          p_username: string
        }
        Returns: string
      }
      create_username_from_name: {
        Args: { name_input: string }
        Returns: string
      }
      create_username_v2: { Args: { name_input: string }; Returns: string }
      create_username_v3: { Args: { name_input: string }; Returns: string }
      delete_leave_permit: { Args: { p_permit_id: string }; Returns: boolean }
      delete_user: { Args: { p_user_id: string }; Returns: boolean }
      get_all_attendances: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id?: string }
        Returns: {
          attendance_type: string
          bukti_dinas_luar_url: string
          created_at: string
          has_surat_tugas: boolean
          id: string
          latitude: number
          longitude: number
          note: string
          photo_url: string
          status: string
          user_full_name: string
          user_id: string
          user_role: string
          user_username: string
        }[]
      }
      get_all_users: {
        Args: never
        Returns: {
          created_at: string
          full_name: string
          id: string
          role: string
          unit_kerja: string
          updated_at: string
          username: string
        }[]
      }
      get_attendance_report: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id: string }
        Returns: {
          bukti_dinas_luar_url: string
          has_surat_tugas: boolean
          jam_masuk: string
          jam_pulang: string
          note_masuk: string
          note_pulang: string
          status_masuk: string
          status_pulang: string
          tanggal: string
          total_jam: unknown
        }[]
      }
      get_clean_name: { Args: { name_input: string }; Returns: string }
      get_dinas_luar_stats: {
        Args: { p_month?: number; p_user_id: string; p_year?: number }
        Returns: {
          dinas_luar_dengan_bukti: number
          dinas_luar_tanpa_bukti: number
          total_dinas_luar: number
        }[]
      }
      get_leave_permits: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id?: string }
        Returns: {
          created_at: string
          created_by: string
          description: string
          document_url: string
          end_date: string
          id: string
          permit_type: string
          start_date: string
          status: string
          updated_at: string
          user_full_name: string
          user_id: string
          user_username: string
        }[]
      }
      get_simple_username: { Args: { name_input: string }; Returns: string }
      get_user_attendances: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id: string }
        Returns: {
          attendance_type: string
          bukti_dinas_luar_url: string | null
          created_at: string | null
          has_surat_tugas: boolean | null
          id: string
          latitude: number
          longitude: number
          note: string | null
          photo_url: string
          status: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "attendances"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      hash_password: { Args: { password_text: string }; Returns: string }
      insert_attendance: {
        Args: {
          p_attendance_type: string
          p_bukti_dinas_luar_url?: string
          p_has_surat_tugas?: boolean
          p_latitude: number
          p_longitude: number
          p_note?: string
          p_photo_url: string
          p_status?: string
          p_user_id: string
        }
        Returns: {
          attendance_type: string
          bukti_dinas_luar_url: string | null
          created_at: string | null
          has_surat_tugas: boolean | null
          id: string
          latitude: number
          longitude: number
          note: string | null
          photo_url: string
          status: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "attendances"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reset_user_password: {
        Args: { new_password: string; user_username: string }
        Returns: string
      }
      update_leave_permit: {
        Args: {
          p_description?: string
          p_document_url?: string
          p_end_date?: string
          p_permit_id: string
          p_permit_type?: string
          p_start_date?: string
          p_user_id?: string
        }
        Returns: boolean
      }
      update_user: {
        Args: {
          p_full_name?: string
          p_password?: string
          p_role?: string
          p_unit_kerja?: string
          p_user_id: string
          p_username?: string
        }
        Returns: boolean
      }
      verify_password: {
        Args: { hashed_password: string; password_text: string }
        Returns: boolean
      }
      verify_user_password: {
        Args: { password_input: string; username_input: string }
        Returns: {
          full_name: string
          id: string
          password_hash: string
          role: string
          unit_kerja: string
          username: string
        }[]
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
