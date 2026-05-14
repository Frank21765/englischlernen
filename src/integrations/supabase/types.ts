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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cefr_vocab_master: {
        Row: {
          cefr_confidence: string | null
          cefr_level_app: string | null
          cefr_level_source_original: string | null
          cefr_pos_source_original: string | null
          cefr_reason: string | null
          cefr_source: string | null
          common_mistakes_json: string | null
          core_collocations_json: string | null
          curriculum_stage: string | null
          display_word: string | null
          entry_key: string
          example_1_de: string | null
          example_1_en: string | null
          example_2_de: string | null
          example_2_en: string | null
          example_3_de: string | null
          example_3_en: string | null
          german_alternatives_json: string | null
          german_translation_primary: string | null
          gloss_en_simple: string | null
          handling_note: string | null
          learner_relevance: string | null
          lemma: string | null
          meaning_note_de: string | null
          part_of_speech: string | null
          register_json: string | null
          review_reason: string | null
          review_status: string | null
          sensitivity_labels_json: string | null
          source_dataset: string | null
          source_lemma: string | null
          source_pos: string | null
          teaching_priority: string | null
          theme_tags_json: string | null
          usage_tags_json: string | null
          variant_labels_json: string | null
        }
        Insert: {
          cefr_confidence?: string | null
          cefr_level_app?: string | null
          cefr_level_source_original?: string | null
          cefr_pos_source_original?: string | null
          cefr_reason?: string | null
          cefr_source?: string | null
          common_mistakes_json?: string | null
          core_collocations_json?: string | null
          curriculum_stage?: string | null
          display_word?: string | null
          entry_key: string
          example_1_de?: string | null
          example_1_en?: string | null
          example_2_de?: string | null
          example_2_en?: string | null
          example_3_de?: string | null
          example_3_en?: string | null
          german_alternatives_json?: string | null
          german_translation_primary?: string | null
          gloss_en_simple?: string | null
          handling_note?: string | null
          learner_relevance?: string | null
          lemma?: string | null
          meaning_note_de?: string | null
          part_of_speech?: string | null
          register_json?: string | null
          review_reason?: string | null
          review_status?: string | null
          sensitivity_labels_json?: string | null
          source_dataset?: string | null
          source_lemma?: string | null
          source_pos?: string | null
          teaching_priority?: string | null
          theme_tags_json?: string | null
          usage_tags_json?: string | null
          variant_labels_json?: string | null
        }
        Update: {
          cefr_confidence?: string | null
          cefr_level_app?: string | null
          cefr_level_source_original?: string | null
          cefr_pos_source_original?: string | null
          cefr_reason?: string | null
          cefr_source?: string | null
          common_mistakes_json?: string | null
          core_collocations_json?: string | null
          curriculum_stage?: string | null
          display_word?: string | null
          entry_key?: string
          example_1_de?: string | null
          example_1_en?: string | null
          example_2_de?: string | null
          example_2_en?: string | null
          example_3_de?: string | null
          example_3_en?: string | null
          german_alternatives_json?: string | null
          german_translation_primary?: string | null
          gloss_en_simple?: string | null
          handling_note?: string | null
          learner_relevance?: string | null
          lemma?: string | null
          meaning_note_de?: string | null
          part_of_speech?: string | null
          register_json?: string | null
          review_reason?: string | null
          review_status?: string | null
          sensitivity_labels_json?: string | null
          source_dataset?: string | null
          source_lemma?: string | null
          source_pos?: string | null
          teaching_priority?: string | null
          theme_tags_json?: string | null
          usage_tags_json?: string | null
          variant_labels_json?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      core_vocab_master: {
        Row: {
          beta_priority: string | null
          cefr_level: string | null
          cefrj_level_original: string | null
          cefrj_pos_original: string | null
          confusing_with_json: Json | null
          display_word: string | null
          example_1_de: string | null
          example_1_en: string | null
          example_2_de: string | null
          example_2_en: string | null
          example_3_de: string | null
          example_3_en: string | null
          frequency_band: string | null
          frequency_rank: number | null
          german_alternatives_json: Json | null
          german_translation_primary: string | null
          id: string
          learner_relevance: string | null
          lemma: string | null
          meaning_note_de: string | null
          part_of_speech: string | null
          register_json: Json | null
          review_reason: string | null
          review_status: string | null
          source: string | null
          source_lemma: string | null
          source_pos: string | null
          usage_tags_json: Json | null
        }
        Insert: {
          beta_priority?: string | null
          cefr_level?: string | null
          cefrj_level_original?: string | null
          cefrj_pos_original?: string | null
          confusing_with_json?: Json | null
          display_word?: string | null
          example_1_de?: string | null
          example_1_en?: string | null
          example_2_de?: string | null
          example_2_en?: string | null
          example_3_de?: string | null
          example_3_en?: string | null
          frequency_band?: string | null
          frequency_rank?: number | null
          german_alternatives_json?: Json | null
          german_translation_primary?: string | null
          id: string
          learner_relevance?: string | null
          lemma?: string | null
          meaning_note_de?: string | null
          part_of_speech?: string | null
          register_json?: Json | null
          review_reason?: string | null
          review_status?: string | null
          source?: string | null
          source_lemma?: string | null
          source_pos?: string | null
          usage_tags_json?: Json | null
        }
        Update: {
          beta_priority?: string | null
          cefr_level?: string | null
          cefrj_level_original?: string | null
          cefrj_pos_original?: string | null
          confusing_with_json?: Json | null
          display_word?: string | null
          example_1_de?: string | null
          example_1_en?: string | null
          example_2_de?: string | null
          example_2_en?: string | null
          example_3_de?: string | null
          example_3_en?: string | null
          frequency_band?: string | null
          frequency_rank?: number | null
          german_alternatives_json?: Json | null
          german_translation_primary?: string | null
          id?: string
          learner_relevance?: string | null
          lemma?: string | null
          meaning_note_de?: string | null
          part_of_speech?: string | null
          register_json?: Json | null
          review_reason?: string | null
          review_status?: string | null
          source?: string | null
          source_lemma?: string | null
          source_pos?: string | null
          usage_tags_json?: Json | null
        }
        Relationships: []
      }
      diagnostic_results: {
        Row: {
          area: string
          cefr_estimate: string | null
          details: Json | null
          id: string
          score: number
          taken_at: string
          user_id: string
        }
        Insert: {
          area: string
          cefr_estimate?: string | null
          details?: Json | null
          id?: string
          score: number
          taken_at?: string
          user_id: string
        }
        Update: {
          area?: string
          cefr_estimate?: string | null
          details?: Json | null
          id?: string
          score?: number
          taken_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      idiom_topics: {
        Row: {
          id: string
          label_de: string
          label_en: string
          sort_order: number | null
        }
        Insert: {
          id: string
          label_de: string
          label_en: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          label_de?: string
          label_en?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      idioms_master: {
        Row: {
          audio_url_1: string | null
          audio_url_2: string | null
          audio_url_3: string | null
          beta_priority: string | null
          cefr_level: string
          confusing_with_json: Json | null
          created_at: string | null
          display_phrase: string
          distractors_json: Json | null
          example_1_de: string | null
          example_1_de_partial: string | null
          example_1_en: string | null
          example_2_de: string | null
          example_2_de_partial: string | null
          example_2_en: string | null
          example_3_de: string | null
          example_3_de_partial: string | null
          example_3_en: string | null
          false_friend_warning: string | null
          frequency_band: string | null
          frequency_rank: number | null
          grammar_pattern: string | null
          id: string
          learner_relevance: string | null
          lemma: string
          linked_irregular_verb: string | null
          linked_vocab: string | null
          literal_meaning_de: string | null
          meaning_note_de: string
          register_json: Json | null
          related_idioms_json: Json | null
          review_reason: string | null
          review_status: string | null
          reviewed: boolean | null
          source: string | null
          topic_id: string | null
          type: string
          updated_at: string | null
          usage_tags_json: Json | null
          variants_json: Json | null
        }
        Insert: {
          audio_url_1?: string | null
          audio_url_2?: string | null
          audio_url_3?: string | null
          beta_priority?: string | null
          cefr_level: string
          confusing_with_json?: Json | null
          created_at?: string | null
          display_phrase: string
          distractors_json?: Json | null
          example_1_de?: string | null
          example_1_de_partial?: string | null
          example_1_en?: string | null
          example_2_de?: string | null
          example_2_de_partial?: string | null
          example_2_en?: string | null
          example_3_de?: string | null
          example_3_de_partial?: string | null
          example_3_en?: string | null
          false_friend_warning?: string | null
          frequency_band?: string | null
          frequency_rank?: number | null
          grammar_pattern?: string | null
          id: string
          learner_relevance?: string | null
          lemma: string
          linked_irregular_verb?: string | null
          linked_vocab?: string | null
          literal_meaning_de?: string | null
          meaning_note_de: string
          register_json?: Json | null
          related_idioms_json?: Json | null
          review_reason?: string | null
          review_status?: string | null
          reviewed?: boolean | null
          source?: string | null
          topic_id?: string | null
          type: string
          updated_at?: string | null
          usage_tags_json?: Json | null
          variants_json?: Json | null
        }
        Update: {
          audio_url_1?: string | null
          audio_url_2?: string | null
          audio_url_3?: string | null
          beta_priority?: string | null
          cefr_level?: string
          confusing_with_json?: Json | null
          created_at?: string | null
          display_phrase?: string
          distractors_json?: Json | null
          example_1_de?: string | null
          example_1_de_partial?: string | null
          example_1_en?: string | null
          example_2_de?: string | null
          example_2_de_partial?: string | null
          example_2_en?: string | null
          example_3_de?: string | null
          example_3_de_partial?: string | null
          example_3_en?: string | null
          false_friend_warning?: string | null
          frequency_band?: string | null
          frequency_rank?: number | null
          grammar_pattern?: string | null
          id?: string
          learner_relevance?: string | null
          lemma?: string
          linked_irregular_verb?: string | null
          linked_vocab?: string | null
          literal_meaning_de?: string | null
          meaning_note_de?: string
          register_json?: Json | null
          related_idioms_json?: Json | null
          review_reason?: string | null
          review_status?: string | null
          reviewed?: boolean | null
          source?: string | null
          topic_id?: string | null
          type?: string
          updated_at?: string | null
          usage_tags_json?: Json | null
          variants_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "idioms_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "idiom_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      irregular_verbs_master: {
        Row: {
          beta_priority: string | null
          cefr_level: string | null
          common_mistakes_de: string | null
          confusing_with_json: Json | null
          english_hint: string | null
          example_1_de: string | null
          example_1_en: string | null
          example_2_de: string | null
          example_2_en: string | null
          example_3_de: string | null
          example_3_en: string | null
          frequency_band: string | null
          german_alternatives_json: Json | null
          german_translation_primary: string | null
          id: string
          infinitive_display: string | null
          learner_relevance: string | null
          lemma: string | null
          meaning_note_de: string | null
          past_participle_primary: string | null
          past_participle_variants_json: Json | null
          pronunciation_note_de: string | null
          register_json: Json | null
          review_reason: string | null
          review_status: string | null
          simple_past_primary: string | null
          simple_past_variants_json: Json | null
          source_row_lemma: string | null
          split_recommendation: string | null
          usage_tags_json: Json | null
          variant_note_de: string | null
        }
        Insert: {
          beta_priority?: string | null
          cefr_level?: string | null
          common_mistakes_de?: string | null
          confusing_with_json?: Json | null
          english_hint?: string | null
          example_1_de?: string | null
          example_1_en?: string | null
          example_2_de?: string | null
          example_2_en?: string | null
          example_3_de?: string | null
          example_3_en?: string | null
          frequency_band?: string | null
          german_alternatives_json?: Json | null
          german_translation_primary?: string | null
          id: string
          infinitive_display?: string | null
          learner_relevance?: string | null
          lemma?: string | null
          meaning_note_de?: string | null
          past_participle_primary?: string | null
          past_participle_variants_json?: Json | null
          pronunciation_note_de?: string | null
          register_json?: Json | null
          review_reason?: string | null
          review_status?: string | null
          simple_past_primary?: string | null
          simple_past_variants_json?: Json | null
          source_row_lemma?: string | null
          split_recommendation?: string | null
          usage_tags_json?: Json | null
          variant_note_de?: string | null
        }
        Update: {
          beta_priority?: string | null
          cefr_level?: string | null
          common_mistakes_de?: string | null
          confusing_with_json?: Json | null
          english_hint?: string | null
          example_1_de?: string | null
          example_1_en?: string | null
          example_2_de?: string | null
          example_2_en?: string | null
          example_3_de?: string | null
          example_3_en?: string | null
          frequency_band?: string | null
          german_alternatives_json?: Json | null
          german_translation_primary?: string | null
          id?: string
          infinitive_display?: string | null
          learner_relevance?: string | null
          lemma?: string | null
          meaning_note_de?: string | null
          past_participle_primary?: string | null
          past_participle_variants_json?: Json | null
          pronunciation_note_de?: string | null
          register_json?: Json | null
          review_reason?: string | null
          review_status?: string | null
          simple_past_primary?: string | null
          simple_past_variants_json?: Json | null
          source_row_lemma?: string | null
          split_recommendation?: string | null
          usage_tags_json?: Json | null
          variant_note_de?: string | null
        }
        Relationships: []
      }
      learning_events: {
        Row: {
          created_at: string
          event_type: string
          exercise_direction: string | null
          id: string
          level: string | null
          metadata: Json
          object_id: string | null
          object_type: string | null
          source_language: string | null
          target_language: string | null
          topic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          exercise_direction?: string | null
          id?: string
          level?: string | null
          metadata?: Json
          object_id?: string | null
          object_type?: string | null
          source_language?: string | null
          target_language?: string | null
          topic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          exercise_direction?: string | null
          id?: string
          level?: string | null
          metadata?: Json
          object_id?: string | null
          object_type?: string | null
          source_language?: string | null
          target_language?: string | null
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_sessions: {
        Row: {
          correct_answers: number
          created_at: string
          id: string
          level: string
          mode: string
          topic: string
          total_answers: number
          user_id: string
        }
        Insert: {
          correct_answers?: number
          created_at?: string
          id?: string
          level: string
          mode: string
          topic: string
          total_answers?: number
          user_id: string
        }
        Update: {
          correct_answers?: number
          created_at?: string
          id?: string
          level?: string
          mode?: string
          topic?: string
          total_answers?: number
          user_id?: string
        }
        Relationships: []
      }
      ngsl_words: {
        Row: {
          cefr_level: string
          created_at: string
          english: string
          example_de: string | null
          example_en: string | null
          german: string
          id: string
          pos: string | null
          rank: number | null
          topics: string[]
        }
        Insert: {
          cefr_level?: string
          created_at?: string
          english: string
          example_de?: string | null
          example_en?: string | null
          german: string
          id?: string
          pos?: string | null
          rank?: number | null
          topics?: string[]
        }
        Update: {
          cefr_level?: string
          created_at?: string
          english?: string
          example_de?: string | null
          example_en?: string | null
          german?: string
          id?: string
          pos?: string | null
          rank?: number | null
          topics?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_status: string
          created_at: string
          current_streak: number
          default_level: string | null
          default_topic: string | null
          direction_mode: string
          display_name: string | null
          exercise_direction: string
          explanation_language: string
          id: string
          interests: string[]
          last_active_date: string | null
          last_compass_update: string | null
          last_login_at: string | null
          learning_goal: string | null
          longest_streak: number
          onboarding_completed: boolean
          recommended_level: string | null
          self_assessment: string | null
          source_language: string
          target_language: string
          updated_at: string
          user_id: string
          valid_until: string | null
          weekly_minutes_goal: number
          xp: number
        }
        Insert: {
          access_status?: string
          created_at?: string
          current_streak?: number
          default_level?: string | null
          default_topic?: string | null
          direction_mode?: string
          display_name?: string | null
          exercise_direction?: string
          explanation_language?: string
          id?: string
          interests?: string[]
          last_active_date?: string | null
          last_compass_update?: string | null
          last_login_at?: string | null
          learning_goal?: string | null
          longest_streak?: number
          onboarding_completed?: boolean
          recommended_level?: string | null
          self_assessment?: string | null
          source_language?: string
          target_language?: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
          weekly_minutes_goal?: number
          xp?: number
        }
        Update: {
          access_status?: string
          created_at?: string
          current_streak?: number
          default_level?: string | null
          default_topic?: string | null
          direction_mode?: string
          display_name?: string | null
          exercise_direction?: string
          explanation_language?: string
          id?: string
          interests?: string[]
          last_active_date?: string | null
          last_compass_update?: string | null
          last_login_at?: string | null
          learning_goal?: string | null
          longest_streak?: number
          onboarding_completed?: boolean
          recommended_level?: string | null
          self_assessment?: string | null
          source_language?: string
          target_language?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
          weekly_minutes_goal?: number
          xp?: number
        }
        Relationships: []
      }
      review_items: {
        Row: {
          correct_count: number
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_seen_at: string | null
          level: string | null
          next_review_at: string | null
          object_id: string
          object_type: string
          status: string
          topic: string | null
          updated_at: string
          user_id: string
          wrong_count: number
        }
        Insert: {
          correct_count?: number
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_seen_at?: string | null
          level?: string | null
          next_review_at?: string | null
          object_id: string
          object_type: string
          status?: string
          topic?: string | null
          updated_at?: string
          user_id: string
          wrong_count?: number
        }
        Update: {
          correct_count?: number
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_seen_at?: string | null
          level?: string | null
          next_review_at?: string | null
          object_id?: string
          object_type?: string
          status?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
          wrong_count?: number
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      vocabulary: {
        Row: {
          correct_count: number
          created_at: string
          ease_factor: number
          english: string
          german: string
          grammar_note: string | null
          id: string
          interval_days: number
          last_seen_at: string | null
          level: string
          next_review_at: string | null
          ngsl_id: string | null
          source: string
          source_language: string
          status: string
          target_language: string
          topic: string
          updated_at: string
          user_id: string
          wrong_count: number
        }
        Insert: {
          correct_count?: number
          created_at?: string
          ease_factor?: number
          english: string
          german: string
          grammar_note?: string | null
          id?: string
          interval_days?: number
          last_seen_at?: string | null
          level: string
          next_review_at?: string | null
          ngsl_id?: string | null
          source?: string
          source_language?: string
          status?: string
          target_language?: string
          topic: string
          updated_at?: string
          user_id: string
          wrong_count?: number
        }
        Update: {
          correct_count?: number
          created_at?: string
          ease_factor?: number
          english?: string
          german?: string
          grammar_note?: string | null
          id?: string
          interval_days?: number
          last_seen_at?: string | null
          level?: string
          next_review_at?: string | null
          ngsl_id?: string | null
          source?: string
          source_language?: string
          status?: string
          target_language?: string
          topic?: string
          updated_at?: string
          user_id?: string
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_ngsl_id_fkey"
            columns: ["ngsl_id"]
            isOneToOne: false
            referencedRelation: "ngsl_words"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_badge: { Args: { _badge_key: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
