import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json-summary", "lcov", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      reportOnFailure: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    clearMocks: true,
    restoreMocks: true,
    setupFiles: ["./testing/setup.ts"],
  },
});
