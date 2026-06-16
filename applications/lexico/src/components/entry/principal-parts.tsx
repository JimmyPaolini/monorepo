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

import type { PartOfSpeech } from "../../lib/types";
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
 * Props for the InflectionBadge sub-component.
 */
interface InflectionBadgeProps {
  conjugation: string | undefined;
  declension: string | undefined;
  gender: string | undefined;
  partOfSpeech: PartOfSpeech;
  prepositionCase: string | undefined;
}

type InflectionLabelBuilder = (inflection: Inflection) => string;

/**
 * Component that displays principal parts, part of speech, and inflection info.
 *
 * @param props - Component props
 * @returns React element
 */
export function PrincipalParts(properties: PrincipalPartsProps): ReactElement {
  const {
    bookmarked,
    className,
    id,
    inflection,
    onBookmarkToggle,
    partOfSpeech,
    principalParts,
  } = properties;

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
        <InflectionBadge
          conjugation={conjugation}
          declension={declension}
          gender={gender}
          partOfSpeech={partOfSpeech}
          prepositionCase={prepositionCase}
        />
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

  const label = buildInflectionLabel(inflection, partOfSpeech);
  return `${startCase(partOfSpeech).toLowerCase()}, ${label}`.replace(
    /, ?$|^, ?/,
    "",
  );
}

// 🗺 Inflection label builders

/**
 * Renders the set of inflection identifier badges for an entry.
 */
function InflectionBadge(properties: InflectionBadgeProps): ReactElement {
  const { conjugation, declension, gender, partOfSpeech, prepositionCase } =
    properties;

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

  const showDeclension =
    declensionIdentifier !== undefined &&
    ["adjective", "noun", "numeral", "properNoun", "suffix"].includes(
      partOfSpeech,
    );
  const showConjugation =
    partOfSpeech === "verb" && conjugationIdentifier !== undefined;
  const showGender =
    ["noun", "properNoun"].includes(partOfSpeech) && gender !== undefined;
  const showCase =
    partOfSpeech === "preposition" && prepositionCase !== undefined;

  return (
    <CardDescription className="flex flex-wrap gap-1 pt-1">
      <Identifier
        className="text-xs"
        identifier={partOfSpeech}
      />
      {showDeclension && (
        <Identifier
          className="text-xs"
          identifier={declensionIdentifier}
        />
      )}
      {showConjugation && (
        <Identifier
          className="text-xs"
          identifier={conjugationIdentifier}
        />
      )}
      {showGender && (
        <Identifier
          className="text-xs"
          identifier={gender}
        />
      )}
      {showCase && (
        <Identifier
          className="text-xs"
          identifier={prepositionCase}
        />
      )}
    </CardDescription>
  );
}

const inflectionLabelBuilders: Partial<
  Record<PartOfSpeech, InflectionLabelBuilder>
> = {
  adjective: (inflection) =>
    buildAdjectiveInflectionLabel(inflection as AdjectiveInflection),
  adverb: (inflection) =>
    buildAdverbInflectionLabel(inflection as AdverbInflection),
  noun: (inflection) => buildNounInflectionLabel(inflection as NounInflection),
  numeral: (inflection) =>
    buildAdjectiveInflectionLabel(inflection as AdjectiveInflection),
  preposition: (inflection) =>
    buildPrepositionInflectionLabel(inflection as PrepositionInflection),
  properNoun: (inflection) =>
    buildNounInflectionLabel(inflection as NounInflection),
  suffix: (inflection) =>
    buildAdjectiveInflectionLabel(inflection as AdjectiveInflection),
  verb: (inflection) => buildVerbInflectionLabel(inflection as VerbInflection),
};

function buildAdjectiveInflectionLabel(
  inflection: AdjectiveInflection,
): string {
  const { declension, degree } = inflection;
  if (declension && degree) return `${declension} declension, ${degree}`;
  if (declension) return `${declension} declension`;
  return degree ?? "";
}

function buildAdverbInflectionLabel(inflection: AdverbInflection): string {
  const { degree, type } = inflection;
  if (type && degree) return `${type}, ${degree}`;
  if (type) return type;
  return degree ?? "";
}

function buildInflectionLabel(
  inflection: Inflection,
  partOfSpeech: PartOfSpeech,
): string {
  const builder = inflectionLabelBuilders[partOfSpeech];
  return builder
    ? builder(inflection)
    : ((inflection as Uninflected).other ?? "");
}

function buildNounInflectionLabel(inflection: NounInflection): string {
  const { declension, gender } = inflection;
  if (declension && gender) return `${declension} declension, ${gender}`;
  if (declension) return `${declension} declension`;
  return gender ?? "";
}

function buildPrepositionInflectionLabel(
  inflection: PrepositionInflection,
): string {
  return inflection.case ?? "";
}

function buildVerbInflectionLabel(inflection: VerbInflection): string {
  return inflection.conjugation ? `${inflection.conjugation} conjugation` : "";
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
