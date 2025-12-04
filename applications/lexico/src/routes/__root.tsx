/// <reference types="vite/client" />
import { Button } from "@monorepo/lexico-components";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import type { ReactNode } from "react";

import { getCurrentUser } from "~/lib/auth";
import appCss from "~/styles/app.css?url";

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
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
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
  const { user } = Route.useRouteContext();

  return (
    <html
      lang="en"
      className="dark"
    >
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <header className="border-b border-border bg-card">
          <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4">
            <Link
              to="/"
              className="text-xl font-bold text-primary hover:text-primary/80"
            >
              Lexico
            </Link>
            <div className="flex gap-4">
              <Link
                to="/search"
                className="text-muted-foreground hover:text-foreground [&.active]:font-semibold [&.active]:text-secondary"
              >
                Search
              </Link>
              <Link
                to="/library"
                className="text-muted-foreground hover:text-foreground [&.active]:font-semibold [&.active]:text-secondary"
              >
                Library
              </Link>
              <Link
                to="/bookmarks"
                className="text-muted-foreground hover:text-foreground [&.active]:font-semibold [&.active]:text-secondary"
              >
                Bookmarks
              </Link>
              <Link
                to="/tools"
                className="text-muted-foreground hover:text-foreground [&.active]:font-semibold [&.active]:text-secondary"
              >
                Tools
              </Link>
            </div>
            <div className="ml-auto flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <Link
                    to="/settings"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Settings
                  </Link>
                </>
              ) : (
                <Link
                  to="/settings"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
