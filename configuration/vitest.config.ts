import { defineConfig } from "vitest/config";

const vitestConfig = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov", "html"],
      reportOnFailure: true,
      thresholds: {
        lines: 96,
        functions: 96,
        branches: 96,
        statements: 96,
      },
    },
    globals: false,
    include: ["src/**/*.test.ts", "testing/**/*.test.ts"],
    setupFiles: ["./testing/setup.ts"],
  },
});

export default vitestConfig;
