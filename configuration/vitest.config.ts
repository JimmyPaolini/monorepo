import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov", "html"],
      exclude: ["node_modules/", "dist/", "**/*.test.ts"],
      reportOnFailure: true,
      // Coverage thresholds — tests fail if coverage drops below these percentages.
      // See documentation/vitest.md for rationale and per-project override guidance.
      thresholds: {
        lines: 96,
        functions: 96,
        branches: 96,
        statements: 96,
      },
    },
    // Allow tests to pass when there are no test files
    passWithNoTests: true,
    projects: [
      "../applications/caelundas/vitest.config.ts",
      "../tools/conformance/vitest.config.ts",
    ],
  },
});
