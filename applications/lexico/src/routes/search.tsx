import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@monorepo/lexico-components";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { noop } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { EntryCard } from "../components/entry/entry-card";
import { transformForms } from "../lib/forms";
import { searchEntries } from "../lib/search";

import type { EntrySearchResult } from "../lib/types";
import type { ReactNode } from "react";

const searchSchema = z.object({
  query: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  component: SearchPage,
});

/**
 * Custom hook that debounces a value by the specified delay.
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Search page component that allows users to search for Latin entries.
 *
 * @returns React node
 */
function SearchPage(): ReactNode {
  const navigate = useNavigate({ from: "/search" });
  const { query: urlQuery } = Route.useSearch();
  const [query, setQuery] = useState<string>(urlQuery ?? "");
  const [results, setResults] = useState<EntrySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);
  // Sync query state with URL
  useEffect(() => {
    setQuery(urlQuery ?? "");
  }, [urlQuery]);

  // Select all text in the input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  }, []);

  // Update URL when debounced query changes
  useEffect(() => {
    if (debouncedQuery !== urlQuery) {
      void navigate({
        search: debouncedQuery ? { query: debouncedQuery } : {},
        replace: true,
      });
    }
  }, [debouncedQuery, urlQuery, navigate]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await searchEntries({
        data: { query: searchQuery, language: "auto" },
      });
      setResults(searchResults);
    } catch (error_: unknown) {
      const message = error_ instanceof Error ? error_.message : "Search failed";
      setError(message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-2xl">
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search Latin or English..."
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          className="w-full text-lg"
        />
      </div>

      {isLoading && (
        <div className="text-center text-muted-foreground">
          <p>Searching...</p>
        </div>
      )}

      {error && (
        <div className="text-center text-destructive">
          <p>Error: {error}</p>
        </div>
      )}

      {!isLoading && !error && results.length > 0 && (
        <div className="mx-auto max-w-2xl space-y-4">
          {results.map((entry) => {
            // Transform forms for the entry card
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- forms can be null from DB
            const transformedForms = entry.forms
              ? transformForms(entry.part_of_speech, entry.forms)
              : null;

            return (
              <div key={entry.id}>
                <EntryCard
                  id={entry.id}
                  partOfSpeech={entry.part_of_speech}
                  principalParts={entry.principal_parts}
                  inflection={entry.inflection}
                  translations={entry.translations}
                  forms={transformedForms}
                  etymology={entry.etymology}
                  pronunciation={entry.pronunciation}
                  onBookmarkToggle={noop}
                />
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !error && query && results.length === 0 && (
        <div className="text-center text-muted-foreground">
          <p>No results found for &quot;{query}&quot;</p>
        </div>
      )}

      {!query && (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Welcome to Lexico</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              Start typing to search the Latin dictionary. You can search for
              Latin words to find their English translations, or search for
              English words to find Latin equivalents.
            </p>
            <ul className="mt-4 list-inside list-disc space-y-1">
              <li>
                Search Latin words (e.g., &quot;amo&quot;, &quot;rex&quot;,
                &quot;bellum&quot;)
              </li>
              <li>
                Search English translations (e.g., &quot;love&quot;,
                &quot;king&quot;, &quot;war&quot;)
              </li>
              <li>View word forms, conjugations, and declensions</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
