import * as React from "react";

import { FormTabs } from "./form-tabs";
import { FormsTable } from "./forms-table";

import type { FormCellProps as FormCellProperties } from "./form-cell";

/**
 * Represents a single conjugated form of a verb.
 */
export interface VerbForm {
  /** The conjugated form text */
  form: string;
  /** Grammatical mood (indicative, subjunctive, imperative) */
  mood: string;
  /** Grammatical number (singular or plural) */
  number?: string | undefined;
  /** Grammatical person (first, second, third) */
  person?: string | undefined;
  /** Tense (present, imperfect, future, etc.) */
  tense: string;
  /** Voice (active, passive) */
  voice: string;
}

/**
 * Props for the VerbFormsTable component.
 */
export interface VerbFormsTableProps {
  /** Additional class names */
  className?: string | undefined;
  /** Verb forms data */
  forms: VerbForm[];
  /** Current search term for highlighting */
  search?: string | undefined;
}

// Mood order
const MOOD_ORDER = [
  "indicative",
  "subjunctive",
  "imperative",
  "infinitive",
  "participle",
  "gerund",
  "supine",
];
const TENSE_ORDER = [
  "present",
  "imperfect",
  "future",
  "perfect",
  "pluperfect",
  "future perfect",
];
const VOICE_ORDER = ["active", "passive"];
const PERSON_ORDER = ["1st", "2nd", "3rd"];

const PERSON_ABBREVIATIONS: Record<string, string> = {
  "1st": "1st",
  "2nd": "2nd",
  "3rd": "3rd",
};

const NUMBER_ABBREVIATIONS: Record<string, string> = {
  plural: "PL",
  singular: "SG",
};

interface VerbFormGroup {
  mood: string;
  tenses: {
    tense: string;
    voices: {
      cells: FormCellProperties[];
      voice: string;
    }[];
  }[];
}

/**
 * Group verb forms by mood -\> tense -\> voice for nested tabs
 */
function groupVerbForms(forms: VerbForm[]): VerbFormGroup[] {
  // Create nested structure
  const grouped: Record<
    string,
    Record<string, Record<string, VerbForm[]>>
  > = {};

  for (const form of forms) {
    const mood = form.mood.toLowerCase();
    const tense = form.tense.toLowerCase();
    const voice = form.voice.toLowerCase();

    if (!grouped[mood]) grouped[mood] = {};
    if (!grouped[mood][tense]) grouped[mood][tense] = {};
    if (!grouped[mood][tense][voice]) grouped[mood][tense][voice] = [];

    grouped[mood][tense][voice].push(form);
  }

  // Convert to array structure with proper ordering
  const result: VerbFormGroup[] = [];

  for (const mood of MOOD_ORDER) {
    if (!grouped[mood]) continue;

    const tenses: VerbFormGroup["tenses"] = [];

    for (const tense of TENSE_ORDER) {
      if (!grouped[mood][tense]) continue;

      const voices: VerbFormGroup["tenses"][0]["voices"] = [];

      for (const voice of VOICE_ORDER) {
        if (!grouped[mood][tense][voice]) continue;

        const voiceForms = grouped[mood][tense][voice];
        const cells = restructureVerbForms(voiceForms);

        if (cells.length > 0) {
          voices.push({ cells, voice });
        }
      }

      if (voices.length > 0) {
        tenses.push({ tense, voices });
      }
    }

    if (tenses.length > 0) {
      result.push({ mood, tenses });
    }
  }

  return result;
}

/**
 * Restructure verb forms for a specific mood/tense/voice into cells
 */
function restructureVerbForms(forms: VerbForm[]): FormCellProperties[] {
  // Group by person and number
  const byPersonNumber: Record<string, string> = {};

  for (const form of forms) {
    const person = form.person?.toLowerCase() || "";
    const number = form.number?.toLowerCase() || "";
    const key = `${person}-${number}`;
    byPersonNumber[key] = form.form;
  }

  const cells: FormCellProperties[] = [];

  // If no person/number (infinitives, gerunds, etc.), just show the forms
  const hasPerson = forms.some((f) => f.person);
  if (!hasPerson) {
    for (const form of forms) {
      cells.push({
        centerText: form.form || "-",
      });
    }
    return cells;
  }

  // Build 2-column grid: singular | plural for each person
  for (const person of PERSON_ORDER) {
    const singularKey = `${person.toLowerCase()}-singular`;
    const pluralKey = `${person.toLowerCase()}-plural`;

    const singularForm = byPersonNumber[singularKey];
    const pluralForm = byPersonNumber[pluralKey];

    // Only add if at least one form exists
    if (singularForm || pluralForm) {
      // Singular cell (left column)
      cells.push(
        {
          centerText: singularForm || "-",
          topLeftText: PERSON_ABBREVIATIONS[person] || person,
          topRightText: NUMBER_ABBREVIATIONS["singular"],
        },
        {
          centerText: pluralForm || "-",
          topRightText: NUMBER_ABBREVIATIONS["plural"],
        },
      );
    }
  }

  return cells;
}

const VerbFormsTable = React.forwardRef<HTMLDivElement, VerbFormsTableProps>(
  ({ className, forms, search }, reference) => {
    const grouped = React.useMemo(() => groupVerbForms(forms), [forms]);

    const [activeMood, setActiveMood] = React.useState(0);
    const [activeTense, setActiveTense] = React.useState(0);
    const [activeVoice, setActiveVoice] = React.useState(0);

    // Reset child tabs when parent changes
    React.useEffect(() => {
      setActiveTense(0);
      setActiveVoice(0);
    }, [activeMood]);

    React.useEffect(() => {
      setActiveVoice(0);
    }, [activeTense]);

    if (grouped.length === 0) {
      return null;
    }

    const currentMood = grouped[activeMood];
    const currentTense = currentMood?.tenses[activeTense];
    const currentVoice = currentTense?.voices[activeVoice];

    const moodTabs = grouped.map((g) => g.mood);
    const tenseTabs = currentMood?.tenses.map((t) => t.tense) || [];
    const voiceTabs = currentTense?.voices.map((v) => v.voice) || [];

    return (
      <div
        ref={reference}
        className={className}
      >
        {/* Mood tabs */}
        <FormTabs
          activeTab={activeMood}
          onTabChange={setActiveMood}
          tabs={moodTabs}
        >
          {/* Tense tabs */}
          {tenseTabs.length > 1 ? (
            <FormTabs
              activeTab={activeTense}
              onTabChange={setActiveTense}
              tabs={tenseTabs}
            >
              {/* Voice tabs */}
              {voiceTabs.length > 1 ? (
                <FormTabs
                  activeTab={activeVoice}
                  onTabChange={setActiveVoice}
                  tabs={voiceTabs}
                >
                  {currentVoice && (
                    <FormsTable
                      forms={currentVoice.cells}
                      search={search}
                    />
                  )}
                </FormTabs>
              ) : (
                currentVoice && (
                  <FormsTable
                    forms={currentVoice.cells}
                    search={search}
                  />
                )
              )}
            </FormTabs>
          ) : voiceTabs.length > 1 ? (
            <FormTabs
              activeTab={activeVoice}
              onTabChange={setActiveVoice}
              tabs={voiceTabs}
            >
              {currentVoice && (
                <FormsTable
                  forms={currentVoice.cells}
                  search={search}
                />
              )}
            </FormTabs>
          ) : (
            currentVoice && (
              <FormsTable
                forms={currentVoice.cells}
                search={search}
              />
            )
          )}
        </FormTabs>
      </div>
    );
  },
);
VerbFormsTable.displayName = "VerbFormsTable";

export { groupVerbForms, restructureVerbForms, VerbFormsTable };
