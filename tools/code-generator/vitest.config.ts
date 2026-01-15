import { defineConfig, mergeConfig } from "vitest/config";

import baseConfig from "../../vitest.config.base.ts";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["src/**/*.test.ts"],
      coverage: {
        include: ["src/**/*.ts"],
        exclude: ["src/**/*.test.ts"],
      },
    },
  }),
);
