import { createServerFn } from "@tanstack/react-start";

import type { EntryFull, EntrySearchResult } from "./types";

interface SearchInput {
  language?: "auto" | "english" | "latin";
  query: string;
}

export const searchEntries = createServerFn({ method: "GET" })
  .inputValidator((data: SearchInput) => data)
  .handler(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (): Promise<EntrySearchResult[]> => {
      return [];
    },
  );

interface GetEntryInput {
  id: string;
}

export const getEntry = createServerFn({ method: "GET" })
  .inputValidator((data: GetEntryInput) => data)
  .handler(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (): Promise<EntryFull | null> => {
      return null;
    },
  );
