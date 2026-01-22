import { Button, cn } from "@monorepo/lexico-components";
import {
  Bookmark,
  BookOpen,
  Info,
  Menu,
  Search,
  Settings,
  Wrench,
  X,
} from "lucide-react";
import * as React from "react";

/**
 * Represents a navigation item in the sidebar.
 */
export interface NavItem {
  /** Route path */
  href: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon: React.ReactNode;
}

/**
 * Props for the Navigation component that displays the app sidebar.
 */
export interface NavigationProps {
  /** Current pathname for active state */
  currentPath?: string | undefined;
  /** Whether nav is open (mobile) */
  isOpen?: boolean | undefined;
  /** Callback to toggle nav */
  onToggle?: (() => void) | undefined;
  /** Whether on mobile viewport */
  isMobile?: boolean | undefined;
  /** Custom navigation items (uses defaults if not provided) */
  items?: NavItem[] | undefined;
  /** Render prop for link - use your framework's Link component */
  renderLink: (
    item: NavItem,
    isActive: boolean,
    children: React.ReactNode,
  ) => React.ReactNode;
  /** Additional class names */
  className?: string | undefined;
}

const defaultNavItems: NavItem[] = [
  { href: "/", label: "Search", icon: <Search className="h-5 w-5" /> },
  {
    href: "/bookmarks",
    label: "Bookmarks",
    icon: <Bookmark className="h-5 w-5" />,
  },
  {
    href: "/library",
    label: "Library",
    icon: <BookOpen className="h-5 w-5" />,
  },
  { href: "/tools", label: "Tools", icon: <Wrench className="h-5 w-5" /> },
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings className="h-5 w-5" />,
  },
  { href: "/about", label: "About", icon: <Info className="h-5 w-5" /> },
];

const Navigation = React.forwardRef<HTMLDivElement, NavigationProps>(
  (
    {
      currentPath = "/",
      isOpen = false,
      onToggle,
      isMobile = false,
      items = defaultNavItems,
      renderLink,
      className,
    },
    ref,
  ) => {
    // Desktop: permanent sidebar, expands on hover
    // Mobile: drawer that slides in
    const [isHovered, setIsHovered] = React.useState(false);
    const isExpanded = isMobile ? isOpen : isHovered;

    const handleMouseEnter = (): void => {
      if (!isMobile) setIsHovered(true);
    };

    const handleMouseLeave = (): void => {
      if (!isMobile) setIsHovered(false);
    };

    const handleItemClick = (): void => {
      if (isMobile && onToggle) {
        onToggle();
      }
    };

    const navContent = (
      <nav
        ref={ref}
        className={cn(
          "flex h-full flex-col bg-card transition-all duration-200",
          isExpanded ? "w-56" : "w-16",
          className,
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {isExpanded && (
            <span className="text-lg font-semibold text-foreground">
              Lexico
            </span>
          )}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          {!isMobile && !isExpanded && (
            <Menu className="mx-auto h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Nav items */}
        <div className="flex flex-1 flex-col gap-1 p-2">
          {items.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <button
                key={item.href}
                type="button"
                onClick={handleItemClick}
                className="w-full text-left"
              >
                {renderLink(
                  item,
                  isActive,
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.icon}
                    {isExpanded && <span>{item.label}</span>}
                  </div>,
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );

    // Mobile: render as drawer overlay
    if (isMobile) {
      return (
        <>
          {/* Backdrop */}
          {isOpen && (
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default bg-black/50"
              onClick={onToggle}
              aria-label="Close navigation"
            />
          )}
          {/* Drawer */}
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200",
              isOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            {navContent}
          </div>
        </>
      );
    }

    // Desktop: permanent sidebar
    return navContent;
  },
);
Navigation.displayName = "Navigation";

export { Navigation, defaultNavItems };
