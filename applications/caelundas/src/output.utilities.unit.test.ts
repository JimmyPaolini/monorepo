import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getOutputPath } from "./output.utilities";
import path from "path";

describe("output.utilities", () => {
  const originalEnv = process.env.OUTPUT_DIRECTORY;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.OUTPUT_DIRECTORY = originalEnv;
    } else {
      delete process.env.OUTPUT_DIRECTORY;
    }
  });

  describe("getOutputPath", () => {
    it("should use default ./output directory when OUTPUT_DIRECTORY is not set", () => {
      delete process.env.OUTPUT_DIRECTORY;

      const result = getOutputPath("test.ics");

      expect(result).toBe(path.join("./output", "test.ics"));
    });

    it("should use OUTPUT_DIRECTORY environment variable when set", () => {
      process.env.OUTPUT_DIRECTORY = "/custom/output/path";

      const result = getOutputPath("test.ics");

      expect(result).toBe(path.join("/custom/output/path", "test.ics"));
    });

    it("should handle filenames with subdirectories", () => {
      delete process.env.OUTPUT_DIRECTORY;

      const result = getOutputPath("subdir/test.ics");

      expect(result).toBe(path.join("./output", "subdir/test.ics"));
    });

    it("should handle empty filename", () => {
      delete process.env.OUTPUT_DIRECTORY;

      const result = getOutputPath("");

      // path.join normalizes the path, removing ./
      expect(result).toBe("output");
    });
  });
});
