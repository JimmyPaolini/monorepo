import * as React from "react";

import { cn } from "@monorepo/lexico-components";

/**
 * Props for the Logo component that displays the Lexico logo.
 */
export interface LogoProps {
  /** Additional class names */
  className?: string | undefined;
  /** Width of the logo in pixels */
  width?: number | undefined;
}

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, width = 320 }, reference) => {
    // Logo has 4:3 aspect ratio
    const height = width * (4 / 3);

    return (
      <div
        ref={reference}
        className={cn("flex items-center justify-center", className)}
        style={{ height: `${height}px`, width: `${width}px` }}
      >
        <img
          alt="Lexico"
          className="object-contain"
          height={height}
          loading="eager"
          src="/lexico_logo.svg"
          width={width}
        />
      </div>
    );
  },
);
Logo.displayName = "Logo";

export { Logo };
