---
name: Jscpd Duplicate Detection Integration Plan
description: Add jscpd alongside fallow and wire it into Nx clean targets, analyze-code workflows, and duplicate-detection checks.
created: 2026-07-22T03:20:52Z
updated: 2026-07-22T03:20:52Z
status: 'Planned'
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan adds `jscpd` as a second duplicate-detection tool in the monorepo without replacing `fallow`. The rollout uses a dedicated root `jscpd` configuration, preserves existing `fallow` duplicate gates, integrates `jscpd` into existing Nx `clean` and `analyze-code` compositions, and extends downstream checks so duplicate detection remains visible in local development and CI.

## 1. Requirements & Constraints

- **REQ-001**: Add `jscpd` as a root workspace `devDependency` using the repository catalog policy: `/package.json` must reference `"jscpd": "catalog:"`, `/pnpm-workspace.yaml` must define the pinned version, and `/pnpm-lock.yaml` must be updated.
- **REQ-002**: Create a dedicated repository-level `jscpd` config at `/configuration/jscpd.config.json` and invoke it explicitly with `--config configuration/jscpd.config.json` from every Nx target.
- **REQ-003**: Keep `fallow` duplicate detection active and unchanged as an independent signal; `jscpd` must be added alongside `fallow`, not replace `fallow`, its baseline, or its CI/reporting behavior.
- **REQ-004**: Incorporate `jscpd` into existing Nx `clean` target composition for TypeScript projects in `/nx.json` and for the root `monorepo` project in `/project.json`.
- **REQ-005**: Incorporate `jscpd` into existing root `analyze-code` target composition in `/project.json` so `pnpm exec nx affected --target=analyze-code --configuration=check` includes `jscpd` when the `monorepo` project is affected.
- **REQ-006**: Provide both full-repository duplicate detection and project-scoped duplicate detection so downstream Nx workflows can keep using existing `clean`/`affected` patterns without losing a full-scan option.
- **REQ-007**: Make `jscpd` findings available to downstream tooling and checks, including `/configuration/lint-staged.config.ts` and `/.github/workflows/analyze-code.yml`.
- **REQ-008**: Emit machine-readable `jscpd` output for CI artifact collection using a deterministic output directory under the workspace root, such as `dist/reports/jscpd/`.
- **SEC-001**: Do not introduce any network-dependent services, remote uploads, or secrets; all `jscpd` execution must remain local CLI execution through Nx.
- **SEC-002**: Treat report artifacts as disposable build outputs only; no committed baselines, generated HTML, or JSON report files may be written into tracked source directories.
- **CON-001**: The monorepo is Nx-first; all developer and CI entrypoints must continue to use `nx run`, `nx run-many`, or `nx affected` instead of ad-hoc direct `jscpd` invocations.
- **CON-002**: Current `fallow` duplicate scope excludes tests, generated files, lockfiles, and several application/data paths; `jscpd` must start from the same exclusion intent unless an explicit mismatch is documented in config comments.
- **CON-003**: `jscpd` must not break existing `clean`, `analyze-code`, `lint-staged`, or workflow behavior for Python projects.
- **CON-004**: `jscpd` duplicate percentages for project-local scans are not equivalent to full-repository percentages; enforcement and reporting must account for that difference.
- **CON-005**: Any new cached Nx targets must declare stable `inputs` and `outputs` so cache behavior remains reproducible.
- **GUD-001**: Follow the existing root-tooling pattern used by `fallow` in `/project.json`: named root targets, explicit `inputs`, `nx:run-commands`, and `check`-style default behavior.
- **GUD-002**: Reuse the existing `clean` composition model in `/nx.json` instead of creating a parallel duplicate-detection composite target.
- **GUD-003**: Keep the initial rollout conservative by using explicit ignore patterns and non-destructive reporting before any future threshold tightening.
- **PAT-001**: Root workspace quality tooling is centralized in `/project.json` under the `monorepo` project.
- **PAT-002**: Cross-project target composition is centralized in `/nx.json` `targetDefaults` and applied by project tags such as `tag:language:typescript`.
- **PAT-003**: Staged-file checks are centralized in `/configuration/lint-staged.config.ts`, with config-change hooks for tool configuration files and `nx affected` for staged source files.
- **PAT-004**: CI quality checks are centralized in `/.github/workflows/analyze-code.yml`, which already runs `pnpm exec nx affected --target=analyze-code --configuration=check` and uploads artifacts after the run.
- **OOS-001**: This plan does not replace `fallow`, remove `fallow` targets, or re-baseline `configuration/fallow-duplicates-baseline.json`.
- **OOS-002**: This plan does not add duplicate auto-fix behavior to `/.github/workflows/remove-deprecations.yml`; `jscpd` is detection-only in this rollout.

## 2. Implementation Steps

### Phase 1

- **GOAL-001**: Add the `jscpd` toolchain and define a repository-safe duplicate-detection configuration aligned with existing fallow scope.

| Task | Description | Completed | Date |
| ---- | ----------- | --------- | ---- |
| TASK-001 | Add `jscpd` to `/package.json` as a root `devDependency` using `catalog:` syntax, add the pinned version to `/pnpm-workspace.yaml`, and update `/pnpm-lock.yaml`. |  |  |
| TASK-002 | Create `/configuration/jscpd.config.json` with explicit `threshold`, `minLines`, `minTokens`, `reporters`, `output`, `absolute`, `gitignore`, `ignore`, and `path` values. Mirror the current exclusion intent from `/configuration/fallow.config.jsonc` for tests, generated files, lockfiles, templates, coverage, dist, `.nx`, `applications/affirmations/**`, and `applications/JimmyPaolini/**`. |  |  |
| TASK-003 | Add inline config comments or adjacent documentation notes that explain where `jscpd` scope intentionally differs from `fallow` scope, especially for project-local scans versus full-repository scans. |  |  |
| TASK-004 | Decide and encode the initial gating policy in config: use a conservative threshold for full-repository scans and avoid treating project-local scan percentages as policy-equivalent to full-repository percentages. |  |  |

### Phase 2

- **GOAL-002**: Wire `jscpd` into Nx targets so existing `clean` and `analyze-code` workflows pick it up without changing how developers invoke quality checks.

| Task | Description | Completed | Date |
| ---- | ----------- | --------- | ---- |
| TASK-005 | Add root Nx targets to `/project.json` for `jscpd`, `jscpd-report`, and `jscpd-full` using `nx:run-commands`. `jscpd-full` must run a full workspace scan against the explicit config file; `jscpd-report` must emit JSON and optional HTML outputs into `dist/reports/jscpd/`; `jscpd` must expose the default CLI form used by downstream composites. |  |  |
| TASK-006 | Update the root `monorepo:clean` target in `/project.json` so `clean:check` and `clean:write` both include a non-destructive `nx run {projectName}:jscpd` command in parallel with `knip` and `fallow-dead-code`. |  |  |
| TASK-007 | Update the root `monorepo:analyze-code` target in `/project.json` so both `check` and `write` configurations include `nx run {projectName}:jscpd-full` and `nx run {projectName}:jscpd-report` in addition to the existing `fallow-*` commands. |  |  |
| TASK-008 | Add `targetDefaults` entries in `/nx.json` for `jscpd` and `jscpd-full`, filtered to `tag:language:typescript`, with stable `inputs` that include TypeScript/JavaScript source globs and `/configuration/jscpd.config.json`, plus `outputs` for `dist/reports/jscpd/**` where reports are produced. |  |  |
| TASK-009 | Update the TypeScript `clean` target default in `/nx.json` so `clean:check` and `clean:write` run `nx run {projectName}:jscpd` alongside `nx run {projectName}:knip:*`, preserving the existing Python `vulture` path unchanged. |  |  |
| TASK-010 | Decide whether explicit per-project `jscpd` target stubs are necessary. If current generated project templates rely entirely on `targetDefaults`, leave `/tools/conformance/**/templates/project.json` unchanged; otherwise, update every affected template and corresponding conformance expectations in `/tools/conformance/src/modules/validator/validator-rules.service.ts`. |  |  |

### Phase 3

- **GOAL-003**: Extend downstream tooling and CI visibility so `jscpd` participates in the same quality surfaces developers already use.

| Task | Description | Completed | Date |
| ---- | ----------- | --------- | ---- |
| TASK-011 | Update `/configuration/lint-staged.config.ts` so `configuration/jscpd.config.json` changes trigger root `monorepo:jscpd-full` and `monorepo:jscpd-report` runs, and staged TS/JS changes continue to pick up `jscpd` via `nx affected --target=clean,...` after the `clean` target composition is updated. |  |  |
| TASK-012 | Update `/.github/workflows/analyze-code.yml` to upload `dist/reports/jscpd/**/*.json` and `dist/reports/jscpd/**/*.html` as workflow artifacts with `if: always()` so duplicate findings remain visible even when `jscpd` fails the job. |  |  |
| TASK-013 | Update any developer-facing code-quality documentation that enumerates workspace duplicate-detection tooling, including the quality-tool summary in `/AGENTS.md` and any directly related validation guidance, so `jscpd` is documented as an additional duplicate detector alongside `fallow`. |  |  |
| TASK-014 | Verify that no duplicate-detection-only workflow changes are needed in `/.github/workflows/remove-deprecations.yml`; if none are needed, document that decision in comments or plan completion notes rather than forcing `jscpd` into an auto-cleanup workflow it cannot safely support. |  |  |

## 3. Files

- **FILE-001**: `/package.json` - add the root `jscpd` `devDependency` using `catalog:`.
- **FILE-002**: `/pnpm-workspace.yaml` - pin the `jscpd` version in the workspace catalog.
- **FILE-003**: `/pnpm-lock.yaml` - capture the resolved `jscpd` dependency graph.
- **FILE-004**: `/configuration/jscpd.config.json` - primary `jscpd` configuration for full and project-local scans.
- **FILE-005**: `/configuration/fallow.config.jsonc` - reference file for aligning duplicate-scan exclusions; only update if shared comments or ignore harmonization are needed.
- **FILE-006**: `/project.json` - add root `jscpd` target family and update `clean` / `analyze-code` compositions.
- **FILE-007**: `/nx.json` - add `targetDefaults` and TypeScript `clean` composition entries for `jscpd`.
- **FILE-008**: `/configuration/lint-staged.config.ts` - add config-change hooks and ensure staged-file flows pick up `jscpd` via `clean`.
- **FILE-009**: `/.github/workflows/analyze-code.yml` - upload `jscpd` report artifacts and preserve existing affected-run entrypoint.
- **FILE-010**: `/AGENTS.md` - update the code-quality tooling summary if it enumerates duplicate-detection tooling.
- **FILE-011**: `/tools/conformance/src/modules/jupyter-notebook-application/templates/project.json` - update only if explicit `jscpd` target stubs become necessary.
- **FILE-012**: `/tools/conformance/src/modules/nestjs-command-application/templates/project.json` - update only if explicit `jscpd` target stubs become necessary.
- **FILE-013**: `/tools/conformance/src/modules/validator/validator-rules.service.ts` - update only if generator template outputs must change for conformance validation.
- **FILE-014**: `/documentation/planning/2026-07-22T03:20:52Z-feature-jscpd-duplicate-detection.plan.md` - source-of-truth implementation plan for this rollout.

## 4. Dependencies

- **DEP-001**: `jscpd` CLI package from https://www.npmjs.com/package/jscpd.
- **DEP-002**: Existing Nx `nx:run-commands` target orchestration in `/project.json` and `/nx.json`.
- **DEP-003**: Existing `fallow` duplicate-detection integration in `/project.json` and `/configuration/fallow.config.jsonc`, which remains in place.
- **DEP-004**: Existing lint-staged quality-entrypoint logic in `/configuration/lint-staged.config.ts`.
- **DEP-005**: Existing GitHub Actions artifact upload support in `/.github/workflows/analyze-code.yml`.
- **DEP-006**: Workspace catalog enforcement in `/scripts/check-workspace-catalogs.ts`.

## 5. Testing & Validation

- **TEST-001**: Run `pnpm exec nx run monorepo:jscpd-full` and verify `jscpd` scans the intended repository paths, honors the ignore set, and exits according to the configured threshold.
- **TEST-002**: Run `pnpm exec nx run monorepo:jscpd-report` and verify JSON and HTML reports are written only under `dist/reports/jscpd/`.
- **TEST-003**: Run `pnpm exec nx run monorepo:clean:check` and `pnpm exec nx run monorepo:clean:write` to verify `jscpd` is now part of root clean composition without disrupting `knip`, `fallow-dead-code`, or `vulture`.
- **TEST-004**: Run `pnpm exec nx affected --target=clean --configuration=check --files=<changed-ts-files>` and verify TypeScript project `clean` now includes `jscpd` while Python project `clean` remains unchanged.
- **TEST-005**: Run `pnpm exec nx affected --target=analyze-code --configuration=check --base=main` and verify root `analyze-code` still executes existing quality checks plus the new `jscpd` full-scan/report targets when `monorepo` is affected.
- **TEST-006**: Trigger lint-staged against staged TypeScript files and a staged `configuration/jscpd.config.json` change to verify the correct `jscpd` commands execute.
- **TEST-007**: Execute or simulate `/.github/workflows/analyze-code.yml` and verify `jscpd` artifacts upload even when duplicate findings cause a non-zero exit code.
- **VAL-001**: Run the repository validation workflow required for code changes: `pnpm exec nx affected --target=analyze-code --configuration=write --base=main` followed by `pnpm exec nx affected --target=analyze-code --configuration=check --base=main`.
- **VAL-002**: If any touched TypeScript project exposes `type-coverage`, verify those targets still pass after `clean` target composition changes.
- **VAL-003**: Confirm no existing `fallow` target names, fallow baseline files, or fallow workflow commands were removed or repurposed.

## 6. Risks & Assumptions

- **RISK-001**: `jscpd` may report a noisy first-pass duplicate baseline because lexical clone detection differs from `fallow` duplicate detection.
- **RISK-002**: Project-local `jscpd` scans used by `clean` and `nx affected` can miss clones where only one side of the duplication changed.
- **RISK-003**: Adding both full-scan and report-generating targets to `analyze-code` can increase CI runtime and artifact size if ignore patterns are too broad.
- **RISK-004**: Misaligned ignore patterns between `fallow` and `jscpd` can create confusing disagreements in duplicate findings.
- **RISK-005**: If `jscpd` output paths are not declared in Nx `outputs`, cache reuse may become inconsistent or stale.
- **ASSUMPTION-001**: The repository wants `jscpd` adoption now as an additional duplicate-detection signal, not as a future replacement for `fallow`.
- **ASSUMPTION-002**: A dedicated `configuration/jscpd.config.json` file is acceptable even though `jscpd` also supports package-level config fields.
- **ASSUMPTION-003**: Initial rollout may require conservative thresholds and ignores before the team decides whether stricter gating is acceptable.
- **ASSUMPTION-004**: Existing generated project templates do not need explicit `jscpd` target stubs unless implementation proves `targetDefaults` alone are insufficient.

## 7. Alternatives

- **ALT-001**: Considered replacing `fallow dupes` with `jscpd` in `clean` and `analyze-code`. Rejected because the requested scope explicitly requires `jscpd` in addition to `fallow`, and the existing fallow baseline/audit workflow provides value that `jscpd` does not replace.
- **ALT-002**: Considered using only a root `monorepo:jscpd-full` target with no project-level `clean` integration. Rejected because it would not satisfy the requirement to incorporate `jscpd` into existing `clean` targets and would bypass established `nx affected --target=clean` developer workflows.
- **ALT-003**: Considered making every `clean` run execute only a full-repository `jscpd` scan. Rejected because it would make routine project-scoped `clean` runs disproportionately expensive and would not align with current Nx target composition patterns.
- **ALT-004**: Considered storing `jscpd` config in `/package.json`. Selected `/configuration/jscpd.config.json` instead because explicit config files match the existing root-tooling convention, reduce config-discovery ambiguity, and make Nx `inputs` easier to declare.
- **ALT-005**: Considered enforcing the same threshold semantics for project-local and full-repository scans. Rejected because `jscpd` percentages from partial scans are not comparable to full-repository percentages, so the plan keeps policy decisions anchored to the full-repository target.
- **ALT-006**: Considered adding `jscpd` to `/.github/workflows/remove-deprecations.yml`. Rejected because that workflow is built around cleanup actions (`clean:write`, `fallow-fix`) and `jscpd` is duplicate detection only, with no safe auto-remediation mode for the bot to apply.
- **ALT-007**: Considered immediately changing generator templates to add explicit `jscpd` targets to all generated projects. Deferred because `nx.json` `targetDefaults` may provide the integration without template churn; templates should change only if implementation proves explicit target stubs are required.

## 8. Related Specifications / Further Reading

- https://jscpd.dev/
- https://github.com/kucherenko/jscpd
- https://www.npmjs.com/package/jscpd
- https://nx.dev/ci/features/affected
- https://nx.dev/recipes/running-tasks/run-commands-executor
- /documentation/planning/2026-06-19T13:34:23Z-feature-fallow-code-quality-integration.plan.md
- /documentation/planning/2026-07-06T19:07:22Z-refactor-fallow-duplicates-elimination.plan.md
- /documentation/planning/2026-06-29T02:15:19Z-refactor-fallow-test-duplicates-triage.plan.md
- /documentation/planning/2026-02-25-feature-static-analysis-tools-expansion-1.plan.md
