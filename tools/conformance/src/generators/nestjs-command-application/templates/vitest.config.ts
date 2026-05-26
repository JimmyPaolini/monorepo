import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    include: ["src/**/*.test.ts", "testing/**/*.test.ts"],
    setupFiles: ["./testing/setup.ts"],
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
