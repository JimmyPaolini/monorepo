import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/**/*.test.ts"],
      include: ["src/**/*.ts"],
    },
    exclude: ["**/templates/**"],
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
