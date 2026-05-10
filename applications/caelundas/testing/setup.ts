import "reflect-metadata";

import fs from "node:fs";

import { noop } from "lodash";
import { beforeAll, beforeEach, vi } from "vitest";

/**
 * Global test setup - automatically imported via vitest.config.ts setupFiles.
 * This file is executed before all tests.
 */

// Ensure output directory exists for database files (needed for integration tests)
beforeAll(() => {
  const outputDir = "./output";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
});

// Suppress console output in tests by default
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(noop);
  vi.spyOn(console, "error").mockImplementation(noop);
  vi.spyOn(console, "warn").mockImplementation(noop);
});
