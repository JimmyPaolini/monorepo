import { Link } from "@tanstack/react-router";
import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { Card } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { cn } from "../../lib/utils";

import { AdjectiveFormsTable } from "./adjective-forms-table";
import { NounFormsTable } from "./noun-forms-table";
import { PrincipalParts } from "./principal-parts";
import { VerbFormsTable } from "./verb-forms-table";

import type { AdjectiveForm } from "./adjective-forms-table";
import type { NounForm } from "./noun-forms-table";
import type {
  Inflection,
  PartOfSpeech,
  PrincipalPart,
} from "./principal-parts";
import type { VerbForm } from "./verb-forms-table";

// Forms union type
export type FormsData =
  | { type: "verb"; forms: VerbForm[] }
  | { type: "noun"; forms: NounForm[] }
  | { type: "adjective"; forms: AdjectiveForm[] };

// Pronunciation type
export interface PronunciationDialect {
  phonemes?: string;
  phonemic?: string;
  phonetic?: string;
}

export interface Pronunciation {
  classical?: PronunciationDialect;
  ecclesiastical?: PronunciationDialect;
}

export interface EntryCardProps {
  /** Entry ID */
  id: string;
  /** Part of speech */
  partOfSpeech: PartOfSpeech;
  /** Principal parts array or object */
  principalParts: PrincipalPart[] | Record<string, string | undefined>;
  /** Inflection data */
  inflection?: Inflection | null;
  /** Translation strings */
  translations: string[];
  /** Transformed forms data */
  forms?: FormsData | null;
  /** Etymology text */
  etymology?: string | null;
  /** Pronunciation data */
  pronunciation?: Pronunciation | null;
  /** Whether entry is bookmarked */
  bookmarked?: boolean;
  /** Callback when bookmark is toggled */
  onBookmarkToggle?: (id: string) => void;
  /** Whether translations are expanded by default */
  translationsExpanded?: boolean;
  /** Whether this result is from a Latin search (adds accent border) */
  isLatinSearchResult?: boolean;
  /** Additional class names */
  className?: string;
}

const EntryCard = React.forwardRef<HTMLDivElement, EntryCardProps>(
  (
    {
      id,
      partOfSpeech,
      principalParts,
      inflection,
      translations,
      forms,
      etymology,
      pronunciation,
      bookmarked,
      onBookmarkToggle,
      translationsExpanded = false,
      isLatinSearchResult = true,
      className,
    },
    ref,
  ) => {
    const hasPronunciation =
      pronunciation?.classical || pronunciation?.ecclesiastical;

    const hasForms = Boolean(forms);

    const hasTranslations = translations.length > 0;
    const hasExpandableTranslations = translations.length > 2;

    const [accordionValue, setAccordionValue] = React.useState<string>(
      translationsExpanded ? "translations" : "",
    );

    return (
      <Card
        ref={ref}
        className={cn(
          "overflow-hidden",
          !isLatinSearchResult && "border-t-4 border-t-secondary",
          className,
        )}
      >
        <Link
          to="/word/$id"
          params={{ id }}
        >
          <PrincipalParts
            id={id}
            partOfSpeech={partOfSpeech}
            principalParts={principalParts}
            inflection={inflection}
            bookmarked={bookmarked}
            onBookmarkToggle={onBookmarkToggle}
          />
        </Link>
        <Separator />
        <Accordion
          type="single"
          collapsible
          {...(accordionValue ? { value: accordionValue } : {})}
          onValueChange={(value: string) => setAccordionValue(value || "")}
        >
          {/* Translations Section */}
          {hasTranslations && (
            <>
              {hasExpandableTranslations ? (
                <AccordionItem
                  value="translations"
                  className="border-b-0"
                >
                  <AccordionTrigger className="px-4 text-sm font-medium">
                    <div className="flex-1 space-y-1 text-left">
                      {translations.slice(0, 2).map((translation) => (
                        <div
                          key={translation}
                          className="flex items-start gap-2"
                        >
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                          <span className="text-foreground font-normal">
                            {translation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-1 -mt-1">
                      {translations.slice(2).map((translation) => (
                        <div
                          key={translation}
                          className="flex items-start gap-2"
                        >
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                          <span className="text-foreground">{translation}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <div className="px-4 py-4">
                  <div className="space-y-1">
                    {translations.map((translation) => (
                      <div
                        key={translation}
                        className="flex items-start gap-2"
                      >
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                        <span className="text-foreground">{translation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(hasPronunciation || hasForms || etymology) && <Separator />}
            </>
          )}

          {/* Pronunciation Section */}
          {hasPronunciation && (
            <>
              <AccordionItem
                value="pronunciation"
                className="border-b-0"
              >
                <AccordionTrigger className="px-4 text-sm font-medium">
                  Pronunciation
                </AccordionTrigger>
                <AccordionContent className="px-4 space-y-2 text-sm pb-4">
                  {pronunciation.classical?.phonetic && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-muted-foreground">
                        Classical:
                      </span>
                      <span className="font-mono">
                        {pronunciation.classical.phonetic}
                      </span>
                    </div>
                  )}
                  {pronunciation.ecclesiastical?.phonetic && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-muted-foreground">
                        Ecclesiastical:
                      </span>
                      <span className="font-mono">
                        {pronunciation.ecclesiastical.phonetic}
                      </span>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
              {(hasForms || etymology) && <Separator />}
            </>
          )}

          {/* Forms Section */}
          {forms && (
            <>
              <AccordionItem
                value="forms"
                className="border-b-0 group"
              >
                <AccordionTrigger className="px-4 text-sm font-medium">
                  Forms
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {forms.type === "noun" && (
                    <NounFormsTable forms={forms.forms} />
                  )}
                  {forms.type === "verb" && (
                    <VerbFormsTable forms={forms.forms} />
                  )}
                  {forms.type === "adjective" && (
                    <AdjectiveFormsTable forms={forms.forms} />
                  )}
                </AccordionContent>
              </AccordionItem>
              {etymology && <Separator />}
            </>
          )}

          {/* Etymology Section */}
          {etymology && (
            <AccordionItem
              value="etymology"
              className="border-b-0"
            >
              <AccordionTrigger className="px-4 text-sm font-medium">
                Etymology
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-foreground">{etymology}</p>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </Card>
    );
  },
);
EntryCard.displayName = "EntryCard";

export { EntryCard };
