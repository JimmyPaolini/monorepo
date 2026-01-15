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
    ];
  },

  "*.{json,jsonc,json5,md,yml,yaml,css,scss,html}": (files: string[]) => {
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    const commands = [`nx affected --target=format --files=${relativePaths}`];
    if (files.some((file) => file.endsWith(".md"))) {
      const mdFiles = files
        .filter((file) => file.endsWith(".md"))
        .map((file) => `"${relative(process.cwd(), file)}"`)
        .join(" ");
      commands.push(
        `nx run monorepo:markdown-lint --configuration=write -- ${mdFiles}`,
      );
    }
    return commands;
  },
};

export default config;
