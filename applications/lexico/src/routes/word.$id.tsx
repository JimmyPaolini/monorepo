import {
  AdjectiveFormsTable,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  NounFormsTable,
  PrincipalParts,
  Separator,
  Translations,
  VerbFormsTable,
} from "@monorepo/lexico-components";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PronunciationButton } from "../components/pronunciation-button";
import { isBookmarked, toggleBookmark } from "../lib/bookmarks";
import { transformForms } from "../lib/forms";
import { getEntry } from "../lib/search";

import type { EntryFull } from "../lib/types";
import type { ReactNode } from "react";

export const Route = createFileRoute("/word/$id")({
  loader: async ({ params }) => {
    const entry = await getEntry({ data: { id: params.id } });
    return { entry };
  },
  component: WordPage,
});

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

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Back link and bookmark */}
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

      {/* Main entry card */}
      <Card>
        <PrincipalParts
          id={entry.id}
          partOfSpeech={entry.part_of_speech}
          principalParts={entry.principal_parts}
          inflection={entry.inflection}
        />
        <Separator className="mx-4" />
        <CardContent className="pt-3">
          <Translations
            translations={entry.translations}
            defaultExpanded
          />
        </CardContent>
      </Card>

      {/* Pronunciation section */}
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- pronunciation can be null from DB */}
      {entry.pronunciation &&
        (entry.pronunciation.classical ||
          entry.pronunciation.ecclesiastical) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pronunciation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {entry.pronunciation.classical?.phonetic && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Classical: </span>
                  <span className="font-mono">
                    {entry.pronunciation.classical.phonetic}
                  </span>
                  <PronunciationButton
                    text={entry.principal_parts.present ?? entry.id}
                    dialect="classical"
                  />
                </div>
              )}
              {entry.pronunciation.ecclesiastical?.phonetic && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Ecclesiastical: </span>
                  <span className="font-mono">
                    {entry.pronunciation.ecclesiastical.phonetic}
                  </span>
                  <PronunciationButton
                    text={entry.principal_parts.present ?? entry.id}
                    dialect="ecclesiastical"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Forms section */}
      <FormsSection entry={entry} />

      {/* Etymology section */}
      {entry.etymology && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Etymology</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{entry.etymology}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FormsSection({ entry }: { entry: EntryFull }): ReactNode {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- forms can be null from DB
  const transformed = entry.forms
    ? transformForms(entry.part_of_speech, entry.forms)
    : null;

  if (!transformed) {
    return null;
  }

  const { type, forms } = transformed;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Forms</CardTitle>
      </CardHeader>
      <CardContent>
        {type === "noun" && <NounFormsTable forms={forms} />}
        {type === "verb" && <VerbFormsTable forms={forms} />}
        {type === "adjective" && <AdjectiveFormsTable forms={forms} />}
      </CardContent>
    </Card>
  );
}
