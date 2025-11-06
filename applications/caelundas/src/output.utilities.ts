import path from "path";

/**
 * Get the full path for an output file in the calendars directory
 */
export function getOutputPath(filename: string): string {
  const outputDir = "./output";
  return path.join(outputDir, filename);
}
