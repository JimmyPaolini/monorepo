import { relative } from "node:path";

const config = {
  "**/package.json": () => ["./scripts/check-lockfile.sh"],
  "pnpm-workspace.yaml": () => ["./scripts/check-lockfile.sh"],
  ".vscode/extensions.json": () => ["nx run monorepo:sync-extensions:check"],

  "*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}": (files: string[]) => {
    // Convert absolute paths to relative paths for Nx
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    // Nx runs multiple targets in parallel (respects nx.json parallel setting)
    return [
      `nx affected --target=format,lint,typecheck,spell-check --files=${relativePaths}`,
      "nx run monorepo:spell-check",
    ];
  },

  "*.{json,jsonc,json5,css,scss,html}": (files: string[]) => {
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    return [
      `nx affected --target=format,spell-check --files=${relativePaths}`,
      "nx run monorepo:spell-check",
    ];
  },

  "*.{md,mdx}": (files: string[]) => {
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    return [
      `nx affected --target=format,lint,markdown-lint,spell-check --files=${relativePaths}`,
      "nx run-many --target=spell-check,markdown-lint --projects=monorepo",
    ];
  },

  "*.{yml,yaml}": (files: string[]) => {
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    return [
      `nx affected --target=format,yaml-lint,spell-check --files=${relativePaths}`,
      "nx run monorepo:spell-check",
    ];
  },
};

export default config;
