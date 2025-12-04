import * as React from "react";

import { cn } from "../../generated/utils/utils";

import { AdjectiveFormsTable } from "./adjective-forms-table";
import { NounFormsTable } from "./noun-forms-table";
import { VerbFormsTable } from "./verb-forms-table";

import type { AdjectiveForm } from "./adjective-forms-table";
import type { NounForm } from "./noun-forms-table";
import type { VerbForm } from "./verb-forms-table";

export type FormsData = NounForm[] | VerbForm[] | AdjectiveForm[];

export interface FormsProps {
  /** Part of speech to determine which table to render */
  partOfSpeech: string;
  /** Forms data */
  forms: FormsData;
  /** Current search term for highlighting */
  search?: string | undefined;
  /** Additional class names */
  className?: string | undefined;
}

const Forms = React.forwardRef<HTMLDivElement, FormsProps>(
  ({ partOfSpeech, forms, search, className }, ref) => {
    const pos = partOfSpeech.toLowerCase();

    // Early return if no forms
    if (forms.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden rounded-lg border border-border",
          className,
        )}
      >
        {(pos === "noun" || pos === "pronoun") && (
          <NounFormsTable
            forms={forms as NounForm[]}
            search={search}
          />
        )}

        {pos === "verb" && (
          <VerbFormsTable
            forms={forms as VerbForm[]}
            search={search}
          />
        )}

        {(pos === "adjective" || pos === "participle" || pos === "numeral") && (
          <AdjectiveFormsTable
            forms={forms as AdjectiveForm[]}
            search={search}
          />
        )}
      </div>
    );
  },
);
Forms.displayName = "Forms";

export { Forms };
