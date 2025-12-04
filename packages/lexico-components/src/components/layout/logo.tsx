import * as React from "react";

import { cn } from "../../lib/utils";

export interface LogoProps {
  /** Width of the logo in pixels */
  width?: number | undefined;
  /** Additional class names */
  className?: string | undefined;
}

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ width = 320, className }, ref) => {
    // Logo has 4:3 aspect ratio
    const height = width * (4 / 3);

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <img
          src="/lexico_logo.svg"
          alt="Lexico"
          width={width}
          height={height}
          className="object-contain"
          loading="eager"
        />
      </div>
    );
  },
);
Logo.displayName = "Logo";

export { Logo };
