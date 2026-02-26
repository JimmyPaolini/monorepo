/**
 * Lint-staged configuration — runs checks on staged files during pre-commit.
 *
 * Each key is a glob pattern matching staged files, and its handler returns
 * an array of commands to run. Uses `nx affected` to scope checks to the
 * projects that own the changed files, plus monorepo-level checks.
 *
 * Invoked by Husky's pre-commit hook via `npx lint-staged`.
 */
import { relative } from "node:path";

const syncConventionalConfigFiles = [
  "conventional.config.cjs",
  ".vscode/settings.json",
  "documentation/skills/commit-code/SKILL.md",
  "documentation/skills/checkout-branch/SKILL.md",
  "documentation/skills/create-pull-request/SKILL.md",
  ".github/prompts/submit-changes.prompt.md",
  ".github/ISSUE_TEMPLATE/bug-report.yml",
  ".github/ISSUE_TEMPLATE/feature-request.yml",
];

const config = {
  // ── Lockfile integrity ──
  // When package.json or workspace config changes, verify the lockfile is in sync
  "**/package.json": () => ["./scripts/check-lockfile.sh"],
  "pnpm-workspace.yaml": () => ["./scripts/check-lockfile.sh"],

  // ── Config synchronization ──
  // Keep VS Code extensions list in sync between .vscode and .devcontainer
  "{.vscode/extensions.json,.devcontainer/devcontainer.json}": () => [
    "nx run monorepo:sync-vscode-extensions:check",
  ],
  // Keep conventional commit types/scopes consistent across config, settings, docs, and issue templates
  [`{${syncConventionalConfigFiles.join(",")}}`]: () => [
    "nx run monorepo:sync-conventional-config:check",
  ],

  // ── TypeScript / JavaScript source files ──
  // Runs format (prettier + biome), lint (eslint + oxlint), typecheck, and spell-check
  // on affected projects, plus monorepo-level spell-check for root-level words
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

  // ── JSON / HTML data files ──
  // Format and spell-check only (no lint or typecheck needed)
  "*.{json,jsonc,json5,html}": (files: string[]) => {
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    return [
      `nx affected --target=format,spell-check --files=${relativePaths}`,
      "nx run monorepo:spell-check",
    ];
  },

  // ── CSS files ──
  // Runs Stylelint, format, and spell-check
  "*.css": (files: string[]) => {
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    return [
      `nx affected --target=stylelint,format,spell-check --files=${relativePaths}`,
      "nx run monorepo:spell-check",
    ];
  },

  // ── Markdown files ──
  // Runs format, ESLint markdown plugin, markdownlint, and spell-check
  "*.{md,mdx}": (files: string[]) => {
    const relativePaths = files
      .map((file: string) => relative(process.cwd(), file))
      .join(",");
    return [
      `nx affected --target=format,lint,markdown-lint,spell-check --files=${relativePaths}`,
      "nx run-many --target=spell-check,markdown-lint --projects=monorepo",
    ];
  },

  // ── YAML files ──
  // Runs format, yamllint, and spell-check (GitHub Actions, Helm values, etc.)
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
