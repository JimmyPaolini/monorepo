import type { Author, Text } from "@monorepo/lexico-entities";

// 🏷️ Types

/**
 * Scraped author data extending the database entity
 */
export interface LibraryAuthor extends Pick<Author, "name" | "slug"> {
  nickname: string;
  path: string;
  works: LibraryWork[];
}

/**
 * Scraped text data extending the database entity
 */
export interface LibraryWork extends Pick<Text, "title"> {
  book?: string;
  path: string;
}
