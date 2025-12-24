import { cn } from "@monorepo/lexico-components";
import * as React from "react";

import { Identifier } from "./identifier";

export type FormCellPosition =
  | "topLeft"
  | "topRight"
  | "midLeft"
  | "midRight"
  | "bottomLeft"
  | "bottomRight";

export interface FormCellProps {
  /** Position in the grid for border styling */
  position?: FormCellPosition | undefined;
  /** The main form text (e.g., "amō") */
  centerText: string;
  /** Top-left label (e.g., "first", "nominative") */
  topLeftText?: string | undefined;
  /** Top-right label (e.g., "singular", "plural") */
  topRightText?: string | undefined;
  /** Bottom-left label (e.g., for extra context) */
  bottomLeftText?: string | undefined;
  /** Bottom-right label (e.g., for extra context) */
  bottomRightText?: string | undefined;
  /** Search term for highlighting */
  search?: string | undefined;
  /** Additional class names */
  className?: string | undefined;
}

const FormCell = React.forwardRef<HTMLDivElement, FormCellProps>(
  (
    {
      position,
      centerText,
      topLeftText,
      topRightText,
      bottomLeftText,
      bottomRightText,
      search,
      className,
    },
    ref,
  ) => {
    const isSearched =
      search && centerText.toLowerCase().includes(search.toLowerCase());
    const showTooltip = centerText.length > 30 || centerText.includes("\n");

    // Border classes based on position
    const borderClasses = cn(
      "border-border/30",
      position?.includes("top") && "border-t",
      position?.includes("bottom") && "border-b",
      position?.includes("Left") && "border-l",
      position?.includes("Right") && "border-r",
      // Always add inner borders
      "border-r border-b",
    );

    return (
      <div
        ref={ref}
        title={showTooltip ? centerText : undefined}
        className={cn(
          "relative flex h-12 items-stretch",
          borderClasses,
          isSearched ? "bg-muted" : "bg-card",
          className,
        )}
      >
        {/* Left sidebar */}
        <div className="flex w-8 shrink-0 flex-col items-center justify-between py-0.5">
          {topLeftText && (
            <Identifier
              identifier={topLeftText}
              className="text-sm"
            />
          )}
          {bottomLeftText && (
            <Identifier
              identifier={bottomLeftText}
              className="text-sm"
            />
          )}
        </div>

        {/* Center text */}
        <div className="flex flex-1 items-center justify-center overflow-hidden px-1">
          <span
            className={cn(
              "truncate text-center text-sm",
              centerText === "-" ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {centerText}
          </span>
        </div>

        {/* Right sidebar */}
        <div className="flex w-8 shrink-0 flex-col items-center justify-between py-0.5">
          {topRightText && (
            <Identifier
              identifier={topRightText}
              className="text-sm"
            />
          )}
          {bottomRightText && (
            <Identifier
              identifier={bottomRightText}
              className="text-sm"
            />
          )}
        </div>
      </div>
    );
  },
);
FormCell.displayName = "FormCell";

export { FormCell };
