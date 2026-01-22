import { createRouter, type Router } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

/**
 * Creates and configures the application router.
 *
 * @returns Configured TanStack Router instance
 */
export function getRouter(): Router<typeof routeTree> {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
