import * as React from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../generated/ui/tabs";
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
    // Convert index to tab value string
    const activeValue = tabs[activeTab] ?? tabs[0] ?? "";

    return (
      <Tabs
        ref={ref}
        value={activeValue}
        onValueChange={(value: string) => {
          const index = tabs.indexOf(value);
          if (index !== -1) {
            onTabChange(index);
          }
        }}
        className={cn("w-full", className)}
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
              value={tab}
              className="h-full p-0 transition-colors data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:ring-offset-1 data-[state=active]:ring-offset-background"
            >
              <Identifier
                identifier={tab}
                size="md"
                className="flex h-full w-full items-center justify-center rounded-[inherit]"
              />
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent
            key={tab}
            value={tab}
            className="mt-0"
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
