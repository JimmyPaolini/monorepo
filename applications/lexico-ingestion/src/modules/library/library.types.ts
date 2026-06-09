// 🏷️ Types

/**
 *
 */
export interface LibraryAuthor {
  name: string;
  nickname: string;
  path: string;
  works: LibraryWork[];
}

/**
 *
 */
export interface LibraryWork {
  book?: string;
  path: string;
  title: string;
}
