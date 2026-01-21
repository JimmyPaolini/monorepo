import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@monorepo/lexico-components";
import { createFileRoute, Link } from "@tanstack/react-router";
import { noop } from "lodash";
import { Bookmark, BookmarkX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EntryCard } from "../components/entry/entry-card";
import { getBookmarks, removeBookmark } from "../lib/bookmarks";

import type { BookmarkedEntry } from "../lib/bookmarks";
import type { ReactNode } from "react";

export const Route = createFileRoute("/bookmarks")({
  component: BookmarksPage,
});

function BookmarksPage(): ReactNode {
  const [bookmarks, setBookmarks] = useState<BookmarkedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBookmarks();
      setBookmarks(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load bookmarks";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookmarks();
  }, [fetchBookmarks]);

  const handleRemoveBookmark = useCallback(async (entryId: string) => {
    try {
      const result = await removeBookmark({ data: { entryId } });
      if (result.success) {
        setBookmarks((prev) => prev.filter((b) => b.id !== entryId));
      }
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bookmark className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Bookmarks</h1>
      </div>

      {isLoading && (
        <div className="text-center text-muted-foreground">
          <p>Loading bookmarks...</p>
        </div>
      )}

      {error && (
        <div className="text-center text-destructive">
          <p>Error: {error}</p>
        </div>
      )}

      {!isLoading && !error && bookmarks.length > 0 && (
        <div className="mx-auto max-w-2xl space-y-4">
          {bookmarks.map((entry) => (
            <div
              key={entry.id}
              className="group relative"
            >
              <Link
                to="/word/$id"
                params={{ id: entry.id }}
                className="block transition-transform hover:scale-[1.01]"
              >
                <EntryCard
                  onBookmarkToggle={noop}
                  id={entry.id}
                  partOfSpeech={entry.part_of_speech}
                  principalParts={entry.principal_parts}
                  inflection={entry.inflection}
                  translations={entry.translations}
                  bookmarked
                />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  void handleRemoveBookmark(entry.id);
                }}
                title="Remove bookmark"
              >
                <BookmarkX className="h-5 w-5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && bookmarks.length === 0 && (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>No Bookmarks Yet</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              Your bookmarked Latin words will appear here. Save words while
              searching to build your vocabulary list.
            </p>
            <div className="mt-4">
              <Link to="/search">
                <Button variant="outline">Start Searching</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
