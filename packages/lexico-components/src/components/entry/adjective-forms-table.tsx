import * as React from "react";

import { FormTabs } from "./form-tabs";
import { FormsTable } from "./forms-table";

import type { FormCellProps } from "./form-cell";

export interface AdjectiveForm {
  case: string;
  number: string;
  gender: string;
  degree?: string | undefined;
  form: string;
}

export interface AdjectiveFormsTableProps {
  /** Adjective forms data */
  forms: AdjectiveForm[];
  /** Current search term for highlighting */
  search?: string | undefined;
  /** Additional class names */
  className?: string | undefined;
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
  nominative: "Nom.",
  genitive: "Gen.",
  dative: "Dat.",
  accusative: "Acc.",
  ablative: "Abl.",
  vocative: "Voc.",
  locative: "Loc.",
};

interface AdjectiveFormGroup {
  degree: string;
  genders: {
    gender: string;
    cells: FormCellProps[];
  }[];
}

/**
 * Group adjective forms by degree -> gender for tabs
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
      result.push({ gender, cells });
    }
  }

  return result;
}

/**
 * Restructure adjective forms for a specific gender into cells
 */
function restructureAdjectiveForms(forms: AdjectiveForm[]): FormCellProps[] {
  // Group by case
  const byCase: Record<string, { singular?: string; plural?: string }> = {};

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
    cells.push({
      topLeftText: CASE_ABBREVIATIONS[caseName] || caseName,
      topRightText: "S.",
      centerText: caseData.singular || "-",
    });

    // Plural cell (right column)
    cells.push({
      topRightText: "P.",
      centerText: caseData.plural || "-",
    });
  }

  return cells;
}

const AdjectiveFormsTable = React.forwardRef<
  HTMLDivElement,
  AdjectiveFormsTableProps
>(({ forms, search, className }, ref) => {
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
        tabs={genderTabs}
        activeTab={activeGender}
        onTabChange={setActiveGender}
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
          tabs={degreeTabs}
          activeTab={activeDegree}
          onTabChange={setActiveDegree}
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
