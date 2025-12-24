import { Button, cn } from "@monorepo/lexico-components";
import { Menu } from "lucide-react";
import * as React from "react";

import { Navigation } from "./navigation";

import type { NavItem } from "./navigation";

export interface LayoutProps {
  /** Current pathname for navigation active state */
  currentPath?: string | undefined;
  /** Custom navigation items */
  navItems?: NavItem[] | undefined;
  /** Render prop for navigation links */
  renderNavLink: (
    item: NavItem,
    isActive: boolean,
    children: React.ReactNode,
  ) => React.ReactNode;
  /** Children to render in main content */
  children: React.ReactNode;
  /** Additional class names for main content */
  className?: string | undefined;
}

const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(
  (
    { currentPath = "/", navItems, renderNavLink, children, className },
    ref,
  ) => {
    const [isNavOpen, setNavOpen] = React.useState(false);
    const [isMobile, setMobile] = React.useState(false);

    // Handle responsive breakpoint
    React.useEffect(() => {
      const checkMobile = (): void => {
        setMobile(window.innerWidth < 768);
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const toggleNav = (): void => {
      setNavOpen((prev) => !prev);
    };

    return (
      <div
        ref={ref}
        className="flex min-h-screen bg-background"
      >
        {/* Navigation */}
        <Navigation
          currentPath={currentPath}
          isOpen={isNavOpen}
          onToggle={toggleNav}
          isMobile={isMobile}
          items={navItems}
          renderLink={renderNavLink}
        />

        {/* Main content */}
        <main className={cn("flex flex-1 flex-col", className)}>
          {/* Mobile header with menu button */}
          {isMobile && (
            <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background px-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleNav}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <span className="ml-3 text-lg font-semibold">Lexico</span>
            </header>
          )}

          {/* Page content */}
          <div className="flex-1">{children}</div>
        </main>
      </div>
    );
  },
);
Layout.displayName = "Layout";

export { Layout };
