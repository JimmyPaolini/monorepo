import { spawnSync } from "node:child_process";

const { status } = spawnSync("pnpm", ["outdated", "--recursive"], {
  stdio: "inherit",
});

if (status === 0 || status === 1) {
  process.exit(0);
}

process.exit(status ?? 1);
