import { spawnSync } from "node:child_process";

const { status } = spawnSync("pnpm", ["outdated", "--recursive"], {
  stdio: "inherit",
});

process.exit(status === 0 || status === 1 ? 0 : (status ?? 1));
