import { Bookmark, BookmarkCheck } from "lucide-react";
import * as React from "react";

import { cn } from "../../generated/utils/utils";

import { Identifier } from "./identifier";

// Inflection types matching database structure
export interface NounInflection {
  declension?: string;
  gender?: string;
}

export interface VerbInflection {
  conjugation?: string;
}

export interface AdjectiveInflection {
  declension?: string;
  degree?: string;
}

export interface AdverbInflection {
  type?: string;
  degree?: string;
}

export interface PrepositionInflection {
  case?: string;
}

export interface Uninflected {
  other?: string;
}

export type Inflection =
  | NounInflection
  | VerbInflection
  | AdjectiveInflection
  | AdverbInflection
  | PrepositionInflection
  | Uninflected;

export type PartOfSpeech =
  | "adjective"
  | "adverb"
  | "conjunction"
  | "interjection"
  | "noun"
  | "numeral"
  | "preposition"
  | "pronoun"
  | "properNoun"
  | "suffix"
  | "verb";

// Principal part structure from database
export interface PrincipalPart {
  name: string;
  text: string[];
}

export interface PrincipalPartsProps {
  /** Entry ID */
  id: string;
  /** Part of speech */
  partOfSpeech: PartOfSpeech;
  /** Principal parts array */
  principalParts: PrincipalPart[] | Record<string, string | undefined>;
  /** Inflection data */
  inflection?: Inflection | null | undefined;
  /** Whether entry is bookmarked */
  bookmarked?: boolean | undefined;
  /** Callback when bookmark is toggled */
  onBookmarkToggle?: ((id: string) => void) | undefined;
  /** Additional class names */
  className?: string | undefined;
}

// Helper to convert camelCase to readable text
function unCamelCase(text: string): string {
  return text.replace(/([A-Z])/g, " $1").toLowerCase();
}

// Get inflection label based on part of speech
function getInflectionLabel(
  inflection: Inflection | null | undefined,
  partOfSpeech: PartOfSpeech,
): string {
  if (!inflection) return unCamelCase(partOfSpeech);

  let label = "";

  if (partOfSpeech === "noun" || partOfSpeech === "properNoun") {
    const { declension, gender } = inflection as NounInflection;
    if (declension && gender) label = `${declension} declension, ${gender}`;
    else if (declension) label = `${declension} declension`;
    else if (gender) label = gender;
  } else if (partOfSpeech === "verb") {
    const { conjugation } = inflection as VerbInflection;
    if (conjugation) label = `${conjugation} conjugation`;
  } else if (["adjective", "numeral", "suffix"].includes(partOfSpeech)) {
    const { declension, degree } = inflection as AdjectiveInflection;
    if (declension && degree) label = `${declension} declension, ${degree}`;
    else if (declension) label = `${declension} declension`;
    else if (degree) label = degree;
  } else if (partOfSpeech === "adverb") {
    const { type, degree } = inflection as AdverbInflection;
    if (type && degree) label = `${type}, ${degree}`;
    else if (type) label = type;
    else if (degree) label = degree;
  } else if (partOfSpeech === "preposition") {
    const prepInflection = inflection as PrepositionInflection;
    if (prepInflection.case) label = prepInflection.case;
  } else {
    const { other } = inflection as Uninflected;
    if (other) label = other;
  }

  const result = `${unCamelCase(partOfSpeech)}, ${label}`.replace(
    /, ?$|^, ?/,
    "",
  );
  return result;
}

// Get principal parts label
function getPrincipalPartsLabel(
  principalParts: PrincipalPart[] | Record<string, string | undefined>,
): string {
  if (Array.isArray(principalParts)) {
    return principalParts.map((part) => part.text.join("/")).join(", ");
  }
  // Handle object format from database
  return Object.values(principalParts).filter(Boolean).join(", ");
}

const PrincipalParts = React.forwardRef<HTMLDivElement, PrincipalPartsProps>(
  (
    {
      id,
      partOfSpeech,
      principalParts,
      inflection,
      bookmarked,
      onBookmarkToggle,
      className,
    },
    ref,
  ) => {
    const principalPartsLabel = getPrincipalPartsLabel(principalParts);
    const inflectionLabel = getInflectionLabel(inflection, partOfSpeech);

    const handleBookmarkClick = (e: React.MouseEvent): void => {
      e.stopPropagation();
      onBookmarkToggle?.(id);
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-start gap-3 p-4", className)}
      >
        {/* Left side: Part of speech identifier */}
        <div className="flex shrink-0 flex-col gap-1">
          <Identifier identifier={partOfSpeech} />
          {/* Gender for nouns/prepositions */}
          {(partOfSpeech === "noun" || partOfSpeech === "properNoun") &&
            (() => {
              const gender = (inflection as NounInflection | undefined)?.gender;
              return gender ? (
                <Identifier
                  identifier={gender}
                  size="sm"
                />
              ) : null;
            })()}
          {partOfSpeech === "preposition" &&
            (() => {
              const prepCase = (inflection as PrepositionInflection | undefined)
                ?.case;
              return prepCase ? (
                <Identifier
                  identifier={prepCase}
                  size="sm"
                />
              ) : null;
            })()}
        </div>

        {/* Center: Principal parts and inflection info */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg font-medium text-foreground truncate"
            title={principalPartsLabel}
          >
            {principalPartsLabel}
          </h3>
          <p className="text-sm text-muted-foreground">{inflectionLabel}</p>
        </div>

        {/* Right side: Bookmark button */}
        {onBookmarkToggle && (
          <button
            type="button"
            onClick={handleBookmarkClick}
            className="shrink-0 p-1 text-muted-foreground hover:text-primary transition-colors"
            aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            {bookmarked ? (
              <BookmarkCheck className="h-5 w-5 fill-current" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    );
  },
);
PrincipalParts.displayName = "PrincipalParts";

export { PrincipalParts, getInflectionLabel, getPrincipalPartsLabel };
