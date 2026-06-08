import * as React from "react";

import { FormTabs } from "./form-tabs";
import { FormsTable } from "./forms-table";

import type { FormCellProps } from "./form-cell";

/**
 * Represents a single declined form of an adjective.
 */
export interface AdjectiveForm {
  /** Grammatical case (nominative, genitive, etc.) */
  case: string;
  /** Degree of comparison (positive, comparative, superlative) */
  degree?: string | undefined;
  /** The declined form text */
  form: string;
  /** Grammatical gender (masculine, feminine, neuter) */
  gender: string;
  /** Grammatical number (singular or plural) */
  number: string;
}

/**
 * Props for the AdjectiveFormsTable component.
 */
export interface AdjectiveFormsTableProps {
  /** Additional class names */
  className?: string | undefined;
  /** Adjective forms data */
  forms: AdjectiveForm[];
  /** Current search term for highlighting */
  search?: string | undefined;
}

// Case order for adjective declension
const CASE_ORDER = [
  "nominative",
  "genitive",
  "dative",
  "accusative",
  "ablative",
  "vocative",
  "locative",
];
const GENDER_ORDER = ["masculine", "feminine", "neuter"];
const DEGREE_ORDER = ["positive", "comparative", "superlative"];

const CASE_ABBREVIATIONS: Record<string, string> = {
  ablative: "Abl.",
  accusative: "Acc.",
  dative: "Dat.",
  genitive: "Gen.",
  locative: "Loc.",
  nominative: "Nom.",
  vocative: "Voc.",
};

interface AdjectiveFormGroup {
  degree: string;
  genders: {
    cells: FormCellProps[];
    gender: string;
  }[];
}

/**
 * Group adjective forms by degree -\> gender for tabs
 */
function groupAdjectiveForms(forms: AdjectiveForm[]): AdjectiveFormGroup[] {
  // Check if forms have degrees
  const hasDegrees = forms.some((f) => f.degree);

  if (!hasDegrees) {
    // Just group by gender
    const genders = groupByGender(forms);
    return [{ degree: "positive", genders }];
  }

  // Group by degree -> gender
  const grouped: Record<string, AdjectiveForm[]> = {};

  for (const form of forms) {
    const degree = form.degree?.toLowerCase() || "positive";
    if (!grouped[degree]) grouped[degree] = [];
    grouped[degree].push(form);
  }

  const result: AdjectiveFormGroup[] = [];

  for (const degree of DEGREE_ORDER) {
    if (!grouped[degree]) continue;

    const genders = groupByGender(grouped[degree]);
    if (genders.length > 0) {
      result.push({ degree, genders });
    }
  }

  return result;
}

/**
 * Group forms by gender and restructure into cells
 */
function groupByGender(forms: AdjectiveForm[]): AdjectiveFormGroup["genders"] {
  const grouped: Record<string, AdjectiveForm[]> = {};

  for (const form of forms) {
    const gender = form.gender.toLowerCase();
    if (!grouped[gender]) grouped[gender] = [];
    grouped[gender].push(form);
  }

  const result: AdjectiveFormGroup["genders"] = [];

  for (const gender of GENDER_ORDER) {
    if (!grouped[gender]) continue;

    const cells = restructureAdjectiveForms(grouped[gender]);
    if (cells.length > 0) {
      result.push({ cells, gender });
    }
  }

  return result;
}

/**
 * Restructure adjective forms for a specific gender into cells
 */
function restructureAdjectiveForms(forms: AdjectiveForm[]): FormCellProps[] {
  // Group by case
  const byCase: Record<string, { plural?: string; singular?: string }> = {};

  for (const form of forms) {
    const caseName = form.case.toLowerCase();
    if (!byCase[caseName]) {
      byCase[caseName] = {};
    }
    const number = form.number.toLowerCase();
    if (number === "singular") {
      byCase[caseName].singular = form.form;
    } else if (number === "plural") {
      byCase[caseName].plural = form.form;
    }
  }

  // Filter to only cases that have data
  const activeCases = CASE_ORDER.filter((caseName) => byCase[caseName]);

  const cells: FormCellProps[] = [];

  for (const caseName of activeCases) {
    const caseData = byCase[caseName] || {};

    // Singular cell (left column)
    cells.push(
      {
        centerText: caseData.singular || "-",
        topLeftText: CASE_ABBREVIATIONS[caseName] || caseName,
        topRightText: "SG",
      },
      {
        centerText: caseData.plural || "-",
        topRightText: "PL",
      },
    );
  }

  return cells;
}

const AdjectiveFormsTable = React.forwardRef<
  HTMLDivElement,
  AdjectiveFormsTableProps
>(({ className, forms, search }, ref) => {
  const grouped = React.useMemo(() => groupAdjectiveForms(forms), [forms]);

  const [activeDegree, setActiveDegree] = React.useState(0);
  const [activeGender, setActiveGender] = React.useState(0);

  // Reset gender tab when degree changes
  React.useEffect(() => {
    setActiveGender(0);
  }, [activeDegree]);

  if (grouped.length === 0) {
    return null;
  }

  const currentDegree = grouped[activeDegree];
  const currentGender = currentDegree?.genders[activeGender];

  const degreeTabs = grouped.map((g) => g.degree);
  const genderTabs = currentDegree?.genders.map((g) => g.gender) || [];

  // If only one degree, skip degree tabs
  const hasDegrees = grouped.length > 1;

  const genderContent =
    genderTabs.length > 1 ? (
      <FormTabs
        activeTab={activeGender}
        onTabChange={setActiveGender}
        tabs={genderTabs}
      >
        {currentGender && (
          <FormsTable
            forms={currentGender.cells}
            search={search}
          />
        )}
      </FormTabs>
    ) : (
      currentGender && (
        <FormsTable
          forms={currentGender.cells}
          search={search}
        />
      )
    );

  return (
    <div
      ref={ref}
      className={className}
    >
      {hasDegrees ? (
        <FormTabs
          activeTab={activeDegree}
          onTabChange={setActiveDegree}
          tabs={degreeTabs}
        >
          {genderContent}
        </FormTabs>
      ) : (
        genderContent
      )}
    </div>
  );
});
AdjectiveFormsTable.displayName = "AdjectiveFormsTable";

export { AdjectiveFormsTable, groupAdjectiveForms, restructureAdjectiveForms };
