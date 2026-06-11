import { type ReactElement, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  CardContent,
  CardHeader,
  cn,
  Separator,
} from "@monorepo/lexico-components";

import { AdjectiveFormsTable } from "./adjective-forms-table";
import { NounFormsTable } from "./noun-forms-table";
import { PrincipalParts } from "./principal-parts";
import { Translations } from "./translations";
import { VerbFormsTable } from "./verb-forms-table";

import type { PartOfSpeech } from "../../lib/types";
import type { AdjectiveForm } from "./adjective-forms-table";
import type { NounForm } from "./noun-forms-table";
import type { Inflection, PrincipalPart } from "./principal-parts";
import type { VerbForm } from "./verb-forms-table";

/**
 * Props for the EntryCard component that displays a lexical entry.
 */
export interface EntryCardProps {
  /** Whether entry is bookmarked */
  bookmarked?: boolean;
  /** Additional class names */
  className?: string;
  /** Etymology text */
  etymology?: null | string;
  /** Transformed forms data */
  forms?: FormsData | null;
  /** Entry ID */
  id: string;
  /** Inflection data */
  inflection?: Inflection | null;
  /** Whether this result is from a Latin search (adds accent border) */
  isLatinSearchResult?: boolean;
  /** Callback when bookmark is toggled */
  onBookmarkToggle: (id: string) => void;
  /** Part of speech */
  partOfSpeech: PartOfSpeech;
  /** Principal parts array or object */
  principalParts: PrincipalPart[] | Record<string, string | undefined>;
  /** Pronunciation data */
  pronunciation?: null | Pronunciation;
  /** Translation strings */
  translations: string[];
  /** Whether translations are expanded by default */
  translationsExpanded?: boolean;
}

/**
 * Union type for different word form data structures.
 */
export type FormsData =
  | { forms: AdjectiveForm[]; type: "adjective" }
  | { forms: NounForm[]; type: "noun" }
  | { forms: VerbForm[]; type: "verb" };

/**
 * Pronunciation data for both Classical and Ecclesiastical Latin.
 */
export interface Pronunciation {
  /** Classical Latin pronunciation */
  classical?: PronunciationDialect;
  /** Ecclesiastical Latin pronunciation */
  ecclesiastical?: PronunciationDialect;
}

/**
 * Pronunciation data for a specific dialect.
 */
export interface PronunciationDialect {
  /** Phoneme representation */
  phonemes?: string;
  /** Phonemic transcription */
  phonemic?: string;
  /** Phonetic transcription */
  phonetic?: string;
}

/**
 *
 */
export function EntryCard(properties: EntryCardProps): ReactElement {
  const {
    bookmarked,
    etymology,
    forms,
    id,
    inflection,
    onBookmarkToggle,
    partOfSpeech,
    principalParts,
    pronunciation,
    translations,
    translationsExpanded = false,
    // isLatinSearchResult = true,
    className,
  } = properties;

  // 🪝 Hooks
  const [accordionValue, setAccordionValue] = useState(
    translationsExpanded ? "translations" : "",
  );

  // 🏗 Setup
  const hasPronunciation =
    pronunciation?.classical || pronunciation?.ecclesiastical;

  const hasForms = Boolean(forms);

  // const hasTranslations = translations.length > 0;
  // const hasExpandableTranslations = translations.length > 2;

  // 💪 Handlers

  // 🎨 Markup

  // 🔌 Short Circuits

  return (
    <Card className={cn(className)}>
      <CardHeader className="p-0">
        <PrincipalParts
          bookmarked={bookmarked}
          id={id}
          inflection={inflection}
          onBookmarkToggle={onBookmarkToggle}
          partOfSpeech={partOfSpeech}
          principalParts={principalParts}
        />
      </CardHeader>
      <Separator />
      <CardContent>
        <Translations
          defaultOpen={translationsExpanded}
          translations={translations}
        />
        <Separator />
        <Accordion
          type="single"
          collapsible
          {...(accordionValue ? { value: accordionValue } : {})}
          onValueChange={(value: string) => setAccordionValue(value || "")}
        >
          {/* Pronunciation Section */}
          {hasPronunciation && (
            <>
              <AccordionItem
                className="border-b-0"
                value="pronunciation"
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
                className="border-b-0 group"
                value="forms"
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
              className="border-b-0"
              value="etymology"
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
      </CardContent>
    </Card>
  );
}
