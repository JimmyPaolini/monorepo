import {
  Button,
  CardDescription,
  CardTitle,
  cn,
} from "@monorepo/lexico-components";
import { Link } from "@tanstack/react-router";
import { startCase } from "lodash";
import { Bookmark, BookmarkCheck } from "lucide-react";

import { Identifier } from "./identifier";

import type { PartOfSpeech } from "../../lib/supabase";
import type { ReactElement } from "react";

/**
 * Inflection data for noun entries.
 */
export interface NounInflection {
  /** Declension pattern (first, second, third, etc.) */
  declension?: string;
  /** Grammatical gender (masculine, feminine, neuter) */
  gender?: string;
}

/**
 * Inflection data for verb entries.
 */
export interface VerbInflection {
  /** Conjugation pattern (first, second, third, fourth) */
  conjugation?: string;
}

/**
 * Inflection data for adjective entries.
 */
export interface AdjectiveInflection {
  /** Declension pattern */
  declension?: string;
  /** Degree of comparison */
  degree?: string;
}

/**
 * Inflection data for adverb entries.
 */
export interface AdverbInflection {
  /** Adverb type */
  type?: string;
  /** Degree of comparison */
  degree?: string;
}

/**
 * Inflection data for preposition entries.
 */
export interface PrepositionInflection {
  /** Grammatical case governed by the preposition */
  case?: string;
}

/**
 * Inflection data for uninflected parts of speech.
 */
export interface Uninflected {
  /** Additional classification */
  other?: string;
}

/**
 * Union type for all inflection data structures.
 */
export type Inflection =
  | NounInflection
  | VerbInflection
  | AdjectiveInflection
  | AdverbInflection
  | PrepositionInflection
  | Uninflected;

/**
 * Represents a principal part of a word (e.g., nominative, genitive for nouns).
 */
export interface PrincipalPart {
  /** Name of the principal part */
  name: string;
  /** Text forms of the principal part */
  text: string[];
}

/**
 * Gets a human-readable inflection label for display.
 *
 * @param inflection - Inflection data for the entry
 * @param partOfSpeech - Part of speech of the entry
 * @returns Formatted label string (e.g., "first declension, feminine")
 */
function getInflectionLabel(
  inflection: Inflection | null | undefined,
  partOfSpeech: PartOfSpeech,
): string {
  if (!inflection) return startCase(partOfSpeech).toLowerCase();

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

  const result =
    `${startCase(partOfSpeech).toLowerCase()}, ${label}`.replace(
      /, ?$|^, ?/,
      "",
    );
  return result;
}

/**
 * Gets a formatted label from principal parts data.
 *
 * @param principalParts - Principal parts array or object
 * @returns Comma-separated string of principal parts
 */
function getPrincipalPartsLabel(
  principalParts: PrincipalPart[] | Record<string, string | undefined>,
): string {
  if (Array.isArray(principalParts)) {
    return principalParts
      .map((principalPart) => principalPart.text.join("/"))
      .join(", ");
  }
  // Handle object format from database
  return Object.values(principalParts).filter(Boolean).join(", ");
}

/**
 * Props for the PrincipalParts component that displays entry header information.
 */
export interface PrincipalPartsProps {
  bookmarked?: boolean | undefined;
  /** Callback when bookmark is toggled */
  /** Additional class names */
  className?: string | undefined;
  /** Entry ID */
  id: string;
  /** Inflection data */
  inflection?: Inflection | null | undefined;
  /** Whether entry is bookmarked */
  onBookmarkToggle: (id: string) => void;
  /** Part of speech */
  partOfSpeech: PartOfSpeech;
  /** Principal parts array */
  principalParts: PrincipalPart[] | Record<string, string | undefined>;
}

/**
 * Component that displays principal parts, part of speech, and inflection info.
 *
 * @param props - Component props
 * @returns React element
 */
export function PrincipalParts(props: PrincipalPartsProps): ReactElement {
  const {
    bookmarked,
    className,
    id,
    inflection,
    onBookmarkToggle,
    partOfSpeech,
    principalParts,
  } = props;

  // 🪝 Hooks

  // 🏗️ Setup
  const principalPartsLabel = getPrincipalPartsLabel(principalParts);
  const BookmarkToggleIcon = bookmarked ? BookmarkCheck : Bookmark;
  const gender = (inflection as NounInflection | undefined)?.gender;
  const prepositionCase = (inflection as PrepositionInflection | undefined)
    ?.case;
  const declension = (
    inflection as NounInflection | AdjectiveInflection | undefined
  )?.declension;
  const conjugation = (inflection as VerbInflection | undefined)?.conjugation;
  const declensionIdentifier = declension
    ? /declension/i.test(declension)
      ? declension
      : `${declension} declension`
    : undefined;
  const conjugationIdentifier = conjugation
    ? /conjugation/i.test(conjugation)
      ? conjugation
      : `${conjugation} conjugation`
    : undefined;

  // 💪 Handlers

  // 🎨 Markup

  // 🔌 Short Circuits

  return (
    <Link
      to="/word/$id"
      params={{ id }}
      className={cn("flex items-center gap-3 p-4", className)}
    >
      <div className="flex-grow flex items-start flex-col">
        <CardTitle className="text-2xl self-start flex-grow">
          {principalPartsLabel}
        </CardTitle>
        {/* Identifier tags under principal parts */}
        <CardDescription className="flex flex-wrap gap-1 pt-1">
          <Identifier
            identifier={partOfSpeech}
            className="text-xs"
          />
          {/* Declension for nouns/proper nouns/adjectives */}
          {(partOfSpeech === "noun" ||
            partOfSpeech === "properNoun" ||
            partOfSpeech === "adjective" ||
            partOfSpeech === "numeral" ||
            partOfSpeech === "suffix") &&
            declensionIdentifier && (
              <Identifier
                identifier={declensionIdentifier}
                className="text-xs"
              />
            )}
          {/* Conjugation for verbs */}
          {partOfSpeech === "verb" && conjugationIdentifier && (
            <Identifier
              identifier={conjugationIdentifier}
              className="text-xs"
            />
          )}
          {/* Gender for nouns/proper nouns */}
          {(partOfSpeech === "noun" || partOfSpeech === "properNoun") &&
            gender && (
              <Identifier
                identifier={gender}
                className="text-xs"
              />
            )}
          {/* Case for prepositions */}
          {partOfSpeech === "preposition" && prepositionCase && (
            <Identifier
              identifier={prepositionCase}
              className="text-xs"
            />
          )}
        </CardDescription>
      </div>

      <Button
        onClick={() => onBookmarkToggle(id)}
        variant="ghost"
        size="sm"
        aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      >
        <BookmarkToggleIcon className="h-5 w-5" />
      </Button>
    </Link>
  );
}

export { getInflectionLabel, getPrincipalPartsLabel };
