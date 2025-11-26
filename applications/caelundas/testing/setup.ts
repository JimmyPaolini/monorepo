import { beforeEach, vi } from "vitest";

/**
 * Global test setup - automatically imported via vitest.config.ts setupFiles.
 * This file is executed before all tests.
 */

// Suppress console output in tests by default
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
