import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

export interface TranslationsProps {
  /** Array of translation strings */
  translations: string[];
  /** Whether translations are expanded by default */
  defaultExpanded?: boolean;
  /** Additional class names */
  className?: string;
}

const Translations = React.forwardRef<HTMLDivElement, TranslationsProps>(
  ({ translations, defaultExpanded = false, className }, ref) => {
    const [expanded, setExpanded] = React.useState(defaultExpanded);
    const expandable = translations.length > 2;
    const visibleCount = expanded || !expandable ? translations.length : 2;

    const handleToggle = (): void => {
      if (expandable) {
        setExpanded(!expanded);
      }
    };

    if (translations.length === 0) {
      return (
        <div
          ref={ref}
          className={cn("text-muted-foreground italic", className)}
        >
          No translations available
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={className}
      >
        <button
          type="button"
          onClick={handleToggle}
          disabled={!expandable}
          className={cn(
            "flex w-full items-start gap-2 text-left",
            expandable &&
              "cursor-pointer hover:bg-muted/50 rounded-md -mx-2 px-2 py-1",
          )}
        >
          <div className="flex-1 space-y-1">
            {translations.slice(0, visibleCount).map((translation) => (
              <div
                key={translation}
                className="flex items-start gap-2"
              >
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                <span className="text-foreground">{translation}</span>
              </div>
            ))}
            {!expanded && expandable && (
              <div className="text-sm text-muted-foreground">
                ...and {translations.length - 2} more
              </div>
            )}
          </div>
          {expandable && (
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          )}
        </button>
      </div>
    );
  },
);
Translations.displayName = "Translations";

export { Translations };
