import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
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
    const expandable = translations.length > 2;
    const previewTranslations = expandable
      ? translations.slice(0, 2)
      : translations;

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

    if (!expandable) {
      return (
        <div
          ref={ref}
          className={className}
        >
          <div className="space-y-1">
            {translations.map((translation) => (
              <div
                key={translation}
                className="flex items-start gap-2"
              >
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                <span className="text-foreground">{translation}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={className}
      >
        <Accordion
          type="single"
          collapsible
          {...(defaultExpanded ? { defaultValue: "translations" } : {})}
        >
          <AccordionItem
            value="translations"
            className="border-b-0"
          >
            <AccordionTrigger className="px-0 text-sm font-medium hover:no-underline">
              <div className="flex-1 space-y-1 text-left">
                {previewTranslations.map((translation) => (
                  <div
                    key={translation}
                    className="flex items-start gap-2"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                    <span className="text-foreground font-normal">
                      {translation}
                    </span>
                  </div>
                ))}
                <div className="text-sm text-muted-foreground font-normal">
                  ...and {translations.length - 2} more
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0">
              <div className="space-y-1">
                {translations.slice(2).map((translation) => (
                  <div
                    key={translation}
                    className="flex items-start gap-2"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                    <span className="text-foreground">{translation}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  },
);
Translations.displayName = "Translations";

export { Translations };
