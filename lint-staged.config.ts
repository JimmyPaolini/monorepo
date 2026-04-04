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

const syncPullRequestTemplateFiles = [
  ".github/PULL_REQUEST_TEMPLATE.md",
  "documentation/skills/create-pull-request/SKILL.md",
  ".github/prompts/create-pull-request.prompt.md",
  ".github/prompts/update-pull-request.prompt.md",
];

const syncAgentSkillsFiles = ["AGENTS.md", "documentation/skills/**/*.md"];

function getPaths(files: string[]): string {
  return files.map((file) => relative(process.cwd(), file)).join(",");
}

const config = {
  // ── Lockfile integrity ──
  // When package.json or workspace config changes, verify the lockfile is in sync
  "**/package.json": () => ["./scripts/check-lockfile.sh"],
  "pnpm-workspace.yaml": () => ["./scripts/check-lockfile.sh"],

  // ── Config synchronization ──
  // Keep VS Code extensions list in sync between .vscode and local devcontainer config
  "{.vscode/extensions.json,.devcontainer/local/devcontainer.json}": () => [
    "nx run monorepo:sync-vscode-extensions:check --outputStyle=dynamic-legacy",
  ],
  // Keep cloud devcontainer config in sync with local config for common fields
  "{.devcontainer/cloud/devcontainer.json,.devcontainer/local/devcontainer.json}":
    () => [
      "nx run monorepo:sync-devcontainer-configuration:check --outputStyle=dynamic-legacy",
    ],
  // Keep conventional commit types/scopes consistent across config, settings, docs, and issue templates
  [`{${syncConventionalConfigFiles.join(",")}}`]: () => [
    "nx run monorepo:sync-conventional-config:check --outputStyle=dynamic-legacy",
  ],
  // Keep PR template in sync across skills and prompt files
  [`{${syncPullRequestTemplateFiles.join(",")}}`]: () => [
    "nx run monorepo:sync-pull-request-template:check --outputStyle=dynamic-legacy",
  ],
  // Keep agent skills table of contents in sync in AGENTS.md
  [`{${syncAgentSkillsFiles.join(",")}}`]: () => [
    "nx run monorepo:sync-agent-skills:check --outputStyle=dynamic-legacy",
  ],

  // ── TypeScript / JavaScript source files ──
  // Runs format (oxfmt + prettier + biome), lint (eslint + oxlint), typecheck, and spell-check
  // on affected projects. nx affected includes monorepo when root-level files change.
  "*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}": (files: string[]) => {
    return [
      `nx affected --target=format,lint,typecheck,spell-check --configuration=check --files=${getPaths(files)} --outputStyle=dynamic-legacy`,
    ];
  },

  // ── Jupyter notebooks ──
  // Strip outputs first (nbstripout modifies in-place; lint-staged re-stages the
  // clean file), then spell-check the now-output-free notebook.
  "*.ipynb": (files: string[]) => {
    return [
      `uv run --directory applications/affirmations nbstripout ${files.join(" ")}`,
      `nx affected --target=spell-check --configuration=check --files=${getPaths(files)} --outputStyle=dynamic-legacy`,
    ];
  },

  // ── Python files ──
  // Runs format (Ruff), lint (Ruff), typecheck (pyright), and dead-code detection (vulture)
  "*.py": (files: string[]) => {
    return [
      `nx affected --target=format,lint,spell-check,typecheck,vulture --configuration=check --files=${getPaths(files)} --outputStyle=dynamic-legacy`,
    ];
  },

  // ── JSON / HTML data files ──
  // Format and spell-check only (no lint or typecheck needed)
  "*.{json,jsonc,json5,html}": (files: string[]) => {
    return [
      `nx affected --target=format,spell-check --configuration=check --files=${getPaths(files)} --outputStyle=dynamic-legacy`,
    ];
  },

  // ── CSS files ──
  // Runs Stylelint, format, and spell-check
  "*.css": (files: string[]) => {
    return [
      `nx affected --target=stylelint,format,spell-check --configuration=check --files=${getPaths(files)} --outputStyle=dynamic-legacy`,
    ];
  },

  // ── Markdown files ──
  // Runs format, ESLint markdown plugin, markdownlint, and spell-check
  "*.{md,mdx}": (files: string[]) => {
    return [
      `nx affected --target=format,lint,markdown-lint,spell-check --configuration=check --files=${getPaths(files)} --outputStyle=dynamic-legacy`,
    ];
  },

  // ── YAML files ──
  // Runs format, yamllint, and spell-check (GitHub Actions, Helm values, etc.)
  // pnpm-lock.yaml is excluded: it's auto-generated and should not be linted.
  "{*.yml,!(pnpm-lock).yaml}": (files: string[]) => {
    return [
      `nx affected --target=format,yaml-lint,spell-check --configuration=check --files=${getPaths(files)} --outputStyle=dynamic-legacy`,
    ];
  },
};

export default config;
