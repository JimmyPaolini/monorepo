import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      exclude: ["src/**/*.test.ts"],
      include: ["src/**/*.ts"],
    },
    globals: true,
    include: ["src/**/*.test.ts", "testing/**/*.test.ts"],
    setupFiles: ["./testing/setup.ts"],
  },
});
