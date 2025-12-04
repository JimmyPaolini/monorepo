import * as React from "react";

import { cn } from "../../generated/utils/utils";

// Abbreviation mappings
const abbreviations: Record<string, string> = {
  // Parts of speech
  noun: "NOUN",
  properNoun: "PN",
  verb: "VERB",
  adjective: "ADJ",
  adverb: "ADV",
  pronoun: "PRON",
  determiner: "PRON",
  preposition: "PREP",
  conjunction: "CJN",
  numeral: "NUM",
  interjection: "!!",
  suffix: "-X-",
  // Cases
  nominative: "NOM",
  genitive: "GEN",
  dative: "DAT",
  accusative: "ACC",
  ablative: "ABL",
  vocative: "VOC",
  locative: "LOC",
  // Gender
  masculine: "MASC",
  feminine: "FEM",
  neuter: "NEU",
  // Number
  singular: "S",
  plural: "P",
  // Mood
  indicative: "IND",
  subjunctive: "SUB",
  imperative: "IMPV",
  infinitive: "INF",
  "non finite": "NONF",
  // Tense
  present: "PRES",
  imperfect: "IMP",
  future: "FUT",
  perfect: "PERF",
  pluperfect: "PLUP",
  "future perfect": "FUTP",
  // Misc
  participle: "PART",
  "gerund/supine": "GER/SUP",
  gerund: "GER",
  supine: "SUP",
  // Voice
  active: "ACT",
  passive: "PAS",
  // Person
  first: "1",
  second: "2",
  third: "3",
};

// Color styles for each identifier type
const identifierStyles: Record<
  string,
  { bg: string; text: string; border?: string; rounded?: boolean }
> = {
  // Parts of speech (rounded)
  noun: { bg: "bg-blue-600", text: "text-white", rounded: true },
  properNoun: { bg: "bg-blue-600", text: "text-white", rounded: true },
  verb: { bg: "bg-red-600", text: "text-white", rounded: true },
  adjective: { bg: "bg-green-600", text: "text-white", rounded: true },
  adverb: { bg: "bg-orange-500", text: "text-black", rounded: true },
  pronoun: { bg: "bg-purple-600", text: "text-white", rounded: true },
  determiner: { bg: "bg-purple-600", text: "text-white", rounded: true },
  preposition: { bg: "bg-yellow-400", text: "text-black", rounded: true },
  conjunction: { bg: "bg-pink-400", text: "text-black", rounded: true },
  numeral: { bg: "bg-gray-500", text: "text-black", rounded: true },
  interjection: { bg: "bg-black", text: "text-white", rounded: true },
  suffix: { bg: "bg-black", text: "text-white", rounded: true },
  // Cases
  nominative: { bg: "bg-blue-500", text: "text-white" },
  genitive: { bg: "bg-green-700", text: "text-white" },
  dative: { bg: "bg-lime-400", text: "text-black" },
  accusative: { bg: "bg-red-500", text: "text-white" },
  ablative: { bg: "bg-pink-500", text: "text-white" },
  vocative: { bg: "bg-orange-600", text: "text-white" },
  locative: { bg: "bg-amber-800", text: "text-white" },
  // Gender
  masculine: { bg: "bg-orange-500", text: "text-white" },
  feminine: { bg: "bg-green-500", text: "text-white" },
  neuter: { bg: "bg-purple-500", text: "text-white" },
  // Number
  singular: { bg: "bg-white", text: "text-black" },
  plural: { bg: "bg-black", text: "text-white" },
  // Mood
  indicative: { bg: "bg-sky-600", text: "text-white" },
  subjunctive: { bg: "bg-fuchsia-500", text: "text-white" },
  imperative: { bg: "bg-rose-900", text: "text-white" },
  infinitive: { bg: "bg-lime-500", text: "text-black" },
  "non finite": { bg: "bg-olive-600", text: "text-black" },
  // Tense
  present: { bg: "bg-blue-600", text: "text-white" },
  imperfect: { bg: "bg-green-800", text: "text-white" },
  future: { bg: "bg-yellow-500", text: "text-black" },
  perfect: { bg: "bg-red-700", text: "text-white" },
  pluperfect: { bg: "bg-indigo-700", text: "text-white" },
  "future perfect": { bg: "bg-emerald-600", text: "text-black" },
  // Misc
  participle: { bg: "bg-sky-400", text: "text-black" },
  "gerund/supine": { bg: "bg-orange-400", text: "text-black" },
  gerund: { bg: "bg-amber-500", text: "text-black" },
  supine: { bg: "bg-pink-600", text: "text-white" },
  // Voice
  active: {
    bg: "bg-neutral-600",
    text: "text-white",
    border: "border border-white",
  },
  passive: {
    bg: "bg-neutral-400",
    text: "text-black",
    border: "border-2 border-black",
  },
  // Person
  first: { bg: "bg-blue-600", text: "text-white" },
  second: { bg: "bg-red-600", text: "text-white" },
  third: { bg: "bg-yellow-400", text: "text-black" },
};

export interface IdentifierProps {
  /** The identifier name (e.g., "noun", "nominative", "singular") */
  identifier: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class names */
  className?: string;
}

const Identifier = React.forwardRef<HTMLSpanElement, IdentifierProps>(
  ({ identifier, size = "md", className }, ref) => {
    const normalizedId = identifier.toLowerCase();
    const abbreviation =
      abbreviations[normalizedId] ?? identifier.toUpperCase().slice(0, 4);
    const styles = identifierStyles[normalizedId] ?? {
      bg: "bg-gray-600",
      text: "text-white",
    };

    return (
      <span
        ref={ref}
        title={identifier}
        className={cn(
          "inline-flex items-center justify-center font-semibold",
          size === "sm"
            ? "h-4 min-w-4 px-1 text-[0.625rem]"
            : "h-5 min-w-5 px-1.5 text-xs",
          styles.bg,
          styles.text,
          styles.border,
          styles.rounded ? "rounded-md" : "rounded-sm",
          className,
        )}
      >
        {abbreviation}
      </span>
    );
  },
);
Identifier.displayName = "Identifier";

export { Identifier, abbreviations, identifierStyles };
