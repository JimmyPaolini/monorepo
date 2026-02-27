import { Button, Separator } from "@monorepo/lexico-components";
import { createFileRoute, Link } from "@tanstack/react-router";
import { noop } from "lodash";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AdjectiveFormsTable } from "../components/entry/adjective-forms-table";
import { NounFormsTable } from "../components/entry/noun-forms-table";
import { PrincipalParts } from "../components/entry/principal-parts";
import { VerbFormsTable } from "../components/entry/verb-forms-table";
import { PronunciationButton } from "../components/pronunciation-button";
import { isBookmarked, toggleBookmark } from "../lib/bookmarks";
import { transformForms } from "../lib/forms";
import { getEntry } from "../lib/search";

import type { ReactNode } from "react";

export const Route = createFileRoute("/word/$id")({
  loader: async ({ params }) => {
    const entry = await getEntry({ data: { id: params.id } });
    return { entry };
  },
  component: WordPage,
});

/**
 * Word detail page component that displays full entry information.
 *
 * @returns React node
 */
function WordPage(): ReactNode {
  const loaderData = Route.useLoaderData();
  const { entry } = loaderData;
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (entry) {
      void isBookmarked({ data: { entryId: entry.id } }).then(setBookmarked);
    }
  }, [entry]);

  const handleBookmarkToggle = useCallback(async () => {
    if (!entry) return;
    const result = await toggleBookmark({ data: { entryId: entry.id } });
    if (result.success) {
      setBookmarked(result.bookmarked);
    }
  }, [entry]);

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <h1 className="text-2xl font-bold">Entry Not Found</h1>
        <p className="text-muted-foreground">
          The word you are looking for does not exist in our dictionary.
        </p>
        <Link
          to="/search"
          className="text-primary hover:underline"
        >
          ← Back to Search
        </Link>
      </div>
    );
  }

  // Transform forms data
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- forms can be null from DB
  const transformed = entry.forms
    ? transformForms(entry.part_of_speech, entry.forms)
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      {/* Navigation bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/search"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back to Search
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void handleBookmarkToggle()}
          title={bookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          {bookmarked ? (
            <BookmarkCheck className="h-5 w-5 text-primary" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Page header with principal parts */}
      <header className="space-y-2">
        <PrincipalParts
          id={entry.id}
          partOfSpeech={entry.part_of_speech}
          principalParts={entry.principal_parts}
          inflection={entry.inflection}
          className="border-none p-0"
          onBookmarkToggle={noop}
        />
      </header>

      <Separator />

      {/* Main content sections */}
      <article className="space-y-10">
        {/* Translations section */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Definitions</h2>
          <ul className="space-y-2">
            {entry.translations.map((translation) => (
              <li
                key={translation}
                className="flex items-start gap-3"
              >
                <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                <span className="text-lg">{translation}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Pronunciation section */}
        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- pronunciation can be null from DB */}
        {entry.pronunciation &&
          (entry.pronunciation.classical ||
            entry.pronunciation.ecclesiastical) && (
            <>
              <Separator />
              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">Pronunciation</h2>
                <div className="space-y-3">
                  {entry.pronunciation.classical?.phonetic && (
                    <div className="flex items-center gap-3">
                      <span className="min-w-32 font-medium text-muted-foreground">
                        Classical:
                      </span>
                      <span className="font-mono text-lg">
                        {entry.pronunciation.classical.phonetic}
                      </span>
                      <PronunciationButton
                        text={entry.principal_parts.present ?? entry.id}
                        dialect="classical"
                      />
                    </div>
                  )}
                  {entry.pronunciation.ecclesiastical?.phonetic && (
                    <div className="flex items-center gap-3">
                      <span className="min-w-32 font-medium text-muted-foreground">
                        Ecclesiastical:
                      </span>
                      <span className="font-mono text-lg">
                        {entry.pronunciation.ecclesiastical.phonetic}
                      </span>
                      <PronunciationButton
                        text={entry.principal_parts.present ?? entry.id}
                        dialect="ecclesiastical"
                      />
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

        {/* Forms section */}
        {transformed && (
          <>
            <Separator />
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Forms</h2>
              {transformed.type === "noun" && (
                <NounFormsTable forms={transformed.forms} />
              )}
              {transformed.type === "verb" && (
                <VerbFormsTable forms={transformed.forms} />
              )}
              {transformed.type === "adjective" && (
                <AdjectiveFormsTable forms={transformed.forms} />
              )}
            </section>
          </>
        )}

        {/* Etymology section */}
        {entry.etymology && (
          <>
            <Separator />
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">Etymology</h2>
              <p className="text-lg leading-relaxed">{entry.etymology}</p>
            </section>
          </>
        )}
      </article>
    </div>
  );
}
