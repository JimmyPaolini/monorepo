// 🏷️ Types

/**
 * Optional start and end lemmas used to bound dictionary ingestion.
 */
export interface DictionaryCommandOptions {
  endLemma?: null | string;
  startLemma?: null | string;
}
