import * as React from "react";

import { cn } from "../../generated/utils/utils";

import { Identifier } from "./identifier";

export interface FormTabsProps {
  /** Tab labels */
  tabs: string[];
  /** Currently active tab index */
  activeTab: number;
  /** Callback when tab changes */
  onTabChange: (index: number) => void;
  /** Content to render for active tab */
  children: React.ReactNode;
  /** Additional class names */
  className?: string | undefined;
}

const FormTabs = React.forwardRef<HTMLDivElement, FormTabsProps>(
  ({ tabs, activeTab, onTabChange, children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
      >
        {/* Tab buttons */}
        <div className="flex flex-wrap gap-1 border-b border-border bg-muted/30 p-1">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(index)}
              className={cn(
                "transition-colors",
                index === activeTab &&
                  "ring-2 ring-primary ring-offset-1 ring-offset-background",
              )}
            >
              <Identifier
                identifier={tab}
                size="md"
              />
            </button>
          ))}
        </div>
        {/* Tab content */}
        <div>{children}</div>
      </div>
    );
  },
);
FormTabs.displayName = "FormTabs";

export { FormTabs };
