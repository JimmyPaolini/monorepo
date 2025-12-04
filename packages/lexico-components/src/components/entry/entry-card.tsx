import * as React from "react";

import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";

import { PrincipalParts } from "./principal-parts";
import { Translations } from "./translations";

import type {
  Inflection,
  PartOfSpeech,
  PrincipalPart,
} from "./principal-parts";

export interface EntryCardProps {
  /** Entry ID */
  id: string;
  /** Part of speech */
  partOfSpeech: PartOfSpeech;
  /** Principal parts array or object */
  principalParts: PrincipalPart[] | Record<string, string | undefined>;
  /** Inflection data */
  inflection?: Inflection | null;
  /** Translation strings */
  translations: string[];
  /** Whether entry is bookmarked */
  bookmarked?: boolean;
  /** Callback when bookmark is toggled */
  onBookmarkToggle?: (id: string) => void;
  /** Whether translations are expanded by default */
  translationsExpanded?: boolean;
  /** Whether this result is from a Latin search (adds accent border) */
  isLatinSearchResult?: boolean;
  /** Click handler for the card */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
}

const EntryCard = React.forwardRef<HTMLDivElement, EntryCardProps>(
  (
    {
      id,
      partOfSpeech,
      principalParts,
      inflection,
      translations,
      bookmarked,
      onBookmarkToggle,
      translationsExpanded = false,
      isLatinSearchResult = true,
      onClick,
      className,
    },
    ref,
  ) => {
    const CardWrapper = onClick ? "button" : "div";
    const cardProps = onClick
      ? {
          type: "button" as const,
          onClick,
          className: "w-full text-left hover:bg-muted/50 transition-colors",
        }
      : {};

    return (
      <Card
        ref={ref}
        className={cn(
          "overflow-hidden",
          !isLatinSearchResult && "border-t-4 border-t-secondary",
          className,
        )}
      >
        <CardWrapper {...cardProps}>
          <PrincipalParts
            id={id}
            partOfSpeech={partOfSpeech}
            principalParts={principalParts}
            inflection={inflection}
            bookmarked={bookmarked}
            onBookmarkToggle={onBookmarkToggle}
          />
          <Separator className="mx-4" />
          <div className="p-4 pt-3">
            <Translations
              translations={translations}
              defaultExpanded={translationsExpanded}
            />
          </div>
        </CardWrapper>
      </Card>
    );
  },
);
EntryCard.displayName = "EntryCard";

export { EntryCard };
