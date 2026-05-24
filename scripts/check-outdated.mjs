import { spawnSync } from "node:child_process";

const { status } = spawnSync("pnpm", ["outdated", "--recursive"], {
  stdio: "inherit",
});

if (status === 0 || status === 1) {
  process.exit(0);
}

if (status === null || status === undefined) {
  console.error("pnpm outdated did not return an exit status");
}

process.exit(status ?? 1);
