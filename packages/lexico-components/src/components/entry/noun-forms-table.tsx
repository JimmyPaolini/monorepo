import * as React from "react";

import { FormsTable } from "./forms-table";

import type { FormCellProps } from "./form-cell";

export interface NounForm {
  case: string;
  number: string;
  form: string;
}

export interface NounFormsTableProps {
  /** Noun forms data */
  forms: NounForm[];
  /** Current search term for highlighting */
  search?: string | undefined;
  /** Additional class names */
  className?: string | undefined;
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
  nominative: "Nom.",
  genitive: "Gen.",
  dative: "Dat.",
  accusative: "Acc.",
  ablative: "Abl.",
  vocative: "Voc.",
  locative: "Loc.",
};

/**
 * Restructure noun forms into a 2-column grid (singular, plural)
 * Each row is a case, columns are singular and plural
 */
function restructureNounForms(forms: NounForm[]): FormCellProps[] {
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

  // Filter to only cases that have data (for vocative/locative)
  const activeCases = CASE_ORDER.filter((caseName) => byCase[caseName]);

  const cells: FormCellProps[] = [];

  for (const caseName of activeCases) {
    const caseData = byCase[caseName] || {};

    // Singular cell (left column)
    cells.push({
      topLeftText: CASE_ABBREVIATIONS[caseName] || caseName,
      topRightText: "SG",
      centerText: caseData.singular || "-",
    });

    // Plural cell (right column)
    cells.push({
      topRightText: "PL",
      centerText: caseData.plural || "-",
    });
  }

  return cells;
}

const NounFormsTable = React.forwardRef<HTMLDivElement, NounFormsTableProps>(
  ({ forms, search, className }, ref) => {
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
