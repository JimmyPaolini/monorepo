// ♟️ Constants

import {
  adjectiveDeclensionValues,
  adjectiveDegreeValues,
  nounDeclensionValues,
  nounGenderValues,
  type PartOfSpeech,
  prepositionCaseValues,
  verbConjugationValues,
} from "@monorepo/lexico-entities";
import _ from "lodash";

// ♟️ POS regex constants
export const nounDeclensionRegex = new RegExp(
  _.compact(nounDeclensionValues).join("|"),
);
export const genderRegex = new RegExp(_.compact(nounGenderValues).join("|"));
export const adjectiveDeclensionRegex = new RegExp(
  _.compact(adjectiveDeclensionValues).join("|"),
);
export const adjectiveDegreeRegex = new RegExp(
  _.compact(adjectiveDegreeValues).join("|"),
);
export const verbConjugationRegex = new RegExp(
  _.compact(verbConjugationValues).join("|"),
);
export const prepositionCaseRegex = new RegExp(
  _.compact(prepositionCaseValues).join("|"),
);

// ♟️ First principal part name per POS
export const firstPrincipalPartNames: Partial<Record<PartOfSpeech, string>> = {
  noun: "nominative",
  properNoun: "nominative",
  verb: "present active",
  adjective: "masculine",
  participle: "masculine",
  numeral: "masculine",
  suffix: "masculine",
  prefix: "masculine",
  interfix: "masculine",
  circumfix: "masculine",
  pronoun: "masculine",
  determiner: "masculine",
  adverb: "positive",
  preposition: "preposition",
  conjunction: "conjunction",
  interjection: "conjunction",
  abbreviation: "conjunction",
  inflection: "conjunction",
  particle: "conjunction",
  phrase: "conjunction",
  proverb: "conjunction",
  idiom: "conjunction",
};

// ♟️ esse/fui lookup table for periphrastic verb forms
export const sumEsseFui: Record<
  string,
  Record<string, Record<string, Record<string, Record<string, string[]>>>>
> = {
  indicative: {
    active: {
      present: {
        singular: { first: ["sum"], second: ["es"], third: ["est"] },
        plural: { first: ["sumus"], second: ["estis"], third: ["sunt"] },
      },
      imperfect: {
        singular: { first: ["eram"], second: ["erās"], third: ["erat"] },
        plural: { first: ["erāmus"], second: ["erātis"], third: ["erant"] },
      },
      future: {
        singular: { first: ["erō"], second: ["eris"], third: ["erit"] },
        plural: { first: ["erimus"], second: ["eritis"], third: ["erunt"] },
      },
      perfect: {
        singular: { first: ["fuī"], second: ["fuistī"], third: ["fuit"] },
        plural: {
          first: ["fuimus"],
          second: ["fuistis"],
          third: ["fuērunt", "fuēre"],
        },
      },
      pluperfect: {
        singular: { first: ["fueram"], second: ["fuerās"], third: ["fuerat"] },
        plural: {
          first: ["fuerāmus"],
          second: ["fuerātis"],
          third: ["fuerant"],
        },
      },
      futurePerfect: {
        singular: { first: ["fuerō"], second: ["fueris"], third: ["fuerit"] },
        plural: {
          first: ["fuerimus"],
          second: ["fueritis"],
          third: ["fuerint"],
        },
      },
    },
  },
  subjunctive: {
    active: {
      present: {
        singular: { first: ["sim"], second: ["sīs"], third: ["sit"] },
        plural: { first: ["sīmus"], second: ["sītis"], third: ["sint"] },
      },
      imperfect: {
        singular: {
          first: ["essem", "forem"],
          second: ["essēs", "forēs"],
          third: ["esset", "foret"],
        },
        plural: {
          first: ["essēmus", "forēmus"],
          second: ["essētis", "forētis"],
          third: ["essent", "forent"],
        },
      },
      perfect: {
        singular: { first: ["fuerim"], second: ["fuerīs"], third: ["fuerit"] },
        plural: {
          first: ["fuerīmus"],
          second: ["fuerītis"],
          third: ["fuerint"],
        },
      },
      pluperfect: {
        singular: {
          first: ["fuissem"],
          second: ["fuissēs"],
          third: ["fuisset"],
        },
        plural: {
          first: ["fuissēmus"],
          second: ["fuissētis"],
          third: ["fuissent"],
        },
      },
    },
  },
};
