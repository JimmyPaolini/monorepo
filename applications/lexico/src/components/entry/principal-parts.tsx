import { Link } from "@tanstack/react-router";
import { startCase } from "lodash";
import { Bookmark, BookmarkCheck } from "lucide-react";

import {
  Button,
  CardDescription,
  CardTitle,
  cn,
} from "@monorepo/lexico-components";

import { Identifier } from "./identifier";

import type { PartOfSpeech } from "../../lib/supabase";
import type { ReactElement } from "react";

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
  /** Degree of comparison */
  degree?: string;
  /** Adverb type */
  type?: string;
}

/**
 * Union type for all inflection data structures.
 */
export type Inflection =
  | AdjectiveInflection
  | AdverbInflection
  | NounInflection
  | PrepositionInflection
  | Uninflected
  | VerbInflection;

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
 * Inflection data for preposition entries.
 */
export interface PrepositionInflection {
  /** Grammatical case governed by the preposition */
  case?: string;
}

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
 * Inflection data for uninflected parts of speech.
 */
export interface Uninflected {
  /** Additional classification */
  other?: string;
}

/**
 * Inflection data for verb entries.
 */
export interface VerbInflection {
  /** Conjugation pattern (first, second, third, fourth) */
  conjugation?: string;
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

  // 🏗 Setup
  const principalPartsLabel = getPrincipalPartsLabel(principalParts);
  const BookmarkToggleIcon = bookmarked ? BookmarkCheck : Bookmark;
  const gender = (inflection as NounInflection | undefined)?.gender;
  const prepositionCase = (inflection as PrepositionInflection | undefined)
    ?.case;
  const declension = (
    inflection as AdjectiveInflection | NounInflection | undefined
  )?.declension;
  const conjugation = (inflection as undefined | VerbInflection)?.conjugation;
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
      className={cn("flex items-center gap-3 p-4", className)}
      params={{ id }}
      to="/word/$id"
    >
      <div className="flex-grow flex items-start flex-col">
        <CardTitle className="text-2xl self-start flex-grow">
          {principalPartsLabel}
        </CardTitle>
        {/* Identifier tags under principal parts */}
        <CardDescription className="flex flex-wrap gap-1 pt-1">
          <Identifier
            className="text-xs"
            identifier={partOfSpeech}
          />
          {/* Declension for nouns/proper nouns/adjectives */}
          {(partOfSpeech === "noun" ||
            partOfSpeech === "properNoun" ||
            partOfSpeech === "adjective" ||
            partOfSpeech === "numeral" ||
            partOfSpeech === "suffix") &&
            declensionIdentifier && (
              <Identifier
                className="text-xs"
                identifier={declensionIdentifier}
              />
            )}
          {/* Conjugation for verbs */}
          {partOfSpeech === "verb" && conjugationIdentifier && (
            <Identifier
              className="text-xs"
              identifier={conjugationIdentifier}
            />
          )}
          {/* Gender for nouns/proper nouns */}
          {(partOfSpeech === "noun" || partOfSpeech === "properNoun") &&
            gender && (
              <Identifier
                className="text-xs"
                identifier={gender}
              />
            )}
          {/* Case for prepositions */}
          {partOfSpeech === "preposition" && prepositionCase && (
            <Identifier
              className="text-xs"
              identifier={prepositionCase}
            />
          )}
        </CardDescription>
      </div>

      <Button
        aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
        onClick={() => onBookmarkToggle(id)}
        size="sm"
        variant="ghost"
      >
        <BookmarkToggleIcon className="h-5 w-5" />
      </Button>
    </Link>
  );
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
    const { degree, type } = inflection as AdverbInflection;
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

  const result = `${startCase(partOfSpeech).toLowerCase()}, ${label}`.replace(
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

export { getInflectionLabel, getPrincipalPartsLabel };
