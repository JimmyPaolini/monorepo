import * as React from "react";

import {
  cn,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@monorepo/lexico-components";

import { Identifier } from "./identifier";

/**
 * Props for the FormTabs component that displays tabbed form navigation.
 */
export interface FormTabsProps {
  /** Currently active tab index */
  activeTab: number;
  /** Content to render for active tab */
  children: React.ReactNode;
  /** Additional class names */
  className?: string | undefined;
  /** Callback when tab changes */
  onTabChange: (index: number) => void;
  /** Tab labels */
  tabs: string[];
}

const FormTabs = React.forwardRef<HTMLDivElement, FormTabsProps>(
  ({ activeTab, children, className, onTabChange, tabs }, ref) => {
    // Convert index to tab value string
    const activeValue = tabs[activeTab] ?? tabs[0] ?? "";

    return (
      <Tabs
        ref={ref}
        className={cn("w-full", className)}
        onValueChange={(value: string) => {
          const index = tabs.indexOf(value);
          if (index !== -1) {
            onTabChange(index);
          }
        }}
        value={activeValue}
      >
        <TabsList
          className="grid w-full gap-1 bg-muted/30 group-hover:bg-transparent p-1"
          style={{
            gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
          }}
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab}
              className="h-full p-0 transition-colors data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:ring-offset-1 data-[state=active]:ring-offset-background"
              value={tab}
            >
              <Identifier
                className="flex text-md h-full w-full items-center justify-center rounded-[inherit]"
                identifier={tab}
              />
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent
            key={tab}
            className="mt-0"
            value={tab}
          >
            {tab === activeValue ? children : null}
          </TabsContent>
        ))}
      </Tabs>
    );
  },
);
FormTabs.displayName = "FormTabs";

export { FormTabs };
