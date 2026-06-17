// 🏷️ Types

/**
 * Optional booleans that decide which root ingestion stages execute.
 */
export interface LexicoIngestionCommandOptions {
  dictionary?: boolean;
  library?: boolean;
  librarySources?: boolean;
  literature?: boolean;
  wikipedia?: boolean;
}

/**
 * Cached Wiktionary entry metadata. `html` is populated after the article body
 * has been fetched and written to disk.
 */
export interface WiktionaryPage {
  category: string;
  href: string;
  html?: string;
  word: string;
}
