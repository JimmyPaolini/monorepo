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

import { Button, cn } from "@monorepo/lexico-components";

/**
 * Represents a navigation item in the sidebar.
 */
export interface NavigationItem {
  /** Route path */
  href: string;
  /** Icon component */
  icon: React.ReactNode;
  /** Display label */
  label: string;
}

/**
 * Props for the Navigation component that displays the app sidebar.
 */
export interface NavigationProps {
  /** Additional class names */
  className?: string | undefined;
  /** Current pathname for active state */
  currentPath?: string | undefined;
  /** Whether on mobile viewport */
  isMobile?: boolean | undefined;
  /** Whether nav is open (mobile) */
  isOpen?: boolean | undefined;
  /** Custom navigation items (uses defaults if not provided) */
  items?: NavigationItem[] | undefined;
  /** Callback to toggle nav */
  onToggle?: (() => void) | undefined;
  /** Render prop for link - use your framework's Link component */
  renderLink: (
    item: NavigationItem,
    isActive: boolean,
    children: React.ReactNode,
  ) => React.ReactNode;
}

const defaultNavigationItems: NavigationItem[] = [
  { href: "/", icon: <Search className="h-5 w-5" />, label: "Search" },
  {
    href: "/bookmarks",
    icon: <Bookmark className="h-5 w-5" />,
    label: "Bookmarks",
  },
  {
    href: "/library",
    icon: <BookOpen className="h-5 w-5" />,
    label: "Library",
  },
  { href: "/tools", icon: <Wrench className="h-5 w-5" />, label: "Tools" },
  {
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    label: "Settings",
  },
  { href: "/about", icon: <Info className="h-5 w-5" />, label: "About" },
];

/**
 * Props for the NavigationContent sub-component.
 */
interface NavigationContentProps {
  className: string | undefined;
  currentPath: string;
  isExpanded: boolean;
  isMobile: boolean;
  items: NavigationItem[];
  onItemClick: () => void;
  onToggle: (() => void) | undefined;
  reference: React.Ref<HTMLDivElement>;
  renderLink: NavigationProps["renderLink"];
}

/**
 * Props for the NavigationItems sub-component.
 */
interface NavigationItemsProps {
  currentPath: string;
  isExpanded: boolean;
  items: NavigationItem[];
  onItemClick: () => void;
  renderLink: NavigationProps["renderLink"];
}

/**
 * Renders the nav sidebar panel (header + items).
 */
function NavigationContent(
  properties: NavigationContentProps,
): React.ReactElement {
  const {
    className,
    currentPath,
    isExpanded,
    isMobile,
    items,
    onItemClick,
    onToggle,
    reference,
    renderLink,
  } = properties;

  return (
    <nav
      ref={reference}
      className={cn(
        "flex h-full flex-col bg-card transition-all duration-200",
        isExpanded ? "w-56" : "w-16",
        className,
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {isExpanded && (
          <span className="text-lg font-semibold text-foreground">Lexico</span>
        )}
        {isMobile && (
          <Button
            onClick={onToggle}
            size="icon"
            variant="ghost"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        {!isMobile && !isExpanded && (
          <Menu className="mx-auto h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <NavigationItems
        currentPath={currentPath}
        isExpanded={isExpanded}
        items={items}
        onItemClick={onItemClick}
        renderLink={renderLink}
      />
    </nav>
  );
}

/**
 * Renders the list of navigation items with active state and expand/collapse labels.
 */
function NavigationItems(properties: NavigationItemsProps): React.ReactElement {
  const { currentPath, isExpanded, items, onItemClick, renderLink } =
    properties;

  return (
    <div className="flex flex-1 flex-col gap-1 p-2">
      {items.map((item) => {
        const isActive = currentPath === item.href;
        return (
          <button
            key={item.href}
            className="w-full text-left"
            onClick={onItemClick}
            type="button"
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
  );
}

const Navigation = React.forwardRef<HTMLDivElement, NavigationProps>(
  (
    {
      className,
      currentPath = "/",
      isMobile = false,
      isOpen = false,
      items = defaultNavigationItems,
      onToggle,
      renderLink,
    },
    reference,
  ) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const isExpanded = isMobile ? isOpen : isHovered;

    const handleMouseEnter = (): void => {
      if (!isMobile) setIsHovered(true);
    };

    const handleMouseLeave = (): void => {
      if (!isMobile) setIsHovered(false);
    };

    const handleItemClick = (): void => {
      if (isMobile && onToggle) onToggle();
    };

    const navigationContent = (
      <NavigationContent
        className={className}
        currentPath={currentPath}
        isExpanded={isExpanded}
        isMobile={isMobile}
        items={items}
        onItemClick={handleItemClick}
        onToggle={onToggle}
        reference={reference}
        renderLink={renderLink}
      />
    );

    if (isMobile) {
      return (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {isOpen && (
            <button
              aria-label="Close navigation"
              className="fixed inset-0 z-40 cursor-default bg-black/50"
              onClick={onToggle}
              type="button"
            />
          )}
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200",
              isOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            {navigationContent}
          </div>
        </div>
      );
    }

    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {navigationContent}
      </div>
    );
  },
);
Navigation.displayName = "Navigation";

export { Navigation };
