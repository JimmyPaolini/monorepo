import "reflect-metadata";

import fs from "node:fs";

import { beforeAll, beforeEach, vi } from "vitest";

beforeAll(() => {
  const outputDir = "./output";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
});

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
