import { defineConfig } from "vitest/config";

import vitestConfig from "../../configuration/vitest.config.js";

export default defineConfig({
  ...vitestConfig,
  test: {
    ...vitestConfig.test,
    coverage: {
      ...vitestConfig.test?.coverage,
      exclude: ["src/**/*.test.ts"],
      include: ["src/**/*.ts"],
      thresholds: {
        ...vitestConfig.test?.coverage?.thresholds,
        branches: 95,
      },
    },
    exclude: ["**/templates/**"],
    passWithNoTests: true,
  },
});
