import { createRouter, type Router } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

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
