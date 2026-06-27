/** Supported synchronization execution modes. */
export type SynchronizationMode = "check" | "write";

/** A single synchronization command task executed by the root orchestration command. */
export interface SynchronizationTask {
  commandName: string;
  runCommand: (mode: SynchronizationMode) => Promise<void>;
}
