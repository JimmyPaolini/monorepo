/** Raw scraped entry from the Wiktionary category page. The `html` field is
 * populated after the full article page is fetched and stored. */
export interface WiktionaryEntry {
  word: string;
  category: string;
  href: string;
  html?: string;
}
