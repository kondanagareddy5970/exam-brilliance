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
      candidates: {
        Row: {
          course: string | null
          email: string
          exam_id: string
          full_name: string
          id: string
          phone: string | null
          registered_at: string
          registration_number: string
          user_id: string
        }
        Insert: {
          course?: string | null
          email: string
          exam_id: string
          full_name: string
          id?: string
          phone?: string | null
          registered_at?: string
          registration_number: string
          user_id: string
        }
        Update: {
          course?: string | null
          email?: string
          exam_id?: string
          full_name?: string
          id?: string
          phone?: string | null
          registered_at?: string
          registration_number?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          answers: Json | null
          candidate_id: string | null
          created_at: string
          end_time: string | null
          exam_id: string
          id: string
          passed: boolean | null
          percentage: number | null
          score: number | null
          start_time: string
          status: string
          time_remaining_seconds: number | null
          total_marks: number | null
          updated_at: string
          user_id: string
          violations_count: number
        }
        Insert: {
          answers?: Json | null
          candidate_id?: string | null
          created_at?: string
          end_time?: string | null
          exam_id: string
          id?: string
          passed?: boolean | null
          percentage?: number | null
          score?: number | null
          start_time?: string
          status?: string
          time_remaining_seconds?: number | null
          total_marks?: number | null
          updated_at?: string
          user_id: string
          violations_count?: number
        }
        Update: {
          answers?: Json | null
          candidate_id?: string | null
          created_at?: string
          end_time?: string | null
          exam_id?: string
          id?: string
          passed?: boolean | null
          percentage?: number | null
          score?: number | null
          start_time?: string
          status?: string
          time_remaining_seconds?: number | null
          total_marks?: number | null
          updated_at?: string
          user_id?: string
          violations_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          attempt_id: string
          exam_id: string
          id: string
          passed: boolean
          percentage: number
          score: number
          submitted_at: string
          time_taken_seconds: number | null
          total_marks: number
          user_id: string
        }
        Insert: {
          attempt_id: string
          exam_id: string
          id?: string
          passed: boolean
          percentage: number
          score: number
          submitted_at?: string
          time_taken_seconds?: number | null
          total_marks: number
          user_id: string
        }
        Update: {
          attempt_id?: string
          exam_id?: string
          id?: string
          passed?: boolean
          percentage?: number
          score?: number
          submitted_at?: string
          time_taken_seconds?: number | null
          total_marks?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sessions: {
        Row: {
          created_at: string
          end_time: string | null
          exam_id: string
          exam_title: string
          id: string
          score: number | null
          start_time: string
          submission_status: string
          total_questions: number | null
          user_id: string
          violations_count: number
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          exam_id: string
          exam_title: string
          id?: string
          score?: number | null
          start_time?: string
          submission_status?: string
          total_questions?: number | null
          user_id: string
          violations_count?: number
        }
        Update: {
          created_at?: string
          end_time?: string | null
          exam_id?: string
          exam_title?: string
          id?: string
          score?: number | null
          start_time?: string
          submission_status?: string
          total_questions?: number | null
          user_id?: string
          violations_count?: number
        }
        Relationships: []
      }
      exams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          end_date: string | null
          id: string
          instructions: string | null
          is_active: boolean
          passing_marks: number
          start_date: string | null
          subject: string
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          end_date?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          passing_marks?: number
          start_date?: string | null
          subject: string
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          end_date?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          passing_marks?: number
          start_date?: string | null
          subject?: string
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: []
      }
      face_detection_events: {
        Row: {
          detected_at: string
          event_type: string
          exam_session_id: string
          face_count: number
          id: string
        }
        Insert: {
          detected_at?: string
          event_type: string
          exam_session_id: string
          face_count?: number
          id?: string
        }
        Update: {
          detected_at?: string
          event_type?: string
          exam_session_id?: string
          face_count?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "face_detection_events_exam_session_id_fkey"
            columns: ["exam_session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      proctoring_photos: {
        Row: {
          captured_at: string
          exam_session_id: string
          id: string
          photo_type: string
          photo_url: string
        }
        Insert: {
          captured_at?: string
          exam_session_id: string
          id?: string
          photo_type: string
          photo_url: string
        }
        Update: {
          captured_at?: string
          exam_session_id?: string
          id?: string
          photo_type?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "proctoring_photos_exam_session_id_fkey"
            columns: ["exam_session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: number | null
          correct_answer_text: string | null
          created_at: string
          exam_id: string
          id: string
          marks: number
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          correct_answer?: number | null
          correct_answer_text?: string | null
          created_at?: string
          exam_id: string
          id?: string
          marks?: number
          options?: Json | null
          order_index?: number
          question_text: string
          question_type?: string
          updated_at?: string
        }
        Update: {
          correct_answer?: number | null
          correct_answer_text?: string | null
          created_at?: string
          exam_id?: string
          id?: string
          marks?: number
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      security_activity_logs: {
        Row: {
          activity_type: string
          details: string | null
          exam_session_id: string
          id: string
          occurred_at: string
        }
        Insert: {
          activity_type: string
          details?: string | null
          exam_session_id: string
          id?: string
          occurred_at?: string
        }
        Update: {
          activity_type?: string
          details?: string | null
          exam_session_id?: string
          id?: string
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_activity_logs_exam_session_id_fkey"
            columns: ["exam_session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      owns_session: { Args: { session_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
