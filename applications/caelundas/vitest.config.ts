import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      reportOnFailure: true,
    },
    clearMocks: true,
    restoreMocks: true,
    setupFiles: ["./testing/setup.ts"],
  },
});
