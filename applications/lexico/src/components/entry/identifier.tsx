import { startCase } from "lodash";

import {
  Badge,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@monorepo/lexico-components";

import type { ReactElement } from "react";

// Abbreviation mappings
const abbreviations: Record<string, string> = {
  // Parts of speech
  adjective: "ADJ",
  adverb: "ADV",
  conjunction: "CJN",
  determiner: "PRON",
  interjection: "!!",
  noun: "NOUN",
  numeral: "NUM",
  preposition: "PREP",
  pronoun: "PRON",
  properNoun: "PN",
  suffix: "-X-",
  verb: "VERB",
  // Cases
  ablative: "ABL",
  accusative: "ACC",
  dative: "DAT",
  genitive: "GEN",
  locative: "LOC",
  nominative: "NOM",
  vocative: "VOC",
  // Gender
  feminine: "FEM",
  masculine: "MASC",
  neuter: "NEU",
  // Number
  plural: "P",
  singular: "S",
  // Mood
  imperative: "IMPV",
  indicative: "IND",
  infinitive: "INF",
  "non finite": "NONF",
  subjunctive: "SUB",
  // Tense
  future: "FUT",
  "future perfect": "FUTP",
  imperfect: "IMP",
  perfect: "PERF",
  pluperfect: "PLUP",
  present: "PRES",
  // Misc
  gerund: "GER",
  "gerund/supine": "GER/SUP",
  participle: "PART",
  supine: "SUP",
  // Voice
  active: "ACT",
  passive: "PAS",
  // Person
  first: "1",
  second: "2",
  third: "3",
  // Declensions
  "fifth declension": "5TH DECL",
  "first declension": "1ST DECL",
  "fourth declension": "4TH DECL",
  "second declension": "2ND DECL",
  "third declension": "3RD DECL",
  // Conjugations
  "first conjugation": "1ST CONJ",
  "fourth conjugation": "4TH CONJ",
  "second conjugation": "2ND CONJ",
  "third conjugation": "3RD CONJ",
};

// Color styles for each identifier type
const identifierStyles: Record<
  string,
  { bg: string; border?: string; rounded?: boolean; text: string }
> = {
  // Parts of speech (rounded)
  adjective: { bg: "bg-green-600", rounded: true, text: "text-white" },
  adverb: { bg: "bg-orange-500", rounded: true, text: "text-black" },
  conjunction: { bg: "bg-pink-400", rounded: true, text: "text-black" },
  determiner: { bg: "bg-purple-600", rounded: true, text: "text-white" },
  interjection: { bg: "bg-black", rounded: true, text: "text-white" },
  noun: { bg: "bg-blue-600", rounded: true, text: "text-white" },
  numeral: { bg: "bg-gray-500", rounded: true, text: "text-black" },
  preposition: { bg: "bg-yellow-400", rounded: true, text: "text-black" },
  pronoun: { bg: "bg-purple-600", rounded: true, text: "text-white" },
  properNoun: { bg: "bg-blue-600", rounded: true, text: "text-white" },
  suffix: { bg: "bg-black", rounded: true, text: "text-white" },
  verb: { bg: "bg-red-600", rounded: true, text: "text-white" },
  // Cases
  ablative: { bg: "bg-pink-500", text: "text-white" },
  accusative: { bg: "bg-red-500", text: "text-white" },
  dative: { bg: "bg-lime-400", text: "text-black" },
  genitive: { bg: "bg-green-700", text: "text-white" },
  locative: { bg: "bg-amber-800", text: "text-white" },
  nominative: { bg: "bg-blue-500", text: "text-white" },
  vocative: { bg: "bg-orange-600", text: "text-white" },
  // Gender
  feminine: { bg: "bg-green-500", text: "text-white" },
  masculine: { bg: "bg-orange-500", text: "text-white" },
  neuter: { bg: "bg-purple-500", text: "text-white" },
  // Number
  plural: { bg: "bg-black", text: "text-white" },
  singular: { bg: "bg-white", text: "text-black" },
  // Mood
  imperative: { bg: "bg-rose-900", text: "text-white" },
  indicative: { bg: "bg-sky-600", text: "text-white" },
  infinitive: { bg: "bg-lime-500", text: "text-black" },
  "non finite": { bg: "bg-olive-600", text: "text-black" },
  subjunctive: { bg: "bg-fuchsia-500", text: "text-white" },
  // Tense
  future: { bg: "bg-yellow-500", text: "text-black" },
  "future perfect": { bg: "bg-emerald-600", text: "text-black" },
  imperfect: { bg: "bg-green-800", text: "text-white" },
  perfect: { bg: "bg-red-700", text: "text-white" },
  pluperfect: { bg: "bg-indigo-700", text: "text-white" },
  present: { bg: "bg-blue-600", text: "text-white" },
  // Misc
  gerund: { bg: "bg-amber-500", text: "text-black" },
  "gerund/supine": { bg: "bg-orange-400", text: "text-black" },
  participle: { bg: "bg-sky-400", text: "text-black" },
  supine: { bg: "bg-pink-600", text: "text-white" },
  // Voice
  active: {
    bg: "bg-neutral-600",
    border: "border border-white",
    text: "text-white",
  },
  passive: {
    bg: "bg-neutral-400",
    border: "border-2 border-black",
    text: "text-black",
  },
  // Person
  first: { bg: "bg-blue-600", text: "text-white" },
  second: { bg: "bg-red-600", text: "text-white" },
  third: { bg: "bg-yellow-400", text: "text-black" },
};

/**
 * Props for the Identifier component that displays labeled badges.
 */
export interface IdentifierProps {
  /** Additional class names */
  className?: string;
  /** The identifier name (e.g., "noun", "nominative", "singular") */
  identifier: string;
}

/**
 * Badge component that displays abbreviated identifiers with tooltips.
 *
 * @param props - Component props
 * @returns React element
 */
export function Identifier(props: IdentifierProps): ReactElement {
  const { className, identifier } = props;

  const identifierLowercase = identifier.toLowerCase();
  const abbreviation =
    abbreviations[identifierLowercase] ?? identifier.toUpperCase().slice(0, 4);
  const styles = identifierStyles[identifierLowercase] ?? {
    bg: "bg-gray-600",
    text: "text-white",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          className={cn(
            "cursor-default px-1 justify-center",
            styles.bg,
            styles.text,
            styles.border,
            className,
          )}
          variant="outline"
        >
          {abbreviation}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="right">{startCase(identifier)}</TooltipContent>
    </Tooltip>
  );
}

export { abbreviations, identifierStyles };
