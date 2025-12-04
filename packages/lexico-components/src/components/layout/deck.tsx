import * as React from "react";

import { cn } from "../../lib/utils";

export interface DeckProps {
  /** Children to render in the grid */
  children: React.ReactNode;
  /** Additional class names */
  className?: string | undefined;
}

/**
 * Deck - Responsive card grid layout
 * 4 columns on xl, 3 on lg, 2 on md, 1 on mobile
 */
const Deck = React.forwardRef<HTMLDivElement, DeckProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid w-full max-w-7xl gap-4 px-4",
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);
Deck.displayName = "Deck";

export { Deck };
