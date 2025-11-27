import { beforeEach, vi } from "vitest";

/**
 * Global test setup - automatically imported via vitest.config.ts setupFiles.
 * This file is executed before all tests.
 */

// Suppress console output in tests by default
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {
    /* no-op */
  });
  vi.spyOn(console, "error").mockImplementation(() => {
    /* no-op */
  });
  vi.spyOn(console, "warn").mockImplementation(() => {
    /* no-op */
  });
});
