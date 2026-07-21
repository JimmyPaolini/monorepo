import { defineConfig, mergeConfig } from "vitest/config";

import vitestConfig from "../../configuration/vitest.config.js";

import viteConfig from "./vite.config.mts";

// Create a version without setupFiles for lexico (which doesn't have testing/setup.ts)
const baseConfigWithoutSetupFiles = defineConfig({
  ...vitestConfig,
  test: {
    ...vitestConfig.test,
    setupFiles: [],
  },
});

export default mergeConfig(
  viteConfig,
  mergeConfig(
    baseConfigWithoutSetupFiles,
    defineConfig({
      test: {
        coverage: {
          exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          include: ["src/**/*.ts", "src/**/*.tsx"],
        },
        environment: "jsdom",
      },
    }),
  ),
);
