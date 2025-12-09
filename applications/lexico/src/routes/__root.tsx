/// <reference types="vite/client" />
import {
  Button,
  Logo,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@monorepo/lexico-components";
import appCss from "@monorepo/lexico-components/styles/globals.css?url";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useMatches,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Bookmark, BookOpen, Info, Search, User, Wrench } from "lucide-react";
import { useState } from "react";

import type { ReactNode } from "react";

import { getCurrentUser } from "~/lib/auth";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { href: "/search", label: "Search", icon: <Search className="h-5 w-5" /> },
  {
    href: "/bookmarks",
    label: "Bookmarks",
    icon: <Bookmark className="h-5 w-5" />,
  },
  {
    href: "/library",
    label: "Literature",
    icon: <BookOpen className="h-5 w-5" />,
  },
  { href: "/tools", label: "Grammar", icon: <Wrench className="h-5 w-5" /> },
  { href: "/settings", label: "User", icon: <User className="h-5 w-5" /> },
  { href: "/about", label: "About", icon: <Info className="h-5 w-5" /> },
];

export const Route = createRootRoute({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    return { user };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Lexico - Latin Dictionary & Reader",
      },
      {
        name: "description",
        content:
          "Lexico is a Latin dictionary and reader application for students and scholars.",
      },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function NotFound(): ReactNode {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found</p>
      <Button
        asChild
        className="mt-4"
      >
        <Link to="/">Go Home</Link>
      </Button>
    </div>
  );
}

function RootComponent(): ReactNode {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({
  children,
}: Readonly<{ children: ReactNode }>): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <html
      lang="en"
      className="dark"
    >
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SidebarProvider
          open={open}
          onOpenChange={setOpen}
        >
          <AppSidebar onHoverChange={setOpen} />
          <SidebarInset>
            {/* Mobile header with hamburger */}
            <header className="flex h-14 items-center border-b border-border bg-card px-4 md:hidden">
              <SidebarTrigger />
              <span className="ml-3 text-lg font-semibold">Lexico</span>
            </header>
            {/* Page content */}
            <div className="flex-1 px-4 py-8 md:px-8">{children}</div>
          </SidebarInset>
        </SidebarProvider>
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}

function AppSidebar({
  onHoverChange,
}: {
  onHoverChange: (hovered: boolean) => void;
}): ReactNode {
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.pathname ?? "/";
  const { isMobile } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      onMouseEnter={() => !isMobile && onHoverChange(true)}
      onMouseLeave={() => !isMobile && onHoverChange(false)}
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          to="/"
          className="flex h-8 items-center gap-2 text-lg font-semibold text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground cursor-pointer"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#66023C]">
            <Logo width={18} />
          </span>
          <span className="truncate group-data-[collapsible=icon]:hidden">
            Lexico
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive =
                currentPath === item.href ||
                (item.href === "/search" && currentPath === "/");
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                  >
                    <Link to={item.href}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
