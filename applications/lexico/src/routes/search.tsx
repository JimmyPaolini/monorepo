import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EntryCard,
  Input,
} from "@monorepo/lexico-components";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { searchEntries } from "../lib/search";

import type { EntrySearchResult } from "../lib/types";
import type { ReactNode } from "react";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function SearchPage(): ReactNode {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<EntrySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Search failed";
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
          {results.map((entry) => (
            <Link
              key={entry.id}
              to="/word/$id"
              params={{ id: entry.id }}
              className="block transition-transform hover:scale-[1.01]"
            >
              <EntryCard
                id={entry.id}
                partOfSpeech={entry.part_of_speech}
                principalParts={entry.principal_parts}
                inflection={entry.inflection}
                translations={entry.translations}
              />
            </Link>
          ))}
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
