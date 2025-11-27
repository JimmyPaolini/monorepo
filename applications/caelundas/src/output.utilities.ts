import path from "path";

/**
 * Get the full path for an output file in the output directory.
 * Uses OUTPUT_DIR environment variable if set (for Kubernetes deployments),
 * otherwise defaults to ./output for local development.
 */
export function getOutputPath(filename: string): string {
  const outputDir = process.env["OUTPUT_DIRECTORY"] ?? "./output";
  return path.join(outputDir, filename);
}
