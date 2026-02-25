---
agent: "agent"
argument-hint: "Just run the prompt — no arguments needed. I'll analyze the current changes and handle everything automatically."
description: "Automatically submit changes through the full branch → commit → pull request pipeline by analyzing code changes and handling hooks intelligently."
model: Claude Haiku 4.5 (copilot)
name: "submit-changes"
tools:
  [
    vscode/getProjectSetupInfo,
    execute/getTerminalOutput,
    execute/runInTerminal,
    read,
    search,
    web,
    "github/*",
  ]
---

# Submit Changes

Automatically move local changes through **branch → commit → push → pull request** without user input. Each phase is idempotent — skip completed steps. Prefer GitHub MCP tools over CLI; fall back to CLI only when no MCP tool exists (staging, committing, pushing).

## Safety Rules

- **NEVER** run destructive commands (`git reset`, `git clean`, `git checkout -- .`, `git push --force`, `git rebase`)
- **NEVER** bypass hooks with `--no-verify`
- **NEVER** auto-fix pre-commit failures — report and stop
- On any failure: **report the error and stop**

---

## Automatic Change Analysis

Use the `changes` tool to get the working-tree diff. From its output, automatically determine:

1. **Type** — from the Allowed Types table below
2. **Scope** — from the Allowed Scopes table below
3. **Gitmoji** — best-fit emoji (see [gitmoji.md](../../gitmoji.md))
4. **Subject** — concise imperative phrase, lowercase, no period, under 70 chars

These values drive the branch name, commit message, and PR title.

---

## Allowed Types & Scopes

Synced from [conventional.config.cjs](../../conventional.config.cjs). Do not edit by hand.

### Types

<!-- types-start -->

| Type       | Description                                                                         |
| ---------- | ----------------------------------------------------------------------------------- |
| `build`    | Build system, Vite/Docker/Helm config, or external dependency integration           |
| `chore`    | Housekeeping that doesn't modify src or test files (gitignore, editor config, etc.) |
| `ci`       | GitHub Actions workflows, composite actions, and CI/CD scripts                      |
| `docs`     | Documentation, AGENTS.md, SKILL.md, README, and planning files                      |
| `feat`     | A new feature or capability                                                         |
| `fix`      | A bug fix                                                                           |
| `perf`     | A code change that improves performance (caching, query optimization, etc.)         |
| `refactor` | Code restructuring that neither fixes a bug nor adds a feature                      |
| `revert`   | Reverts a previous commit                                                           |
| `style`    | Formatting, whitespace, or code structure changes with no semantic effect           |
| `test`     | Adding or correcting unit, integration, or end-to-end tests                         |

<!-- types-end -->

### Scopes

<!-- scopes-start -->

| Scope               | Description                                                                   |
| ------------------- | ----------------------------------------------------------------------------- |
| `applications`      | Changes spanning multiple apps (caelundas, lexico, JimmyPaolini)              |
| `caelundas`         | Node.js CLI for astronomical calendar generation (NASA JPL ephemeris)         |
| `configuration`     | Workspace root config files (tsconfig, eslint, vitest, nx.json, etc.)         |
| `dependencies`      | Dependency version changes (upgrades, additions, removals via pnpm)           |
| `deployments`       | GitHub Actions workflows and CI/CD pipeline configuration                     |
| `documentation`     | Markdown docs, skills, planning files, and AGENTS.md files                    |
| `infrastructure`    | Helm charts, Terraform configs, and Kubernetes resources                      |
| `JimmyPaolini`      | Static GitHub profile README project (markdown and assets)                    |
| `lexico-components` | Shared React/shadcn component library in packages/                            |
| `lexico`            | TanStack Start SSR Latin dictionary web app with Supabase backend             |
| `linting`           | ESLint configs, rules, plugins, and lint-related tooling                      |
| `monorepo`          | Workspace root concerns (pnpm-workspace, root package.json, Nx orchestration) |
| `packages`          | Changes spanning multiple shared packages                                     |
| `scripts`           | Shell and TypeScript scripts in scripts/ (sync, setup, utilities)             |
| `testing`           | Vitest configuration, shared test utilities, and coverage setup               |
| `tools`             | Nx custom generators and developer tooling in tools/                          |

<!-- scopes-end -->

---

## Phase 1 — Branch

Skip if already on a non-`main` branch.

- **Name**: `<type>/<scope>-<description>` (kebab-case, 2–4 keyword description)
- **Create remote**: `mcp_github_create_branch(owner, repo, branch, from_branch: "main")`
- **Switch local**: `git checkout <branch>` (fallback: `git checkout -b <branch>`)

---

## Phase 2 — Stage, Commit & Push

Skip if working tree is clean (`git status --porcelain` returns nothing).

1. `git add -A`
2. Compose message: `<type>(<scope>): <gitmoji> <subject>` — single line, max 128 chars, no body/footer
3. `git commit -m "<message>"`

### If pre-commit hooks fail

**Stop immediately.** Parse the output, identify which hooks failed, and report:

- What failed and why (specific errors, files, line numbers)
- Suggested fix commands (e.g., `pnpm format`, `nx run-many --target=lint --fix`)
- Do NOT apply fixes or proceed to push

### If commit succeeds

`git push --set-upstream origin <branch>`

---

## Phase 3 — Pull Request

Skip if a PR already exists: `mcp_github_list_pull_requests(owner, repo, head: "<owner>:<branch>", state: "open")`

- **Title**: Same as commit message
- **Body**: Auto-generate Summary, Details, Testing, and Related sections from the diff
- **Create**: `mcp_github_create_pull_request(owner, repo, title, head, base: "main", body, draft: false)`
- **Fallback**: `gh pr create --title "<title>" --body "<body>"`

---

## Output

Print a summary table with Branch, Commit, and PR results (created/existing/failed).

**Now analyze the current state and submit the changes!**
