export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      flashcard_progress: {
        Row: {
          difficulty: number | null;
          due: string;
          elapsed_days: number | null;
          flashcard_id: number;
          id: number;
          lapses: number;
          last_review: string | null;
          reps: number;
          scheduled_days: number | null;
          stability: number | null;
          state: Database["public"]["Enums"]["flashcard_state"];
        };
        Insert: {
          difficulty?: number | null;
          due?: string;
          elapsed_days?: number | null;
          flashcard_id: number;
          id?: number;
          lapses?: number;
          last_review?: string | null;
          reps?: number;
          scheduled_days?: number | null;
          stability?: number | null;
          state?: Database["public"]["Enums"]["flashcard_state"];
        };
        Update: {
          difficulty?: number | null;
          due?: string;
          elapsed_days?: number | null;
          flashcard_id?: number;
          id?: number;
          lapses?: number;
          last_review?: string | null;
          reps?: number;
          scheduled_days?: number | null;
          stability?: number | null;
          state?: Database["public"]["Enums"]["flashcard_state"];
        };
        Relationships: [
          {
            foreignKeyName: "flashcard_progress_flashcard_id_fkey";
            columns: ["flashcard_id"];
            isOneToOne: true;
            referencedRelation: "flashcards";
            referencedColumns: ["id"];
          },
        ];
      };
      flashcard_sets: {
        Row: {
          cards_count: number;
          created_at: string;
          id: number;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cards_count?: number;
          created_at?: string;
          id?: number;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cards_count?: number;
          created_at?: string;
          id?: number;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      flashcards: {
        Row: {
          back: string;
          created_at: string;
          flashcard_set_id: number;
          front: string;
          id: number;
          updated_at: string;
        };
        Insert: {
          back: string;
          created_at?: string;
          flashcard_set_id: number;
          front: string;
          id?: number;
          updated_at?: string;
        };
        Update: {
          back?: string;
          created_at?: string;
          flashcard_set_id?: number;
          front?: string;
          id?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcards_flashcard_set_id_fkey";
            columns: ["flashcard_set_id"];
            isOneToOne: false;
            referencedRelation: "flashcard_sets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flashcards_flashcard_set_id_fkey";
            columns: ["flashcard_set_id"];
            isOneToOne: false;
            referencedRelation: "flashcard_sets_with_due_count";
            referencedColumns: ["id"];
          },
        ];
      };
      generation_sessions: {
        Row: {
          accepted_count: number;
          completed_at: string | null;
          completion_tokens: number | null;
          cost_usd: number | null;
          generated_count: number;
          id: number;
          input_length: number;
          input_text: string;
          model_name: string;
          prompt_tokens: number | null;
          started_at: string;
          total_tokens: number | null;
          user_id: string;
        };
        Insert: {
          accepted_count?: number;
          completed_at?: string | null;
          completion_tokens?: number | null;
          cost_usd?: number | null;
          generated_count?: number;
          id?: number;
          input_length: number;
          input_text: string;
          model_name: string;
          prompt_tokens?: number | null;
          started_at?: string;
          total_tokens?: number | null;
          user_id: string;
        };
        Update: {
          accepted_count?: number;
          completed_at?: string | null;
          completion_tokens?: number | null;
          cost_usd?: number | null;
          generated_count?: number;
          id?: number;
          input_length?: number;
          input_text?: string;
          model_name?: string;
          prompt_tokens?: number | null;
          started_at?: string;
          total_tokens?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      study_reviews: {
        Row: {
          flashcard_id: number;
          id: number;
          rating: number;
          reviewed_at: string;
          study_session_id: number;
        };
        Insert: {
          flashcard_id: number;
          id?: number;
          rating: number;
          reviewed_at?: string;
          study_session_id: number;
        };
        Update: {
          flashcard_id?: number;
          id?: number;
          rating?: number;
          reviewed_at?: string;
          study_session_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "study_reviews_flashcard_id_fkey";
            columns: ["flashcard_id"];
            isOneToOne: false;
            referencedRelation: "flashcards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "study_reviews_study_session_id_fkey";
            columns: ["study_session_id"];
            isOneToOne: false;
            referencedRelation: "study_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      study_sessions: {
        Row: {
          cards_studied: number;
          completed_at: string | null;
          flashcard_set_id: number;
          id: number;
          started_at: string;
          user_id: string;
        };
        Insert: {
          cards_studied?: number;
          completed_at?: string | null;
          flashcard_set_id: number;
          id?: number;
          started_at?: string;
          user_id: string;
        };
        Update: {
          cards_studied?: number;
          completed_at?: string | null;
          flashcard_set_id?: number;
          id?: number;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_sessions_flashcard_set_id_fkey";
            columns: ["flashcard_set_id"];
            isOneToOne: false;
            referencedRelation: "flashcard_sets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "study_sessions_flashcard_set_id_fkey";
            columns: ["flashcard_set_id"];
            isOneToOne: false;
            referencedRelation: "flashcard_sets_with_due_count";
            referencedColumns: ["id"];
          },
        ];
      };
      system_logs: {
        Row: {
          created_at: string;
          id: number;
          level: Database["public"]["Enums"]["log_level_type"];
          message: string;
          metadata: Json | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          level: Database["public"]["Enums"]["log_level_type"];
          message: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          level?: Database["public"]["Enums"]["log_level_type"];
          message?: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      flashcard_sets_with_due_count: {
        Row: {
          cards_count: number | null;
          created_at: string | null;
          due_cards_count: number | null;
          id: number | null;
          title: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<never, never>;
    Enums: {
      flashcard_state: "New" | "Learning" | "Review" | "Relearning";
      log_level_type: "INFO" | "WARNING" | "ERROR";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      flashcard_state: ["New", "Learning", "Review", "Relearning"],
      log_level_type: ["INFO", "WARNING", "ERROR"],
    },
  },
} as const;
