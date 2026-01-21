import { relative } from "node:path";

const config = {
  "**/package.json": () => ["./scripts/check-lockfile.sh"],
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
    ];
  },

  "*.{json,jsonc,json5,yml,yaml,css,scss,html}": (files: string[]) => {
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    return [`nx affected --target=format --files=${relativePaths}`];
  },

  "*.md": (files: string[]) => {
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    return [
      `nx affected --target=format --files=${relativePaths}`,
      `nx affected --target=lint --files=${relativePaths}`,
    ];
  },
};

export default config;
