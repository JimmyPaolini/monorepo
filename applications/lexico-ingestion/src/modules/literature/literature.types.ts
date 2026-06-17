// 🏷️ Types

/**
 *
 */
export interface LibraryEntry {
  authorSlug: string;
  fullPath: string;
  pathParts: string[];
  provider: string;
  textSlug: string;
  title: string;
}

/**
 *
 */
export interface LiteratureCommandOptions {
  author?: null | string;
  provider?: null | string;
  text?: null | string;
}
