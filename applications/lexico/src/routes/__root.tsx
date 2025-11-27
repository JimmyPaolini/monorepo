/// <reference types="vite/client" />
import { Button } from "@monorepo/lexico-components";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";

export interface RouterContext {
  supabase: SupabaseClient;
  user: User | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
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
        title: "Lexico",
      },
      {
        name: "description",
        content: "Lexico - Built with TanStack Start and Supabase",
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
  return (
    <html lang="en">
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
                to="/"
                className="text-muted-foreground hover:text-foreground [&.active]:font-semibold [&.active]:text-primary"
              >
                Home
              </Link>
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
