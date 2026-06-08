/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/consistent-indexed-object-style */
/**
 * Auto-generated TypeScript types for Supabase database schema
 * Generated from: https://dydlnpcsdqgjlkrkneoh.supabase.co
 *
 * To regenerate these types, use the Supabase MCP tool:
 * mcp_supabase_generate_typescript_types
 */

/**
 * Helper type to extract composite types from the database schema.
 */
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
 * Main database schema type generated from Supabase.
 */
export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    CompositeTypes: {
      [_ in never]: never;
    };
    Enums: {
      part_of_speech:
        | "abbreviation"
        | "adjective"
        | "adverb"
        | "circumfix"
        | "conjunction"
        | "determiner"
        | "idiom"
        | "interfix"
        | "interjection"
        | "noun"
        | "numeral"
        | "participle"
        | "particle"
        | "phrase"
        | "prefix"
        | "preposition"
        | "pronoun"
        | "properNoun"
        | "proverb"
        | "suffix"
        | "verb";
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
    Tables: {
      authors: {
        Insert: {
          id: string;
          name: string;
          name_tsvector?: unknown;
        };
        Relationships: [];
        Row: {
          id: string;
          name: string;
          name_tsvector: unknown;
        };
        Update: {
          id?: string;
          name?: string;
          name_tsvector?: unknown;
        };
      };
      bookmarks: {
        Insert: {
          entry_id: string;
          user_id: string;
        };
        Relationships: [
          {
            columns: ["entry_id"];
            foreignKeyName: "bookmarks_entryId_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "entries";
          },
        ];
        Row: {
          entry_id: string;
          user_id: string;
        };
        Update: {
          entry_id?: string;
          user_id?: string;
        };
      };
      books: {
        Insert: {
          author_id?: null | string;
          id: string;
          title: string;
          title_tsvector?: unknown;
        };
        Relationships: [
          {
            columns: ["author_id"];
            foreignKeyName: "books_authorId_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "authors";
          },
        ];
        Row: {
          author_id: null | string;
          id: string;
          title: string;
          title_tsvector: unknown;
        };
        Update: {
          author_id?: null | string;
          id?: string;
          title?: string;
          title_tsvector?: unknown;
        };
      };
      entries: {
        Insert: {
          etymology?: null | string;
          forms?: Json | null;
          id: string;
          inflection?: Json | null;
          part_of_speech: Database["public"]["Enums"]["part_of_speech"];
          principal_parts?: Json | null;
          pronunciation?: Json | null;
        };
        Relationships: [];
        Row: {
          etymology: null | string;
          forms: Json | null;
          id: string;
          inflection: Json | null;
          part_of_speech: Database["public"]["Enums"]["part_of_speech"];
          principal_parts: Json | null;
          pronunciation: Json | null;
        };
        Update: {
          etymology?: null | string;
          forms?: Json | null;
          id?: string;
          inflection?: Json | null;
          part_of_speech?: Database["public"]["Enums"]["part_of_speech"];
          principal_parts?: Json | null;
          pronunciation?: Json | null;
        };
      };
      line_words: {
        Insert: {
          word: string;
        };
        Relationships: [];
        Row: {
          word: string;
        };
        Update: {
          word?: string;
        };
      };
      lines: {
        Insert: {
          analytics?: Json | null;
          id: string;
          line: string;
          line_label: string;
          line_number: number;
          line_tsvector?: unknown;
          text_id?: null | string;
        };
        Relationships: [
          {
            columns: ["text_id"];
            foreignKeyName: "lines_textId_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "texts";
          },
        ];
        Row: {
          analytics: Json | null;
          id: string;
          line: string;
          line_label: string;
          line_number: number;
          line_tsvector: unknown;
          text_id: null | string;
        };
        Update: {
          analytics?: Json | null;
          id?: string;
          line?: string;
          line_label?: string;
          line_number?: number;
          line_tsvector?: unknown;
          text_id?: null | string;
        };
      };
      texts: {
        Insert: {
          author_id?: null | string;
          book_id?: null | string;
          id: string;
          title: string;
          title_tsvector?: unknown;
        };
        Relationships: [
          {
            columns: ["author_id"];
            foreignKeyName: "texts_authorId_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "authors";
          },
          {
            columns: ["book_id"];
            foreignKeyName: "texts_bookId_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "books";
          },
        ];
        Row: {
          author_id: null | string;
          book_id: null | string;
          id: string;
          title: string;
          title_tsvector: unknown;
        };
        Update: {
          author_id?: null | string;
          book_id?: null | string;
          id?: string;
          title?: string;
          title_tsvector?: unknown;
        };
      };
      translation_words: {
        Insert: {
          translation_id: string;
          word: string;
        };
        Relationships: [
          {
            columns: ["translation_id"];
            foreignKeyName: "translation_words_words_translation_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "translations";
          },
        ];
        Row: {
          translation_id: string;
          word: string;
        };
        Update: {
          translation_id?: string;
          word?: string;
        };
      };
      translations: {
        Insert: {
          entry_id?: null | string;
          id?: string;
          translation?: null | string;
          translation_tsvector?: unknown;
        };
        Relationships: [
          {
            columns: ["entry_id"];
            foreignKeyName: "translations_entryId_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "entries";
          },
        ];
        Row: {
          entry_id: null | string;
          id: string;
          translation: null | string;
          translation_tsvector: unknown;
        };
        Update: {
          entry_id?: null | string;
          id?: string;
          translation?: null | string;
          translation_tsvector?: unknown;
        };
      };
      user_texts: {
        Insert: {
          id: string;
          text: string;
          title: string;
          user_id?: null | string;
        };
        Relationships: [];
        Row: {
          id: string;
          text: string;
          title: string;
          user_id: null | string;
        };
        Update: {
          id?: string;
          text?: string;
          title?: string;
          user_id?: null | string;
        };
      };
      words: {
        Insert: {
          analytics?: Json | null;
          entry_id: string;
          word: string;
        };
        Relationships: [
          {
            columns: ["entry_id"];
            foreignKeyName: "words_entryId_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "entries";
          },
        ];
        Row: {
          analytics: Json | null;
          entry_id: string;
          word: string;
        };
        Update: {
          analytics?: Json | null;
          entry_id?: string;
          word?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
  };
};

/**
 * Helper type to extract enum types from the database schema.
 */
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

/**
 * JSON value type used in Supabase database columns.
 */
export type Json =
  | boolean
  | Json[]
  | null
  | number
  | string
  | { [key: string]: Json | undefined };

/**
 * Helper type to extract table row types from the database schema.
 */
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

/**
 *
 */
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

/**
 * Helper type to extract table update types from the database schema.
 */
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

/**
 * Default schema type (public schema).
 */
type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
 * Convenience type aliases for common table types.
 */

/** Author table row type. */
export type Author = Tables<"authors">;
/** Book table row type. */
export type Book = Tables<"books">;
/** Bookmark table row type. */
export type Bookmark = Tables<"bookmarks">;
/** Entry table row type. */
export type Entry = Tables<"entries">;
/** Line table row type. */
export type Line = Tables<"lines">;
/** LineWord table row type. */
export type LineWord = Tables<"line_words">;
/** Part of speech enum type. */
export type PartOfSpeech = Enums<"part_of_speech">;
/**
 * Search function return types
 */
export type SearchResult =
  Database["public"]["Functions"]["search_latin"]["Returns"][number];
/** Text table row type. */
export type Text = Tables<"texts">;
/** Translation table row type. */
export type Translation = Tables<"translations">;
/** TranslationWord table row type. */
export type TranslationWord = Tables<"translation_words">;

/** UserText table row type. */
export type UserText = Tables<"user_texts">;

/** Word table row type. */
export type Word = Tables<"words">;
