---
goal: Expand static analysis tooling with Gitleaks, eslint-plugin-unicorn, Sherif, Syncpack, Trivy, and Stylelint
version: 1.0
date_created: 2026-02-13
last_updated: 2026-02-13
owner: monorepo
status: "Planned"
tags:
  - feature
  - chore
  - architecture
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan adds six new static analysis tools to the monorepo, organized in three tiers by priority. The tools address critical gaps in secret detection, code quality, monorepo hygiene, dependency consistency, container security, and CSS linting. Each tool integrates with the existing Nx task runner, CI/CD workflows, and pre-commit hooks.

## 1. Requirements & Constraints

- **REQ-001**: All new tools must integrate as Nx targets with caching support via `nx.json` `targetDefaults`
- **REQ-002**: Each tool must have a CI workflow job (either new workflow or matrix entry in existing `code-analysis.yml`)
- **REQ-003**: Tools must support the existing `check`/`write` configuration pattern where applicable (read-only in CI, auto-fix locally)
- **REQ-004**: All npm packages must be installed as root `devDependencies` using `pnpm add -w -D`
- **REQ-005**: Binary tools (Gitleaks, Sherif, Trivy) must be invoked via `npx`/`pnpm dlx` or GitHub Actions — no Go/Rust toolchain required
- **REQ-006**: Documentation must be appended to the existing `documentation/static-analysis-tools.md` following the established 4-category structure
- **REQ-007**: New cspell dictionary words must be added to `cspell.config.yaml` for any new tool-specific terminology
- **SEC-001**: Gitleaks must scan the full git history on CI and staged changes pre-commit
- **SEC-002**: Trivy must scan the caelundas Dockerfile and Terraform IaC files
- **CON-001**: ESLint flat config only — no legacy `.eslintrc` formats. `eslint-plugin-unicorn` v63.0.0 requires ESLint >= 9.20.0 (current: 9.39.1 ✓)
- **CON-002**: Stylelint applies only to `applications/lexico` (the only project with CSS/Tailwind)
- **CON-003**: Sherif is a binary CLI distributed via npm — no native compilation needed. Version: 1.10.0
- **CON-004**: Syncpack v13.0.4 is the stable release (v14 alpha is a Rust rewrite, not production-ready)
- **CON-005**: Gitleaks GitHub Action v2 requires a `GITLEAKS_LICENSE` secret for organization repos but is free for personal accounts
- **CON-006**: No `--no-verify` usage — all hooks and checks must pass legitimately
- **GUD-001**: Follow the existing Nx target pattern: `executor: "nx:run-commands"`, `cache: true`, `inputs` array for cache invalidation
- **GUD-002**: Follow existing CI matrix pattern from `code-analysis.yml` for new check entries
- **GUD-003**: Use the `recommended` preset for `eslint-plugin-unicorn` and disable rules that conflict with existing config
- **PAT-001**: Git hook integration pattern: lint-staged for pre-commit, standalone commands for pre-push
- **PAT-002**: Workflow pattern: checkout → setup-monorepo composite action → run check

## 2. Implementation Steps

### Implementation Phase 1: Secret Detection (Gitleaks)

- GOAL-001: Add Gitleaks secret scanning to the monorepo as both a CI workflow and local pre-commit check

| Task     | Description                                                                                                                                                                                                                                                                   | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Create `.gitleaks.toml` configuration file at workspace root. Extend the default config with `[extend] useDefault = true`. Add `[[allowlists]]` entries to ignore `pnpm-lock.yaml`, `*.tfstate`, test fixtures, and the `.gitleaksignore` file itself                         |           |      |
| TASK-002 | Create `.gitleaksignore` file at workspace root for known false-positive fingerprints (initially empty with a header comment explaining usage)                                                                                                                                |           |      |
| TASK-003 | Create `.github/workflows/gitleaks.yml` workflow: trigger on `push` and `pull_request`, use `actions/checkout@v4` with `fetch-depth: 0`, use `gitleaks/gitleaks-action@v2` with `GITHUB_TOKEN` env var. Add `GITLEAKS_LICENSE` env var conditionally for organization support |           |      |
| TASK-004 | Add `gitleaks` Nx target to `nx.json` `targetDefaults`: `executor: "nx:run-commands"`, command `gitleaks dir {projectRoot}`, `cache: false` (security scans should not be cached), inputs `["default"]`                                                                       |           |      |
| TASK-005 | Update `.husky/pre-push` to run `gitleaks git --staged --verbose --redact --exit-code 1` before the existing `validate-branch-name` command. This scans only staged changes for secrets before push                                                                           |           |      |
| TASK-006 | Add `gitleaks`, `gitleaksignore` to `cspell.config.yaml` words list                                                                                                                                                                                                           |           |      |
| TASK-007 | Append Gitleaks documentation section to `documentation/static-analysis-tools.md` under "Security & Architecture" category, including configuration, usage commands, CI workflow description, and how to handle false positives via `.gitleaksignore`                         |           |      |

### Implementation Phase 2: ESLint Plugin Unicorn

- GOAL-002: Add `eslint-plugin-unicorn` v63.0.0 to the ESLint flat config with the `recommended` preset, selectively disabling rules that conflict with existing conventions

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-008 | Install `eslint-plugin-unicorn` as a root devDependency: `pnpm add -w -D eslint-plugin-unicorn@^63.0.0`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |           |      |
| TASK-009 | Add import statement to `eslint.config.base.ts`: `import eslintPluginUnicorn from "eslint-plugin-unicorn";` — insert after the existing `eslint-plugin-yml` import (line 16)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |           |      |
| TASK-010 | Add `eslintPluginUnicorn.configs.recommended` spread to the ESLint config array. Place it after the Nx plugin configs and before the global TS/JS configuration block. Scope it to `files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts", "**/*.js", "**/*.mjs", "**/*.cjs", "**/*.jsx"]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |           |      |
| TASK-011 | Add a unicorn rule override block immediately after the recommended config spread. Disable rules that conflict with existing config: `unicorn/filename-case: "off"` (conflicts with PascalCase React components), `unicorn/no-null: "off"` (null is used extensively), `unicorn/prevent-abbreviations: "off"` (conflicts with existing naming), `unicorn/no-array-reduce: "off"` (reduce is used in pipeline code), `unicorn/no-array-for-each: "off"` (forEach used in some patterns), `unicorn/prefer-module: "off"` (CJS config files exist), `unicorn/no-process-exit: "off"` (CLI apps use process.exit), `unicorn/prefer-top-level-await: "off"` (not all entry points support TLA), `unicorn/no-nested-ternary: "off"` (eslint core rule handles this) |           |      |
| TASK-012 | Add unicorn rule relaxations for test files (`**/*.test.ts`, `**/*.spec.ts`, `**/testing/**`): `unicorn/consistent-function-scoping: "off"`, `unicorn/no-useless-undefined: "off"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |           |      |
| TASK-013 | Add unicorn rule relaxations for JS config files (`**/*.js`, `**/*.mjs`, `**/*.cjs`): `unicorn/prefer-module: "off"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |           |      |
| TASK-014 | Run `nx run-many -t lint --all` to identify any new lint errors. Fix auto-fixable issues with `nx run-many -t lint --all --configuration=write`. Document remaining manual fixes needed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |           |      |
| TASK-015 | Add `eslint-plugin-unicorn` to the existing ESLint documentation section in `documentation/static-analysis-tools.md`, listing the enabled rules count, disabled rules with rationale, and version                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |           |      |

### Implementation Phase 3: Sherif (Monorepo Linter)

- GOAL-003: Add Sherif v1.10.0 as a zero-config monorepo structure linter to enforce consistent package.json conventions across all workspaces

| Task     | Description                                                                                                                                                                                                                                                                                                            | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-016 | Add Sherif configuration to root `package.json` `"sherif"` field: `{ "ignoreRule": ["root-package-private-field"], "ignoreDependency": ["@types/lodash"] }`. Ignore `root-package-private-field` since root is implicitly private via `pnpm-workspace.yaml`. Ignore `@types/lodash` if version mismatches are expected |           |      |
| TASK-017 | Add `sherif` Nx target to `nx.json` `targetDefaults`: `executor: "nx:run-commands"`, command `pnpm dlx sherif@1.10.0`, `cache: true`, inputs `["{workspaceRoot}/package.json", "{workspaceRoot}/pnpm-workspace.yaml", "{workspaceRoot}/**/package.json"]`                                                              |           |      |
| TASK-018 | Add Sherif as a matrix entry in `.github/workflows/code-analysis.yml`: `{ name: "🤠 Monorepo Lint (Sherif)", run: "pnpm dlx sherif@1.10.0", upload_artifacts: false }`                                                                                                                                                 |           |      |
| TASK-019 | Run `pnpm dlx sherif@1.10.0` locally to identify existing issues. Fix all errors (exit code 1) using `pnpm dlx sherif@1.10.0 --fix` where possible. Document any issues that require manual resolution                                                                                                                 |           |      |
| TASK-020 | Add `sherif` to `cspell.config.yaml` words list                                                                                                                                                                                                                                                                        |           |      |
| TASK-021 | Append Sherif documentation section to `documentation/static-analysis-tools.md` under "Security & Architecture" category, including rules enforced, configuration, and CI integration                                                                                                                                  |           |      |

### Implementation Phase 4: Syncpack (Dependency Version Consistency)

- GOAL-004: Add Syncpack v13.0.4 to enforce consistent dependency versions and semver range formats across all workspace packages

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-022 | Install `syncpack` as a root devDependency: `pnpm add -w -D syncpack@^13.0.4`                                                                                                                                                                                                                                                                                                                                                                                                 |           |      |
| TASK-023 | Create `.syncpackrc.json` configuration file at workspace root with: `{ "source": ["package.json", "applications/*/package.json", "packages/*/package.json", "tools/*/package.json"], "versionGroups": [{ "label": "Use workspace protocol for internal packages", "packages": ["**"], "dependencies": ["@monorepo/*"], "dependencyTypes": ["dev", "prod"], "pinVersion": "workspace:*" }], "semverGroups": [{ "range": "^", "dependencies": ["**"], "packages": ["**"] }] }` |           |      |
| TASK-024 | Add `syncpack-lint` Nx target to `nx.json` `targetDefaults`: `executor: "nx:run-commands"`, command `syncpack lint`, `cache: true`, inputs `["{workspaceRoot}/package.json", "{workspaceRoot}/**/package.json", "{workspaceRoot}/.syncpackrc.json"]`                                                                                                                                                                                                                          |           |      |
| TASK-025 | Add `syncpack-lint` as a matrix entry in `.github/workflows/code-analysis.yml`: `{ name: "📦 Syncpack Lint", run: "pnpm exec syncpack lint", upload_artifacts: false }`                                                                                                                                                                                                                                                                                                       |           |      |
| TASK-026 | Run `pnpm exec syncpack lint` locally to identify existing version mismatches. Fix issues using `pnpm exec syncpack fix-mismatches` and `pnpm exec syncpack set-semver-ranges`. Run `pnpm install` afterward to update lockfile                                                                                                                                                                                                                                               |           |      |
| TASK-027 | Add `syncpack`, `syncpackrc` to `cspell.config.yaml` words list                                                                                                                                                                                                                                                                                                                                                                                                               |           |      |
| TASK-028 | Append Syncpack documentation section to `documentation/static-analysis-tools.md` under "Security & Architecture" category, including configuration, commands (`lint`, `fix-mismatches`, `list-mismatches`, `set-semver-ranges`), and CI integration                                                                                                                                                                                                                          |           |      |

### Implementation Phase 5: Trivy (Container & IaC Security Scanning)

- GOAL-005: Add Trivy security scanning for the caelundas Docker image and Terraform IaC configurations in CI

| Task     | Description                                                                                                                                                                                                                                                                                            | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-029 | Create `.github/workflows/security-scan.yml` workflow: trigger on `push` to `main` and `pull_request`. Define two jobs: `trivy-docker` and `trivy-iac`                                                                                                                                                 |           |      |
| TASK-030 | `trivy-docker` job: use `actions/checkout@v4`, build the caelundas Docker image with `docker build -t caelundas:scan -f applications/caelundas/Dockerfile .`, then run `aquasecurity/trivy-action@master` with `image-ref: caelundas:scan`, `format: sarif`, `severity: CRITICAL,HIGH`, `exit-code: 1` |           |      |
| TASK-031 | `trivy-iac` job: use `actions/checkout@v4`, then run `aquasecurity/trivy-action@master` with `scan-type: config`, `scan-ref: infrastructure/terraform`, `format: table`, `severity: CRITICAL,HIGH`, `exit-code: 1`                                                                                     |           |      |
| TASK-032 | Create `.trivyignore` file at workspace root for known false positives (initially empty with header comment)                                                                                                                                                                                           |           |      |
| TASK-033 | Add `trivy`, `trivyignore`, `iac` to `cspell.config.yaml` words list                                                                                                                                                                                                                                   |           |      |
| TASK-034 | Append Trivy documentation section to `documentation/static-analysis-tools.md` under "Security & Architecture" category, including scan types (Docker image, IaC), severity levels, CI workflow, and `.trivyignore` usage                                                                              |           |      |

### Implementation Phase 6: Stylelint (CSS/Tailwind Linting)

- GOAL-006: Add Stylelint v17.3.0 with Tailwind CSS support to the lexico application for CSS linting

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                        | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-035 | Install Stylelint and plugins in the lexico application: `pnpm add --filter lexico -D stylelint@^17.3.0 stylelint-config-standard@^38.0.0 stylelint-config-tailwindcss@^1.0.0`                                                                                                                                                                                                                                                     |           |      |
| TASK-036 | Create `applications/lexico/.stylelintrc.json` configuration: `{ "extends": ["stylelint-config-standard", "stylelint-config-tailwindcss"], "rules": { "at-rule-no-unknown": [true, { "ignoreAtRules": ["tailwind", "apply", "layer", "config", "screen", "variants", "responsive", "utility"] }], "selector-class-pattern": null, "custom-property-pattern": null, "declaration-block-no-redundant-longhand-properties": null } }` |           |      |
| TASK-037 | Add `stylelint` target to `applications/lexico/project.json`: `{ "stylelint": { "executor": "nx:run-commands", "options": { "command": "stylelint 'src/**/*.css'", "cwd": "{projectRoot}" }, "cache": true, "inputs": ["{projectRoot}/src/**/*.css", "{projectRoot}/.stylelintrc.json"], "configurations": { "check": {}, "write": { "command": "stylelint --fix 'src/**/*.css'" } }, "defaultConfiguration": "check" } }`         |           |      |
| TASK-038 | Add Stylelint as a matrix entry in `.github/workflows/code-analysis.yml`: `{ name: "🎨 Stylelint", run: "npx nx run lexico:stylelint", upload_artifacts: false }`                                                                                                                                                                                                                                                                  |           |      |
| TASK-039 | Update `.lintstagedrc.ts` to add a CSS file pattern: `"*.css": (files) => { const relativePaths = files.map((file) => relative(process.cwd(), file)).join(","); return [\`nx affected --target=stylelint --files=\${relativePaths}\`]; }`                                                                                                                                                                                          |           |      |
| TASK-040 | Run `nx run lexico:stylelint` locally to identify existing CSS issues. Fix auto-fixable issues with `nx run lexico:stylelint --configuration=write`                                                                                                                                                                                                                                                                                |           |      |
| TASK-041 | Add `stylelint`, `stylelintrc` to `cspell.config.yaml` words list                                                                                                                                                                                                                                                                                                                                                                  |           |      |
| TASK-042 | Append Stylelint documentation section to `documentation/static-analysis-tools.md` under "Foundation" category alongside ESLint and Prettier, covering Tailwind integration, configuration, and lexico-specific scope                                                                                                                                                                                                              |           |      |

### Implementation Phase 7: Integration & Validation

- GOAL-007: Validate all tools work together, update cross-cutting documentation, and ensure CI pipeline passes

| Task     | Description                                                                                                                                                                                                     | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-043 | Update `documentation/static-analysis-tools.md` Overview section to reflect new tool count: Foundation (5 tools, adding Stylelint), Security & Architecture (6 tools, adding Gitleaks, Sherif, Syncpack, Trivy) |           |      |
| TASK-044 | Update `AGENTS.md` to mention new tools in the "Common Gotchas" or relevant sections: Gitleaks for secret scanning, eslint-plugin-unicorn rule overrides, Sherif for monorepo hygiene                           |           |      |
| TASK-045 | Run full CI pipeline locally: `nx run-many -t lint,typecheck,format,spell-check,markdown-lint --all --configuration=check` to verify no regressions                                                             |           |      |
| TASK-046 | Run `pnpm dlx sherif@1.10.0` and `pnpm exec syncpack lint` to verify monorepo consistency after all changes                                                                                                     |           |      |
| TASK-047 | Test pre-commit hook by staging a test file and running `pnpm exec lint-staged --no-stash` to verify new Stylelint/CSS integration                                                                              |           |      |
| TASK-048 | Test pre-push hook by verifying `gitleaks git --staged --verbose --redact --exit-code 1` runs successfully                                                                                                      |           |      |

## 3. Alternatives

- **ALT-001**: **Oxlint instead of eslint-plugin-unicorn** — Oxlint is a Rust-based linter that's 50-100x faster than ESLint but has limited rule coverage (400 rules vs ESLint ecosystem's thousands). It cannot replace ESLint's TypeScript type-checked rules. Deferred to a future evaluation when Oxlint supports plugins and flat config integration.
- **ALT-002**: **Biome instead of ESLint + Prettier** — Biome is an all-in-one formatter and linter written in Rust. While significantly faster, it lacks support for many ESLint plugins (jsdoc, jsx-a11y, tsdoc, import ordering, Nx module boundaries, YAML, Markdown, JSON). Not viable as a full replacement today.
- **ALT-003**: **GitHub Advanced Security secret scanning instead of Gitleaks** — GitHub's built-in secret scanning is limited to known provider patterns and requires GitHub Enterprise or public repos. Gitleaks provides custom rules, pre-commit support, and works in any environment.
- **ALT-004**: **Manypkg instead of Sherif** — Manypkg is a similar monorepo linter but is JavaScript-based and slower. Sherif is written in Rust, requires zero configuration, and has a simpler rule set.
- **ALT-005**: **Custom ESLint rules instead of Sherif** — Writing custom ESLint rules for package.json validation would add maintenance burden. Sherif is purpose-built, battle-tested, and zero-config.
- **ALT-006**: **postcss-lint instead of Stylelint** — PostCSS doesn't have a dedicated linting tool. Stylelint is the de facto standard for CSS linting with 100+ built-in rules and Tailwind CSS support via `stylelint-config-tailwindcss`.

## 4. Dependencies

- **DEP-001**: `eslint-plugin-unicorn@^63.0.0` — npm package, ESLint >= 9.20.0 required (satisfied: 9.39.1)
- **DEP-002**: `syncpack@^13.0.4` — npm package, Node.js >= 18 required (satisfied: 22.20.0)
- **DEP-003**: `stylelint@^17.3.0` — npm package for CSS linting
- **DEP-004**: `stylelint-config-standard@^38.0.0` — Stylelint shared config with sensible defaults
- **DEP-005**: `stylelint-config-tailwindcss@^1.0.0` — Stylelint config for Tailwind CSS `@apply`, `@tailwind`, `@layer` support
- **DEP-006**: Gitleaks binary v8.24.2+ — installed via `gitleaks/gitleaks-action@v2` in CI, locally via Homebrew/binary download or `pnpm dlx`
- **DEP-007**: Sherif binary v1.10.0 — distributed via npm as platform-specific binaries, invoked via `pnpm dlx sherif@1.10.0`
- **DEP-008**: Trivy — used exclusively via `aquasecurity/trivy-action@master` GitHub Action (no local install required for core workflow)
- **DEP-009**: `.github/actions/setup-monorepo` — existing composite action used by all CI workflows for checkout + pnpm install + Nx setup

## 5. Files

- **FILE-001**: `.gitleaks.toml` — New file. Gitleaks configuration extending default rules with monorepo-specific allowlists
- **FILE-002**: `.gitleaksignore` — New file. Fingerprint-based false positive ignores for Gitleaks
- **FILE-003**: `.github/workflows/gitleaks.yml` — New file. GitHub Actions workflow for Gitleaks secret scanning
- **FILE-004**: `.github/workflows/security-scan.yml` — New file. GitHub Actions workflow for Trivy Docker image and IaC scanning
- **FILE-005**: `.trivyignore` — New file. CVE-based false positive ignores for Trivy
- **FILE-006**: `.syncpackrc.json` — New file. Syncpack configuration for version consistency rules
- **FILE-007**: `applications/lexico/.stylelintrc.json` — New file. Stylelint configuration with Tailwind CSS support
- **FILE-008**: `eslint.config.base.ts` — Modified. Add `eslint-plugin-unicorn` import, recommended config spread, and rule overrides
- **FILE-009**: `nx.json` — Modified. Add `gitleaks`, `sherif`, `syncpack-lint` target defaults
- **FILE-010**: `package.json` (root) — Modified. Add `eslint-plugin-unicorn`, `syncpack` to devDependencies; add `sherif` config field
- **FILE-011**: `applications/lexico/package.json` — Modified. Add `stylelint`, `stylelint-config-standard`, `stylelint-config-tailwindcss` to devDependencies
- **FILE-012**: `applications/lexico/project.json` — Modified. Add `stylelint` target
- **FILE-013**: `.github/workflows/code-analysis.yml` — Modified. Add Sherif, Syncpack, and Stylelint matrix entries
- **FILE-014**: `.husky/pre-push` — Modified. Add Gitleaks pre-push scan command
- **FILE-015**: `.lintstagedrc.ts` — Modified. Add `*.css` pattern for Stylelint pre-commit integration
- **FILE-016**: `cspell.config.yaml` — Modified. Add tool-specific words (gitleaks, gitleaksignore, sherif, syncpack, syncpackrc, stylelint, stylelintrc, trivy, trivyignore, iac)
- **FILE-017**: `documentation/static-analysis-tools.md` — Modified. Append documentation sections for all six new tools
- **FILE-018**: `AGENTS.md` — Modified. Add mentions of new tools in relevant sections

## 6. Testing

- **TEST-001**: Run `gitleaks dir .` from workspace root — verify exit code 0 (no secrets found in current codebase)
- **TEST-002**: Create a temporary file with a fake API key pattern, verify `gitleaks dir .` detects it (exit code 1), then remove the file
- **TEST-003**: Run `nx run-many -t lint --all` — verify eslint-plugin-unicorn rules apply and no unexpected errors after disabling conflicting rules
- **TEST-004**: Run `pnpm dlx sherif@1.10.0` — verify exit code 0 after fixing any initial issues
- **TEST-005**: Run `pnpm exec syncpack lint` — verify exit code 0 after fixing version mismatches
- **TEST-006**: Run `nx run lexico:stylelint` — verify CSS files pass Stylelint checks
- **TEST-007**: Verify CI pipeline passes by pushing changes and checking all GitHub Actions workflow runs
- **TEST-008**: Run `pnpm exec lint-staged --no-stash` with a staged `.css` file — verify Stylelint runs in pre-commit
- **TEST-009**: Run the updated `.husky/pre-push` hook — verify Gitleaks scans staged changes and `validate-branch-name` still runs
- **TEST-010**: Run `nx run-many -t typecheck --all` — verify no TypeScript errors introduced by new dependencies or config changes

## 7. Risks & Assumptions

- **RISK-001**: `eslint-plugin-unicorn` recommended preset may produce a large number of initial lint errors across the codebase. Mitigation: use `--fix` for auto-fixable errors and selectively disable rules that would require extensive manual refactoring.
- **RISK-002**: Gitleaks may flag false positives in test fixtures, documentation, or example code. Mitigation: use `.gitleaksignore` fingerprints and `[[allowlists]]` in `.gitleaks.toml` configuration.
- **RISK-003**: Sherif may report issues with the root `package.json` having `dependencies` instead of only `devDependencies`. Mitigation: The root package.json currently has `@types/lodash`, `jiti`, `json5`, `lodash`, `tslib` in `dependencies` — evaluate moving them to `devDependencies` since root is private.
- **RISK-004**: Syncpack may flag intentional version mismatches between root and application dependencies (e.g., `typescript` exact version in root vs `^5.0.0` in apps). Mitigation: use `versionGroups` and `semverGroups` configuration to define expected patterns.
- **RISK-005**: Trivy Docker scanning adds ~2-5 minutes to CI. Mitigation: run in a separate workflow (`security-scan.yml`) that only triggers on Docker/Terraform file changes using path filters.
- **RISK-006**: Stylelint `stylelint-config-tailwindcss` may not support all Tailwind v3 directives. Mitigation: add unknown at-rules to `ignoreAtRules` list in config as needed.
- **ASSUMPTION-001**: The monorepo is a personal GitHub account repository (not organization), so `GITLEAKS_LICENSE` is not required for the GitHub Action.
- **ASSUMPTION-002**: Gitleaks CLI binary is available in the dev container via Homebrew or direct download. If not, pre-push Gitleaks scan uses `pnpm dlx` to download on demand.
- **ASSUMPTION-003**: All existing CI workflows can accommodate additional matrix entries without exceeding GitHub Actions timeout limits.
- **ASSUMPTION-004**: The lexico application's CSS files are in `applications/lexico/src/**/*.css` glob path.

## 8. Related Specifications / Further Reading

- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [Gitleaks GitHub Action](https://github.com/gitleaks/gitleaks-action)
- [eslint-plugin-unicorn Documentation](https://github.com/sindresorhus/eslint-plugin-unicorn)
- [Sherif Documentation](https://github.com/QuiiBz/sherif)
- [Syncpack Documentation](https://jamiemason.github.io/syncpack/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Trivy GitHub Action](https://github.com/aquasecurity/trivy-action)
- [Stylelint Documentation](https://stylelint.io/)
- [stylelint-config-tailwindcss](https://github.com/zhilidali/stylelint-config-tailwindcss)
- [Existing static-analysis-tools.md](../static-analysis-tools.md)
- [Existing eslint.config.base.ts](../../eslint.config.base.ts)
- [Existing nx.json](../../nx.json)
- [Existing code-analysis.yml](../../.github/workflows/code-analysis.yml)
