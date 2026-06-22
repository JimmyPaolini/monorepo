import fs from "node:fs";

import "reflect-metadata";
import { beforeAll, beforeEach } from "vitest";

beforeAll(() => {
  const outputDirectory = "./output";
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }
});

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
