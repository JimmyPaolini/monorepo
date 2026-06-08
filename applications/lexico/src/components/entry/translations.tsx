import { cn } from "@monorepo/lexico-components";

import type { ReactElement } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * Props for the Translations component that displays entry translations.
 */
export interface TranslationsProps {
  /** Array of translation strings */
  translations: string[];
  /** Whether translations are expanded by default */
  defaultOpen?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 *
 */
export function Translations(props: TranslationsProps): ReactElement {
  const { translations, defaultOpen = false, className } = props;

  // 🪝 Hooks

  // 🏗 Setup

  const isExpandable = translations.length > 2;

  // 💪 Handlers

  // 🎨 Markdown
  const renderTranslation = (translation: string): ReactElement => (
    <li key={translation}>{translation}</li>
  );

  const unorderedListClassName = cn("list-disc list-inside", className);

  // 🔌 Short circuits

  if (translations.length === 0) {
    return (
      <div className={cn("text-muted-foreground italic", className)}>
        No translations available
      </div>
    );
  }

  if (!isExpandable) {
    return (
      <ul className={unorderedListClassName}>
        {translations.map((t) => renderTranslation(t))}
      </ul>
    );
  }

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger asChild>
        <ul className={unorderedListClassName}>
          {translations.slice(0, 2).map((t) => renderTranslation(t))}
        </ul>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className={unorderedListClassName}>
          {translations.slice(2).map((t) => renderTranslation(t))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
