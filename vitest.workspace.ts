import type { UserProjectConfigExport } from "vitest/config";

export default [
  "applications/caelundas/vitest.config.ts",
  "tools/code-generator/vitest.config.ts",
] satisfies (string | UserProjectConfigExport)[];
