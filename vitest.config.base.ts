import { defineConfig } from "vitest/config";

/**
 * Base Vitest configuration for the monorepo
 * Projects should extend this configuration for consistency
 *
 * Example in your project's vitest.config.ts:
 * ```
 * import { mergeConfig } from "vitest/config";
 * import baseConfig from "../../vitest.config.base";
 *
 * export default mergeConfig(
 *   baseConfig,
 *   defineConfig({
 *     test: {
 *       // Project-specific overrides
 *     },
 *   })
 * );
 * ```
 */
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
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    // Allow tests to pass when there are no test files
    passWithNoTests: true,
  },
});
