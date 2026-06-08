import * as React from "react";

import { FormsTable } from "./forms-table";

import type { FormCellProps } from "./form-cell";

/**
 * Represents a single declined form of a noun.
 */
export interface NounForm {
  /** Grammatical case (nominative, genitive, etc.) */
  case: string;
  /** The declined form text */
  form: string;
  /** Grammatical number (singular or plural) */
  number: string;
}

/**
 * Props for the NounFormsTable component.
 */
export interface NounFormsTableProps {
  /** Additional class names */
  className?: string | undefined;
  /** Noun forms data */
  forms: NounForm[];
  /** Current search term for highlighting */
  search?: string | undefined;
}

// Case order for noun declension
const CASE_ORDER = [
  "nominative",
  "genitive",
  "dative",
  "accusative",
  "ablative",
  "vocative",
  "locative",
];
const CASE_ABBREVIATIONS: Record<string, string> = {
  ablative: "Abl.",
  accusative: "Acc.",
  dative: "Dat.",
  genitive: "Gen.",
  locative: "Loc.",
  nominative: "Nom.",
  vocative: "Voc.",
};

/**
 * Restructure noun forms into a 2-column grid (singular, plural)
 * Each row is a case, columns are singular and plural
 */
function restructureNounForms(forms: NounForm[]): FormCellProps[] {
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

  // Filter to only cases that have data (for vocative/locative)
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

const NounFormsTable = React.forwardRef<HTMLDivElement, NounFormsTableProps>(
  ({ className, forms, search }, ref) => {
    const cells = React.useMemo(() => restructureNounForms(forms), [forms]);

    return (
      <div
        ref={ref}
        className={className}
      >
        <FormsTable
          forms={cells}
          search={search}
        />
      </div>
    );
  },
);
NounFormsTable.displayName = "NounFormsTable";

export { NounFormsTable, restructureNounForms };
