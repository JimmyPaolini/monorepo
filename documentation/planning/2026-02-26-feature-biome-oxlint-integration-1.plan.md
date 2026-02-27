---
name: Biome & Oxlint Integration
description: Add Biome and Oxlint as supplementary tools alongside existing ESLint and Prettier, with no significant changes to existing tool configurations
created: 2026-02-26
updated: 2026-02-26
status: "Completed"
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-green)

Add **Oxlint** and **Biome** as supplementary tools alongside the existing ESLint, Prettier, and Stylelint setup. Oxlint provides a fast first-pass linter (covering ~600+ overlapping rules at 50–100× speed) running before ESLint. Biome provides a supplementary format checker and linter running as its own Nx target (`biome`). **ESLint, Prettier, and Stylelint remain completely unchanged in behavior and configuration.**

## Deviations from Original Plan

1. **`eslint-plugin-oxlint` removed** — Originally planned to add this plugin to disable overlapping ESLint rules (TASK-003, REQ-003). Removed per user preference: ESLint should remain the authoritative linter with all rules enabled. Both tools run independently as separate Nx targets. The package was uninstalled.
2. **`@oxlint/migrate` uninstalled** — One-time setup tool removed after config generation to keep dependencies clean.
3. **JSONC config format** — Config files are `.oxlintrc.jsonc` and `biome.jsonc` (not `.json`) per user request for inline documentation support.
4. **`unicorn/consistent-function-scoping` disabled** — Rule removed per user preference (conflicts with React render helper pattern).
5. **Biome v2 schema changes** — `files.ignore` → `files.includes` with `!` negation patterns; `--config-path` accepts directory only; auto-discovers config from cwd.
6. **Duplicate diagnostics accepted** — Without `eslint-plugin-oxlint`, both tools report overlapping rules. This is acceptable since they run as separate Nx targets.

## 1. Requirements & Constraints

- **REQ-001**: Add Oxlint as a new Nx `oxlint` target for all projects, running before ESLint in the `code-analysis` composite target
- **REQ-002**: Add Biome as a new Nx `biome-check` target running supplementary format checking and linting alongside the existing `format` (Prettier) and `lint` (ESLint) targets — Prettier and ESLint remain the primary tools and are not modified
- **REQ-003**: Disable ESLint rules already covered by Oxlint using `eslint-plugin-oxlint` to avoid duplicate diagnostics and speed up ESLint
- **REQ-004**: Configure Biome formatter to match current Prettier settings exactly (double quotes, semicolons, 80 char width, 2-space indent, trailing commas, LF, `singleAttributePerLine`) so its format check does not conflict with Prettier output
- **REQ-005**: Generate `.oxlintrc.json` from existing `eslint.config.base.ts` using `@oxlint/migrate`
- **REQ-006**: Integrate both tools into `lint-staged.config.ts` pre-commit hooks
- **REQ-007**: Integrate both tools into CI via `code-analysis` composite targets
- **SEC-001**: No secrets or credentials may be stored in any new config files
- **CON-001**: ESLint flat config format must be preserved — no legacy `.eslintrc` files
- **CON-002**: `eslint-config-prettier` must remain last in the ESLint config array (still needed for any ESLint formatting rules that remain)
- **CON-003**: All tasks must run through Nx (`nx run`) — never invoke tools directly
- **CON-004**: Existing ESLint rules, plugins, and behavior must not change beyond what `eslint-plugin-oxlint` disables (overlapping rules only)
- **CON-005**: Existing Prettier config and `format` Nx target remain fully unchanged — Prettier continues to format all file types it currently handles. Biome runs as a separate supplementary target only
- **CON-006**: `--no-verify` must never be used to bypass git hooks
- **CON-007**: Shadcn components in `packages/lexico-components/src/components/ui/` must be ignored by both Biome and Oxlint
- **CON-008**: Stylelint remains unchanged for CSS linting
- **CON-009**: Current config takes precedence when Biome/Oxlint defaults conflict with existing rules
- **GUD-001**: Follow the established `executor: "nx:run-commands"`, `cache: true`, `inputs`, `configurations.check`/`configurations.write` pattern for new targets
- **GUD-002**: New config files should include documentation comments explaining purpose and settings (following the "Tool documentation lives in config file comments" convention)
- **GUD-003**: Add new tool names to `cspell.config.yaml` if they trigger spelling errors
- **PAT-001**: Nx `targetDefaults` in `nx.json` for shared target configuration across projects
- **PAT-002**: Root-level config files inherited by all projects (like `eslint.config.base.ts` pattern)
- **PAT-003**: `code-analysis` composite target pattern — each project lists its checks as commands

## 2. Implementation Steps

### Implementation Phase 1 — Oxlint Integration

- GOAL-001: Add Oxlint as a fast first-pass linter running alongside ESLint, with `eslint-plugin-oxlint` disabling overlapping ESLint rules

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Install dependencies: `pnpm add -wD oxlint eslint-plugin-oxlint @oxlint/migrate`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | ✅        | 2026-02-26 |
| TASK-002 | Generate Oxlint config from existing ESLint config: run `npx @oxlint/migrate` at workspace root to produce `.oxlintrc.json`. Review output and manually adjust to match current ESLint rule severity and intent. Ensure rules map correctly to Oxlint equivalents (core, typescript, unicorn, react, react-hooks, jsx-a11y, import, jsdoc categories). Set `"ignorePatterns"` to match ESLint global ignores: `["dist", "node_modules", "coverage", ".nx", "packages/lexico-components/src/components/ui", "pnpm-lock.yaml", "infrastructure/helm/**/templates", "infrastructure/terraform/.terraform"]` | ✅        | 2026-02-26 |
| TASK-003 | **DEVIATED** — `eslint-plugin-oxlint` was added then removed per user preference. ESLint retains all rules; both tools run independently as separate Nx targets.                                                                                                                                                                                                                                                                                                                                                                                                                                         | ✅        | 2026-02-26 |
| TASK-004 | Add `oxlint` target to `nx.json` `targetDefaults` following the established pattern: `executor: "nx:run-commands"`, `cache: true`, `configurations.check` (default, no fix), `configurations.write` (with `--fix`), `inputs` including `"{workspaceRoot}/.oxlintrc.jsonc"` and source file globs. Command: `oxlint {projectRoot}/src --config=.oxlintrc.jsonc`                                                                                                                                                                                                                                           | ✅        | 2026-02-26 |
| TASK-005 | Add `oxlint` target reference (`"oxlint": {}`) to each project's `project.json`: `applications/caelundas/project.json`, `applications/lexico/project.json`, `packages/lexico-components/project.json`, `tools/code-generator/project.json`                                                                                                                                                                                                                                                                                                                                                               | ✅        | 2026-02-26 |
| TASK-006 | Add `oxlint` to the `code-analysis` composite target in each project's `project.json`, inserting `"nx run <project>:oxlint:{args.configuration}"` immediately **before** the existing `lint` command (so Oxlint runs first as the fast pass). Affected files: root `project.json`, `applications/caelundas/project.json`, `applications/lexico/project.json`, `packages/lexico-components/project.json`, `tools/code-generator/project.json`                                                                                                                                                             | ✅        | 2026-02-26 |
| TASK-007 | Update root `project.json` `lint` target to also include `oxlint` in its commands. Add a root-level `oxlint` target with command: `oxlint --config=.oxlintrc.jsonc '*.ts' '*.js' 'scripts/' 'documentation/' 'infrastructure/' --ignore-pattern='infrastructure/helm/**/templates'`                                                                                                                                                                                                                                                                                                                      | ✅        | 2026-02-26 |
| TASK-008 | Update `lint-staged.config.ts` to add `oxlint` and `biome-check` to the `--target=` list for `*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}` files: change `format,lint,typecheck,spell-check` to `format,oxlint,biome-check,lint,typecheck,spell-check`                                                                                                                                                                                                                                                                                                                                                             | ✅        | 2026-02-26 |
| TASK-009 | Run `nx run-many --target=oxlint --all` and fix any new linting errors reported by Oxlint that were not caught by ESLint. Fixed: merged duplicate imports in 3 caelundas files, added `--ignore-pattern='**/files/**'` for code-generator EJS templates, added `**/routeTree.gen.ts` to ignorePatterns.                                                                                                                                                                                                                                                                                                  | ✅        | 2026-02-26 |
| TASK-010 | Run `nx run-many --target=lint --all` to verify ESLint still passes (no `eslint-plugin-oxlint` — ESLint retains all rules). Confirmed no regressions.                                                                                                                                                                                                                                                                                                                                                                                                                                                    | ✅        | 2026-02-26 |

### Implementation Phase 2 — Biome Supplementary Check Integration

- GOAL-002: Add Biome as a supplementary `biome-check` Nx target that runs format checking and Biome-specific lint rules alongside the existing unchanged Prettier and ESLint targets

| Task     | Description                                                                                                                                                                                                                  | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-011 | Install Biome: `pnpm add -wD @biomejs/biome`                                                                                                                                                                                 | ✅        | 2026-02-26 |
| TASK-012 | Create `biome.jsonc` with formatter settings matching Prettier config exactly. Biome v2 auto-discovers this file from the working directory.                                                                                 | ✅        | 2026-02-26 |
| TASK-013 | Refine `biome.jsonc`: formatter matches `prettier.config.ts`, linter enabled for Biome-exclusive rules only, all overlapping rules disabled, assist/imports disabled. Includes comprehensive inline documentation.           | ✅        | 2026-02-26 |
| TASK-014 | Add `biome-check` target to `nx.json` `targetDefaults` with `cache: true`, `configurations.check`/`configurations.write`, `inputs` including `"{workspaceRoot}/biome.jsonc"`.                                                | ✅        | 2026-02-26 |
| TASK-015 | Add `biome-check` target reference to each project's `project.json` (all 4 projects).                                                                                                                                        | ✅        | 2026-02-26 |
| TASK-016 | Add `biome-check` to the `code-analysis` composite target in each project's `project.json`, after `format`.                                                                                                                  | ✅        | 2026-02-26 |
| TASK-017 | Add root-level `biome-check` target in root `project.json`. Uses auto-discovery (no `--config-path`).                                                                                                                        | ✅        | 2026-02-26 |
| TASK-018 | Run `nx run-many --target=biome-check --all` — fixed minor Biome-vs-Prettier formatting differences with `--write`, added `routeTree.gen.ts` and code-generator template dirs to `biome.jsonc` ignores. All 5 projects pass. | ✅        | 2026-02-26 |

### Implementation Phase 3 — Cleanup & Documentation

- GOAL-003: Finalize integration, update documentation, ensure CI passes, and add cspell dictionary entries

| Task     | Description                                                                                                                                                                                                                                           | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-019 | Add `biome`, `oxlint`, `biomejs`, `oxlintrc`, `oxfmt` to `cspell.config.yaml` words list to prevent spelling check failures                                                                                                                           | ✅        | 2026-02-26 |
| TASK-020 | Update `knip.config.ts`: add `oxlint` and `biome` to `ignoreBinaries`. `eslint-plugin-oxlint` and `@oxlint/migrate` removed from `ignoreDependencies` (packages uninstalled).                                                                         | ✅        | 2026-02-26 |
| TASK-021 | Update root `AGENTS.md` and all 5 mirror files (CLAUDE.md, .clinerules, .cursorrules, .windsurfrules, .claude/instructions.md). Added Oxlint and Biome descriptions, updated config filenames to `.jsonc`, removed `eslint-plugin-oxlint` references. | ✅        | 2026-02-26 |
| TASK-022 | Run full CI validation: `nx run-many --target=code-analysis --all` — all 5 projects pass (caelundas, lexico, lexico-components, code-generator, monorepo). Fixed knip false positives by uninstalling unused deps.                                    | ✅        | 2026-02-26 |
| TASK-023 | **DEVIATED** — Duplicate diagnostics verified and accepted by design. Without `eslint-plugin-oxlint`, both tools report overlapping rules independently. Acceptable since they run as separate Nx targets.                                            | ✅        | 2026-02-26 |
| TASK-024 | Verify pre-commit hooks: `lint-staged` dry run confirmed `format,oxlint,biome-check,lint,typecheck,spell-check` targets all execute successfully.                                                                                                     | ✅        | 2026-02-26 |

## 3. Alternatives

- **ALT-001**: **Oxlint only (no Biome)** — Add Oxlint for fast linting but skip Biome entirely. Simpler scope but misses the supplementary format checking and Biome-exclusive lint rules. Rejected because the user explicitly requested both tools.
- **ALT-002**: **Biome only (no Oxlint)** — Use Biome for supplementary linting and format checking without Oxlint. Rejected because Oxlint has broader ESLint rule coverage (695+ rules vs. Biome's smaller set) and provides the largest linting speed improvement.
- **ALT-003**: **Replace ESLint with Oxlint** — Remove ESLint entirely and use only Oxlint + Biome. Rejected because critical ESLint plugins have no equivalent: `@nx/eslint-plugin` (module boundaries), `eslint-plugin-tsdoc`, `eslint-plugin-jsdoc`, `eslint-plugin-jsonc`, `eslint-plugin-yml`, `@eslint/markdown`. Also rejected because the user explicitly wants existing tools preserved.
- **ALT-004**: **Replace Prettier with Biome formatter** — Use Biome as the primary formatter instead of Prettier, modifying the `format` Nx target. Rejected because the user wants existing tools (including Prettier) to remain unchanged. Biome runs as a supplementary check only.
- **ALT-005**: **Oxfmt instead of Biome for formatting** — Use Oxlint's companion formatter (Oxfmt, beta since 2026-02-24). Rejected because Oxfmt is 2 days old and still beta, while Biome's formatter is mature and stable.
- **ALT-006**: **Biome with linter disabled** — Use Biome purely as a format checker with no lint rules. Rejected because Biome has some exclusive lint rules not covered by ESLint or Oxlint that provide additional value at minimal cost.

## 4. Dependencies

- **DEP-001**: `oxlint` — Rust-based linter binary (npm package wraps platform-specific binaries). Installed as workspace root devDependency.
- **DEP-002**: ~~`eslint-plugin-oxlint`~~ — **Removed**: Uninstalled per user preference for ESLint to retain all rules.
- **DEP-003**: ~~`@oxlint/migrate`~~ — **Removed**: One-time setup tool, uninstalled after generating `.oxlintrc.jsonc`.
- **DEP-004**: `@biomejs/biome` — Rust-based supplementary format checker and linter. Installed as workspace root devDependency.
- **DEP-005**: Existing `eslint@^9.39.3` — Fully retained and unchanged (primary linter).
- **DEP-006**: Existing `prettier@^3.8.1` — Fully retained and unchanged (primary formatter).
- **DEP-007**: Existing `eslint-config-prettier@^10.1.8` — Retained as last ESLint config entry.
- **DEP-008**: Existing `stylelint@^17.4.0` — Retained unchanged for CSS linting.

## 5. Files

- **FILE-001**: `biome.jsonc` (new) — Biome configuration file at workspace root (JSONC for inline documentation). Formatter settings match Prettier config exactly. Linter enabled for Biome-exclusive rules only. Import organization disabled.
- **FILE-002**: `.oxlintrc.jsonc` (new) — Oxlint configuration file at workspace root (JSONC for inline documentation). Generated from ESLint config via `@oxlint/migrate`, manually refined. 13 override blocks with comprehensive inline docs.
- **FILE-003**: `eslint.config.base.ts` (unchanged) — `eslint-plugin-oxlint` was NOT added per user preference. ESLint retains all rules.
- **FILE-004**: `nx.json` (modified) — Add `oxlint` and `biome-check` targets to `targetDefaults`. No changes to existing `lint` or `format` targets.
- **FILE-005**: `project.json` (root, modified) — Add `oxlint` and `biome-check` targets. Add both to `code-analysis` composite.
- **FILE-006**: `applications/caelundas/project.json` (modified) — Add `"oxlint": {}` and `"biome-check": {}` targets, add both to `code-analysis`.
- **FILE-007**: `applications/lexico/project.json` (modified) — Add `"oxlint": {}` and `"biome-check": {}` targets, add both to `code-analysis`.
- **FILE-008**: `packages/lexico-components/project.json` (modified) — Add `"oxlint": {}` and `"biome-check": {}` targets, add both to `code-analysis`.
- **FILE-009**: `tools/code-generator/project.json` (modified) — Custom `oxlint` target with `--ignore-pattern='**/files/**'` for EJS templates. `"biome-check": {}` inherits defaults.
- **FILE-010**: `package.json` (modified) — Add `oxlint` and `@biomejs/biome` to `devDependencies`. `eslint-plugin-oxlint` and `@oxlint/migrate` were added then removed.
- **FILE-011**: `lint-staged.config.ts` (modified) — Add `oxlint` and `biome-check` to `--target=` list.
- **FILE-012**: `cspell.config.yaml` (modified) — Add `biome`, `oxlint`, `biomejs`, `oxlintrc`, `oxfmt` to words list.
- **FILE-013**: `knip.config.ts` (modified) — Add `oxlint` and `biome` to `ignoreBinaries`.
- **FILE-014**: `AGENTS.md` and all mirror files (modified) — Add Biome and Oxlint to Static Analysis Tools section.

**Files NOT modified** (existing tools remain as-is):

- `prettier.config.ts` — No changes
- `.prettierignore` — No changes
- `nx.json` `format` target — No changes
- `nx.json` `lint` target — No changes (ESLint retains all rules; `eslint-plugin-oxlint` was not added)
- `stylelint` configuration — No changes

## 6. Testing

- **TEST-001**: Run `nx run-many --target=oxlint --all` — all 5 projects pass ✅
- **TEST-002**: Run `nx run-many --target=lint --all` — all 5 projects pass ESLint, no regressions ✅
- **TEST-003**: Run `nx run-many --target=biome-check --all` — all 5 projects pass (minor format fixes applied with `--write`) ✅
- **TEST-004**: Run `nx run-many --target=format:check --all` — Prettier formatting still passes ✅
- **TEST-005**: Run `nx run-many --target=code-analysis --all` — all 5 projects pass full suite ✅
- **TEST-006**: Run `nx run-many --target=test --all` — not run (no runtime behavior changes)
- **TEST-007**: Pre-commit hook verified: `lint-staged` runs `format,oxlint,biome-check,lint,typecheck,spell-check` successfully ✅
- **TEST-008**: Duplicate diagnostics verified: both tools report overlapping rules (by design — `eslint-plugin-oxlint` was removed per user preference) ✅
- **TEST-009**: Run `nx run monorepo:spell-check` — no spelling errors from new tool names ✅
- **TEST-010**: Run `nx run monorepo:knip:check` — passes after removing unused deps ✅

## 7. Risks & Assumptions

- **RISK-001**: **Biome format check disagreements with Prettier** — **Outcome: Minor differences found and resolved.** Biome flagged a few files with formatting differences (trailing commas, attribute line breaks). Fixed with `biome check --write`, then verified Prettier still agrees. Biome config matches Prettier output for this codebase.
- **RISK-002**: **Oxlint rule behavior differences** — **Outcome: Minor differences found and resolved.** Oxlint flagged duplicate imports in 3 caelundas files that ESLint did not catch. Fixed by merging imports. No false positives after config refinement.
- **RISK-003**: **eslint-plugin-oxlint over-disabling** — **Outcome: N/A.** Plugin was removed per user preference. Both tools run independently with accepted duplicate diagnostics.
- **RISK-004**: **CI pipeline time** — **Outcome: Acceptable.** Oxlint runs in under 1 second per project. Net CI time increase is minimal since oxlint and biome-check add ~2 seconds total.
- **RISK-005**: **@oxlint/migrate config quality** — **Outcome: Good.** Generated config required manual refinement (13 override blocks) but mapped rules correctly. `@oxlint/migrate` was uninstalled after one-time use.
- **ASSUMPTION-001**: Biome v2 format check compatible with Prettier — **Validated ✅** (v2.4.4, using `files.includes` with `!` negation patterns).
- **ASSUMPTION-002**: `eslint-plugin-oxlint` supports ESLint v9 flat config — **Validated ✅** then removed per user preference.
- **ASSUMPTION-003**: Oxlint binary runs on Linux/Debian dev container — **Validated ✅** (v1.50.0).
- **ASSUMPTION-004**: Phased approach allows independent commits — **Validated ✅** (all phases completed in single session).
- **ASSUMPTION-005**: Existing tools produce no errors before this work — **Validated ✅** (confirmed all tools passed before integration).

## 8. Related Specifications / Further Reading

- [Oxlint Documentation — Overview](https://oxc.rs/docs/guide/usage/linter)
- [Oxlint Configuration File Reference](https://oxc.rs/docs/guide/usage/linter/config-file-reference)
- [Oxlint — Migrate from ESLint](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint)
- [eslint-plugin-oxlint — npm](https://www.npmjs.com/package/eslint-plugin-oxlint)
- [Biome — Getting Started](https://biomejs.dev/guides/getting-started/)
- [Biome — Migrate from ESLint & Prettier](https://biomejs.dev/guides/migrate-eslint-prettier/)
- [Biome — Big Projects / Monorepos](https://biomejs.dev/guides/big-projects/)
- [Biome — Differences with Prettier](https://biomejs.dev/formatter/differences-with-prettier/)
- [Biome — Configuration Reference](https://biomejs.dev/reference/configuration/)
- [Previous plan: Static Analysis Tools Expansion 1](documentation/planning/2026-02-25-feature-static-analysis-tools-expansion-1.plan.md) — ALT-001 (Oxlint) and ALT-002 (Biome) rejection rationale (now superseded by this plan)
- [Previous plan: Static Analysis Tools Implementation](documentation/planning/static-analysis-tools-implementation.md) — First wave of static analysis tools (completed)
