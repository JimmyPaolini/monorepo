/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/consistent-indexed-object-style */
/**
 * Auto-generated TypeScript types for Supabase database schema
 * Generated from: https://dydlnpcsdqgjlkrkneoh.supabase.co
 *
 * To regenerate these types, use the Supabase MCP tool:
 * mcp_supabase_generate_typescript_types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      authors: {
        Row: {
          id: string;
          name: string;
          name_tsvector: unknown;
        };
        Insert: {
          id: string;
          name: string;
          name_tsvector?: unknown;
        };
        Update: {
          id?: string;
          name?: string;
          name_tsvector?: unknown;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          entry_id: string;
          user_id: string;
        };
        Insert: {
          entry_id: string;
          user_id: string;
        };
        Update: {
          entry_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookmarks_entryId_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "entries";
            referencedColumns: ["id"];
          },
        ];
      };
      books: {
        Row: {
          author_id: string | null;
          id: string;
          title: string;
          title_tsvector: unknown;
        };
        Insert: {
          author_id?: string | null;
          id: string;
          title: string;
          title_tsvector?: unknown;
        };
        Update: {
          author_id?: string | null;
          id?: string;
          title?: string;
          title_tsvector?: unknown;
        };
        Relationships: [
          {
            foreignKeyName: "books_authorId_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "authors";
            referencedColumns: ["id"];
          },
        ];
      };
      entries: {
        Row: {
          etymology: string | null;
          forms: Json | null;
          id: string;
          inflection: Json | null;
          part_of_speech: Database["public"]["Enums"]["part_of_speech"];
          principal_parts: Json | null;
          pronunciation: Json | null;
        };
        Insert: {
          etymology?: string | null;
          forms?: Json | null;
          id: string;
          inflection?: Json | null;
          part_of_speech: Database["public"]["Enums"]["part_of_speech"];
          principal_parts?: Json | null;
          pronunciation?: Json | null;
        };
        Update: {
          etymology?: string | null;
          forms?: Json | null;
          id?: string;
          inflection?: Json | null;
          part_of_speech?: Database["public"]["Enums"]["part_of_speech"];
          principal_parts?: Json | null;
          pronunciation?: Json | null;
        };
        Relationships: [];
      };
      line_words: {
        Row: {
          word: string;
        };
        Insert: {
          word: string;
        };
        Update: {
          word?: string;
        };
        Relationships: [];
      };
      lines: {
        Row: {
          analytics: Json | null;
          id: string;
          line: string;
          line_label: string;
          line_number: number;
          line_tsvector: unknown;
          text_id: string | null;
        };
        Insert: {
          analytics?: Json | null;
          id: string;
          line: string;
          line_label: string;
          line_number: number;
          line_tsvector?: unknown;
          text_id?: string | null;
        };
        Update: {
          analytics?: Json | null;
          id?: string;
          line?: string;
          line_label?: string;
          line_number?: number;
          line_tsvector?: unknown;
          text_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lines_textId_fkey";
            columns: ["text_id"];
            isOneToOne: false;
            referencedRelation: "texts";
            referencedColumns: ["id"];
          },
        ];
      };
      texts: {
        Row: {
          author_id: string | null;
          book_id: string | null;
          id: string;
          title: string;
          title_tsvector: unknown;
        };
        Insert: {
          author_id?: string | null;
          book_id?: string | null;
          id: string;
          title: string;
          title_tsvector?: unknown;
        };
        Update: {
          author_id?: string | null;
          book_id?: string | null;
          id?: string;
          title?: string;
          title_tsvector?: unknown;
        };
        Relationships: [
          {
            foreignKeyName: "texts_authorId_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "authors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "texts_bookId_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      translation_words: {
        Row: {
          translation_id: string;
          word: string;
        };
        Insert: {
          translation_id: string;
          word: string;
        };
        Update: {
          translation_id?: string;
          word?: string;
        };
        Relationships: [
          {
            foreignKeyName: "translation_words_words_translation_id_fkey";
            columns: ["translation_id"];
            isOneToOne: false;
            referencedRelation: "translations";
            referencedColumns: ["id"];
          },
        ];
      };
      translations: {
        Row: {
          entry_id: string | null;
          id: string;
          translation: string | null;
          translation_tsvector: unknown;
        };
        Insert: {
          entry_id?: string | null;
          id?: string;
          translation?: string | null;
          translation_tsvector?: unknown;
        };
        Update: {
          entry_id?: string | null;
          id?: string;
          translation?: string | null;
          translation_tsvector?: unknown;
        };
        Relationships: [
          {
            foreignKeyName: "translations_entryId_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "entries";
            referencedColumns: ["id"];
          },
        ];
      };
      user_texts: {
        Row: {
          id: string;
          text: string;
          title: string;
          user_id: string | null;
        };
        Insert: {
          id: string;
          text: string;
          title: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          text?: string;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      words: {
        Row: {
          analytics: Json | null;
          entry_id: string;
          word: string;
        };
        Insert: {
          analytics?: Json | null;
          entry_id: string;
          word: string;
        };
        Update: {
          analytics?: Json | null;
          entry_id?: string;
          word?: string;
        };
        Relationships: [
          {
            foreignKeyName: "words_entryId_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "entries";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      search_english: {
        Args: { query: string };
        Returns: {
          forms: Json;
          id: string;
          inflection: Json;
          part_of_speech: Database["public"]["Enums"]["part_of_speech"];
          principal_parts: Json;
          pronunciation: Json;
          similarities: number[];
          translations: string[];
          words: string[];
        }[];
      };
      search_latin: {
        Args: { query: string };
        Returns: {
          forms: Json;
          id: string;
          inflection: Json;
          part_of_speech: Database["public"]["Enums"]["part_of_speech"];
          principal_parts: Json;
          pronunciation: Json;
          similarities: number[];
          translations: string[];
          words: string[];
        }[];
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
    };
    Enums: {
      part_of_speech:
        | "preposition"
        | "interjection"
        | "properNoun"
        | "noun"
        | "participle"
        | "numeral"
        | "interfix"
        | "proverb"
        | "adverb"
        | "abbreviation"
        | "circumfix"
        | "adjective"
        | "conjunction"
        | "idiom"
        | "prefix"
        | "phrase"
        | "particle"
        | "pronoun"
        | "suffix"
        | "determiner"
        | "verb";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
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

/**
 * Constants for enum values - useful for type-safe comparisons and selections
 */
export const Constants = {
  public: {
    Enums: {
      part_of_speech: [
        "preposition",
        "interjection",
        "properNoun",
        "noun",
        "participle",
        "numeral",
        "interfix",
        "proverb",
        "adverb",
        "abbreviation",
        "circumfix",
        "adjective",
        "conjunction",
        "idiom",
        "prefix",
        "phrase",
        "particle",
        "pronoun",
        "suffix",
        "determiner",
        "verb",
      ],
    },
  },
} as const;

/**
 * Convenience type aliases for common table types
 */
export type Author = Tables<"authors">;
export type Bookmark = Tables<"bookmarks">;
export type Book = Tables<"books">;
export type Entry = Tables<"entries">;
export type LineWord = Tables<"line_words">;
export type Line = Tables<"lines">;
export type Text = Tables<"texts">;
export type TranslationWord = Tables<"translation_words">;
export type Translation = Tables<"translations">;
export type UserText = Tables<"user_texts">;
export type Word = Tables<"words">;

export type PartOfSpeech = Enums<"part_of_speech">;

/**
 * Search function return types
 */
export type SearchResult =
  Database["public"]["Functions"]["search_latin"]["Returns"][number];
