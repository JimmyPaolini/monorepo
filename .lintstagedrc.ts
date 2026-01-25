import { relative } from "node:path";

const config = {
  "**/package.json": () => [
    "./scripts/check-lockfile.sh",
    "nx run monorepo:license-check",
  ],
  "pnpm-workspace.yaml": () => ["./scripts/check-lockfile.sh"],

  "*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}": (files: string[]) => {
    // Convert absolute paths to relative paths for Nx
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    return [
      `nx affected --target=format --files=${relativePaths}`,
      `nx affected --target=lint --files=${relativePaths}`,
      `nx affected --target=typecheck --files=${relativePaths}`,
      `nx affected --target=knip --files=${relativePaths}`,
      `nx affected --target=type-coverage --files=${relativePaths}`,
      "nx run monorepo:spell-check",
    ];
  },

  "*.{json,jsonc,json5,css,scss,html}": (files: string[]) => {
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    return [
      `nx affected --target=format --files=${relativePaths}`,
      "nx run monorepo:spell-check",
    ];
  },

  "*.{yml,yaml}": (files: string[]) => {
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    return [
      `nx affected --target=format --files=${relativePaths}`,
      `nx affected --target=yaml-lint --files=${relativePaths}`,
      "nx run monorepo:spell-check",
    ];
  },

  "*.md": (files: string[]) => {
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    return [
      `nx affected --target=format --files=${relativePaths}`,
      `nx affected --target=lint --files=${relativePaths}`,
      "nx run monorepo:spell-check",
      "nx run monorepo:markdown-lint",
    ];
  },
};

export default config;
