// 🏷️ Types

/**
 *
 */
export interface LexicoIngestionCommandOptions {
  dictionary?: boolean;
  library?: boolean;
  librarySources?: boolean;
  literature?: boolean;
  wikipedia?: boolean;
}

/** Raw scraped entry from the Wiktionary category page. The `html` field is
 * populated after the full article page is fetched and stored. */
export interface WiktionaryPage {
  category: string;
  href: string;
  html?: string;
  word: string;
}
