import { cn } from "@monorepo/lexico-components";
import * as React from "react";

import { FormCell } from "./form-cell";

import type { FormCellPosition, FormCellProps } from "./form-cell";

export interface FormsTableProps {
  /** Array of form cell data */
  forms: Omit<FormCellProps, "position" | "search">[];
  /** Search term for highlighting */
  search?: string | undefined;
  /** Additional class names */
  className?: string | undefined;
}

const FormsTable = React.forwardRef<HTMLDivElement, FormsTableProps>(
  ({ forms, search, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("grid grid-cols-2 bg-card", className)}
      >
        {forms.map((form, index) => {
          // Calculate position for border styling
          const isTop = index < 2;
          const isBottom = index >= forms.length - 2;
          const isLeft = index % 2 === 0;

          let horizontal: "top" | "mid" | "bottom";
          if (isTop) horizontal = "top";
          else if (isBottom) horizontal = "bottom";
          else horizontal = "mid";

          const vertical = isLeft ? "Left" : "Right";
          const position = `${horizontal}${vertical}` as FormCellPosition;

          return (
            <FormCell
              key={`${form.topLeftText ?? "cell"}-${form.topRightText ?? "pos"}-${form.centerText}`}
              position={position}
              search={search}
              {...form}
            />
          );
        })}
      </div>
    );
  },
);
FormsTable.displayName = "FormsTable";

export { FormsTable };
