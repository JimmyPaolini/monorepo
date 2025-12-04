import type { AdjectiveForms, Forms, NounForms, VerbForms } from "./types";
import type {
  AdjectiveForm,
  NounForm,
  VerbForm,
} from "@monorepo/lexico-components";

// Case order for declensions
const CASE_ORDER = [
  "nominative",
  "genitive",
  "dative",
  "accusative",
  "ablative",
  "vocative",
  "locative",
] as const;

// Person order for conjugations
const PERSON_ORDER = ["first", "second", "third"] as const;

// Number order
const NUMBER_ORDER = ["singular", "plural"] as const;

// Gender order
const GENDER_ORDER = ["masculine", "feminine", "neuter"] as const;

// Tense order for indicative
const INDICATIVE_TENSE_ORDER = [
  "present",
  "imperfect",
  "future",
  "perfect",
  "pluperfect",
  "futurePerfect",
] as const;

// Tense order for subjunctive
const SUBJUNCTIVE_TENSE_ORDER = [
  "present",
  "imperfect",
  "perfect",
  "pluperfect",
] as const;

// Voice order
const VOICE_ORDER = ["active", "passive"] as const;

/**
 * Convert nested noun forms from database to flat array for NounFormsTable
 */
export function transformNounForms(forms: NounForms): NounForm[] {
  const result: NounForm[] = [];

  for (const caseName of CASE_ORDER) {
    const caseData = forms[caseName];
    if (!caseData) continue;

    for (const number of NUMBER_ORDER) {
      const formArray = caseData[number];
      if (!formArray || formArray.length === 0) continue;

      result.push({
        case: caseName,
        number,
        form: formArray.join(", "),
      });
    }
  }

  return result;
}

/**
 * Convert nested adjective forms from database to flat array for AdjectiveFormsTable
 */
export function transformAdjectiveForms(
  forms: AdjectiveForms,
): AdjectiveForm[] {
  const result: AdjectiveForm[] = [];

  for (const gender of GENDER_ORDER) {
    const genderData = forms[gender];
    if (!genderData) continue;

    for (const caseName of CASE_ORDER) {
      const caseData = genderData[caseName];
      if (!caseData) continue;

      for (const number of NUMBER_ORDER) {
        const formArray = caseData[number];
        if (!formArray || formArray.length === 0) continue;

        result.push({
          case: caseName,
          number,
          gender,
          form: formArray.join(", "),
        });
      }
    }
  }

  return result;
}

/**
 * Helper to get person display string
 */
function personDisplay(person: string): string {
  switch (person) {
    case "first":
      return "1st";
    case "second":
      return "2nd";
    case "third":
      return "3rd";
    default:
      return person;
  }
}

/**
 * Convert nested verb forms from database to flat array for VerbFormsTable
 */
export function transformVerbForms(forms: VerbForms): VerbForm[] {
  const result: VerbForm[] = [];

  // Process indicative mood
  if (forms.indicative) {
    for (const voice of VOICE_ORDER) {
      const voiceData = forms.indicative[voice];
      if (!voiceData) continue;

      for (const tense of INDICATIVE_TENSE_ORDER) {
        const tenseData = voiceData[tense];
        if (!tenseData) continue;

        for (const number of NUMBER_ORDER) {
          const numberData = tenseData[number];
          if (!numberData) continue;

          for (const person of PERSON_ORDER) {
            const formArray = numberData[person];
            if (!formArray || formArray.length === 0) continue;

            result.push({
              mood: "indicative",
              tense,
              voice,
              person: personDisplay(person),
              number,
              form: formArray.join(", "),
            });
          }
        }
      }
    }
  }

  // Process subjunctive mood
  if (forms.subjunctive) {
    for (const voice of VOICE_ORDER) {
      const voiceData = forms.subjunctive[voice];
      if (!voiceData) continue;

      for (const tense of SUBJUNCTIVE_TENSE_ORDER) {
        const tenseData = voiceData[tense];
        if (!tenseData) continue;

        for (const number of NUMBER_ORDER) {
          const numberData = tenseData[number];
          if (!numberData) continue;

          for (const person of PERSON_ORDER) {
            const formArray = numberData[person];
            if (!formArray || formArray.length === 0) continue;

            result.push({
              mood: "subjunctive",
              tense,
              voice,
              person: personDisplay(person),
              number,
              form: formArray.join(", "),
            });
          }
        }
      }
    }
  }

  // Process imperative mood
  if (forms.imperative) {
    for (const voice of VOICE_ORDER) {
      const voiceData = forms.imperative[voice];
      if (!voiceData) continue;

      for (const tense of ["present", "future"] as const) {
        const tenseData = voiceData[tense];
        if (!tenseData) continue;

        for (const number of NUMBER_ORDER) {
          const numberData = tenseData[number];
          if (!numberData) continue;

          for (const person of ["second", "third"] as const) {
            const formArray = numberData[person];
            if (!formArray || formArray.length === 0) continue;

            result.push({
              mood: "imperative",
              tense,
              voice,
              person: personDisplay(person),
              number,
              form: formArray.join(", "),
            });
          }
        }
      }
    }
  }

  // Process non-finite forms (infinitives, participles)
  if (forms.nonFinite) {
    // Infinitives
    if (forms.nonFinite.infinitive) {
      for (const voice of VOICE_ORDER) {
        const voiceData = forms.nonFinite.infinitive[voice];
        if (!voiceData) continue;

        for (const tense of ["present", "perfect", "future"] as const) {
          const formArray = voiceData[tense];
          if (!formArray || formArray.length === 0) continue;

          result.push({
            mood: "infinitive",
            tense,
            voice,
            form: formArray.join(", "),
          });
        }
      }
    }

    // Participles
    if (forms.nonFinite.participle) {
      // Active participles
      if (forms.nonFinite.participle.active) {
        for (const tense of ["present", "future"] as const) {
          const formArray = forms.nonFinite.participle.active[tense];
          if (!formArray || formArray.length === 0) continue;

          result.push({
            mood: "participle",
            tense,
            voice: "active",
            form: formArray.join(", "),
          });
        }
      }

      // Passive participles
      if (forms.nonFinite.participle.passive) {
        for (const tense of ["perfect", "future"] as const) {
          const formArray = forms.nonFinite.participle.passive[tense];
          if (!formArray || formArray.length === 0) continue;

          result.push({
            mood: "participle",
            tense,
            voice: "passive",
            form: formArray.join(", "),
          });
        }
      }
    }
  }

  // Process verbal nouns (gerund, supine)
  if (forms.verbalNoun) {
    // Gerund
    if (forms.verbalNoun.gerund) {
      for (const caseName of [
        "genitive",
        "dative",
        "accusative",
        "ablative",
      ] as const) {
        const formArray = forms.verbalNoun.gerund[caseName];
        if (!formArray || formArray.length === 0) continue;

        result.push({
          mood: "gerund",
          tense: caseName,
          voice: "active",
          form: formArray.join(", "),
        });
      }
    }

    // Supine
    if (forms.verbalNoun.supine) {
      for (const caseName of ["accusative", "ablative"] as const) {
        const formArray = forms.verbalNoun.supine[caseName];
        if (!formArray || formArray.length === 0) continue;

        result.push({
          mood: "supine",
          tense: caseName,
          voice: "active",
          form: formArray.join(", "),
        });
      }
    }
  }

  return result;
}

/**
 * Determine if forms are verb forms
 */
function isVerbForms(forms: Forms): forms is VerbForms {
  return (
    "indicative" in forms ||
    "subjunctive" in forms ||
    "imperative" in forms ||
    "nonFinite" in forms
  );
}

/**
 * Determine if forms are adjective forms (has gender keys)
 */
function isAdjectiveForms(forms: Forms): forms is AdjectiveForms {
  return "masculine" in forms || "feminine" in forms || "neuter" in forms;
}

/**
 * Determine if forms are noun forms (has case keys directly with number groups)
 */
function isNounForms(forms: Forms): forms is NounForms {
  if ("masculine" in forms || "feminine" in forms || "neuter" in forms)
    return false;
  if ("indicative" in forms || "subjunctive" in forms) return false;

  const nominative = (forms as NounForms).nominative;
  return (
    nominative !== undefined &&
    ("singular" in nominative || "plural" in nominative)
  );
}

type TransformResult =
  | { type: "verb"; forms: VerbForm[] }
  | { type: "noun"; forms: NounForm[] }
  | { type: "adjective"; forms: AdjectiveForm[] }
  | null;

/**
 * Transform forms based on part of speech
 */
export function transformForms(
  partOfSpeech: string,
  forms: Forms,
): TransformResult {
  if (Object.keys(forms).length === 0) {
    return null;
  }

  const pos = partOfSpeech.toLowerCase();

  if (pos === "verb" && isVerbForms(forms)) {
    return { type: "verb", forms: transformVerbForms(forms) };
  }

  if ((pos === "noun" || pos === "pronoun") && isNounForms(forms)) {
    return { type: "noun", forms: transformNounForms(forms) };
  }

  if (
    (pos === "adjective" || pos === "participle" || pos === "numeral") &&
    isAdjectiveForms(forms)
  ) {
    return { type: "adjective", forms: transformAdjectiveForms(forms) };
  }

  // Try to auto-detect
  if (isVerbForms(forms)) {
    return { type: "verb", forms: transformVerbForms(forms) };
  }

  if (isAdjectiveForms(forms)) {
    return { type: "adjective", forms: transformAdjectiveForms(forms) };
  }

  if (isNounForms(forms)) {
    return { type: "noun", forms: transformNounForms(forms) };
  }

  return null;
}
