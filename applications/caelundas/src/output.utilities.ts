import fs from "fs";
import path from "path";

/**
 * Get the output directory for calendar files.
 * Uses environment variable OUTPUT_DIR if set, otherwise defaults to ./output
 * This allows the application to write to persistent volumes in Kubernetes.
 */
export function getOutputDirectory(): string {
  const outputDir = process.env.OUTPUT_DIR || "./output";

  // Ensure the directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return outputDir;
}

/**
 * Get the full path for an output file in the calendars directory
 */
export function getOutputPath(filename: string): string {
  const outputDir = getOutputDirectory();
  return path.join(outputDir, filename);
}
