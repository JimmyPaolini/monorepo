import path from "path";

/**
 * Resolves the full path for an output file.
 *
 * Uses the OUTPUT_DIR environment variable if set (for Kubernetes deployments
 * with mounted persistent volumes), otherwise defaults to ./output for local
 * development runs.
 *
 * @param filename - Name of the output file (e.g., "events.ics", "data.json")
 * @returns Absolute path to the output file
 *
 * @example
 * ```typescript
 * // Local development
 * getOutputPath('calendar.ics'); // returns './output/calendar.ics'
 *
 * // Kubernetes deployment with OUTPUT_DIRECTORY=/data/output
 * getOutputPath('calendar.ics'); // returns '/data/output/calendar.ics'
 * ```
 *
 * @see {@link https://kubernetes.io/docs/concepts/storage/persistent-volumes/} for PVC configuration
 */
export function getOutputPath(filename: string): string {
  const outputDir = process.env["OUTPUT_DIRECTORY"] ?? "./output";
  return path.join(outputDir, filename);
}
