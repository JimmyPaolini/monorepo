/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  AdjectiveFormsTable,
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

import { transformForms } from "../lib/forms";
import { getEntry } from "../lib/search";

import type { EntryFull } from "../lib/types";
import type { ReactNode } from "react";

export const Route = createFileRoute("/word/$id")({
  loader: async ({ params }): Promise<{ entry: EntryFull | null }> => {
    const entry = await getEntry({ data: { id: params.id } });
    return { entry };
  },
  component: WordPage,
});

function WordPage(): ReactNode {
  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- TanStack Router type inference
  const loaderData = Route.useLoaderData();
  const { entry } = loaderData;

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
      {/* Back link */}
      <Link
        to="/search"
        className="text-muted-foreground hover:text-foreground"
      >
        ← Back to Search
      </Link>

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
      {entry.pronunciation &&
        (entry.pronunciation.classical ||
          entry.pronunciation.ecclesiastical) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pronunciation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {entry.pronunciation.classical?.phonetic && (
                <div>
                  <span className="font-medium">Classical: </span>
                  <span className="font-mono">
                    {entry.pronunciation.classical.phonetic}
                  </span>
                </div>
              )}
              {entry.pronunciation.ecclesiastical?.phonetic && (
                <div>
                  <span className="font-medium">Ecclesiastical: </span>
                  <span className="font-mono">
                    {entry.pronunciation.ecclesiastical.phonetic}
                  </span>
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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- forms may be null from DB
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
