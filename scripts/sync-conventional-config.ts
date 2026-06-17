import { main } from "./sync-conventional-config.helpers.js";

// 🌎 Public methods

/**
 * Entrypoint for syncing conventional commit configuration artifacts.
 */
function run(): void {
  const mode = process.argv[2] ?? "check";
  main(mode);
}

if (process.argv[1]?.endsWith("sync-conventional-config.ts")) {
  run();
}
