import {
  Button,
  CardDescription,
  CardTitle,
  cn,
} from "@monorepo/lexico-components";
import { Link } from "@tanstack/react-router";
import _ from "lodash";
import { Bookmark, BookmarkCheck } from "lucide-react";

import { Identifier } from "./identifier";

import type { PartOfSpeech } from "../../lib/supabase";
import type { ReactElement } from "react";

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

// Principal part structure from database
export interface PrincipalPart {
  name: string;
  text: string[];
}

// Get inflection label based on part of speech
function getInflectionLabel(
  inflection: Inflection | null | undefined,
  partOfSpeech: PartOfSpeech,
): string {
  if (!inflection) return _(partOfSpeech).startCase().toLowerCase();

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
    `${_(partOfSpeech).startCase().toLowerCase()}, ${label}`.replace(
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
    return principalParts
      .map((principalPart) => principalPart.text.join("/"))
      .join(", ");
  }
  // Handle object format from database
  return Object.values(principalParts).filter(Boolean).join(", ");
}

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
