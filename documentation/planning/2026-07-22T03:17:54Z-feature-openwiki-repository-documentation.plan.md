---
name: Integrate OpenWiki Repository Documentation Generation
description: Add an on-demand OpenWiki workflow to generate repo-local documentation and expose it to coding agents through stable Nx targets and documentation entrypoints.
created: 2026-07-22T03:17:54Z
updated: 2026-07-22T03:17:54Z
status: 'Planned'
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan introduces an OpenWiki-based documentation generation workflow for the monorepo. The implementation will run OpenWiki through a dedicated Nx-owned tool, generate repo-local Markdown under a managed documentation subtree, and link the generated artifacts from existing agent context surfaces so human contributors and coding agents can consume them without replacing the current hand-authored AGENTS, skills, and architecture documents.

## 1. Requirements & Constraints

- **REQ-001**: Confirm the authoritative OpenWiki upstream repository, install method, exact pinned version or commit, supported Python range, and required provider credentials before implementation begins.
- **REQ-002**: Implement the integration as a dedicated Nx project rooted at `tools/openwiki/` rather than as ad hoc shell scripts.
- **REQ-003**: Keep OpenWiki at a CLI boundary; invoke the documented executable or `python -m` entrypoint instead of importing undocumented internal modules.
- **REQ-004**: Generate stable repository artifacts only inside `documentation/openwiki/` and never overwrite hand-authored files outside explicitly managed OpenWiki output paths.
- **REQ-005**: Support both full-repository generation and narrowed generation for specific Nx projects or source roots so contributors can refresh documentation on demand without always processing the full monorepo.
- **REQ-006**: Expose generated documentation to coding agents through stable links in `AGENTS.md` and selected project-level `AGENTS.md` files instead of pasting model-generated prose directly into those files.
- **REQ-007**: Provide first-class Nx targets for local development and optional workflow-based refresh so the feature is runnable with `pnpm exec nx run openwiki:<target>`.
- **REQ-008**: Preserve the current deterministic synchronization and validate-conventions flows; OpenWiki generation must not become a required `check` drift gate in the initial rollout.
- **SEC-001**: Default to local repository analysis with least-privilege credentials, and require all model/provider secrets to come from environment variables or GitHub Actions secrets.
- **SEC-002**: Prevent accidental disclosure of private code by documenting provider behavior and by preferring local repo execution over remote repo indexing.
- **CON-001**: Generated Markdown that is committed to the repository must pass existing documentation quality gates or be normalized before commit so `markdown-lint`, `spell-check`, and related repo checks remain green.
- **CON-002**: Nx inputs, outputs, and cache behavior must be explicit; if OpenWiki output remains materially nondeterministic after normalization, caching must be disabled for generation targets.
- **CON-003**: The new tool must follow existing `tools/` project conventions, strict TypeScript rules, and the NestJS command application pattern already used for internal CLI tooling where practical.
- **GUD-001**: Reuse existing logger, mode-resolution, and command-application patterns from `tools/synchronization` when building the wrapper tool.
- **GUD-002**: Reuse the existing `workflow_dispatch` documentation refresh pattern rather than inventing a separate deployment mechanism unless workflow responsibilities become too broad.
- **PAT-001**: Existing deterministic documentation sync commands stay in `tools/synchronization`; OpenWiki output is additive and must not be forced into marker-based `check|write` synchronization behavior.
- **ASM-001**: Assume OpenWiki can be executed locally against a checked-out repository and can write generated documentation to a caller-provided output directory.

## 2. Implementation Steps

### Phase 1

- GOAL-001: Establish a safe, pinned, repo-native runtime boundary for OpenWiki and scaffold the Nx tool that will own generation.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-001 | Verify the authoritative OpenWiki package or repository slug, supported Python version, documented CLI entrypoint, and required environment variables; record the findings in `tools/openwiki/README.md` and pin the chosen upstream version in the tool's runtime setup instructions. |  |  |
| TASK-002 | Scaffold `tools/openwiki/` as a dedicated Nx CLI tool following the `tools/` project pattern, including `project.json`, `package.json` if required by the scaffold, TypeScript configuration files, `src/main.ts`, and a command module that owns OpenWiki invocation. |  |  |
| TASK-003 | Add explicit tool configuration files under `tools/openwiki/` to define include roots, exclude globs (`node_modules`, `dist`, `coverage`, `.nx`, `.git`, generated assets, lockfiles, and other low-signal paths), output root `documentation/openwiki/`, and transient cache root `.cache/openwiki/`. |  |  |

### Phase 2

- GOAL-002: Implement the OpenWiki wrapper, deterministic output shaping, and Nx target surface for local on-demand generation.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-004 | Implement `tools/openwiki/src/modules/generate-documentation/` so the command resolves workspace paths, validates provider configuration, shells out to the pinned OpenWiki CLI, and supports both full-repository generation and scoped generation for a specific project root or path allowlist. |  |  |
| TASK-005 | Add output post-processing in `tools/openwiki/src/modules/output-normalization/` to normalize filenames, top-level indexes, heading structure, and cross-links so generated Markdown under `documentation/openwiki/` is stable enough for repository review and existing markdown quality tools. |  |  |
| TASK-006 | Define canonical Nx targets in `tools/openwiki/project.json` for `generate`, `generate-project`, and `generate-affected`, with explicit `inputs`, `outputs`, environment requirements, and cache settings that reflect actual output determinism. |  |  |
| TASK-007 | Add repository hygiene support for transient artifacts by ignoring `.cache/openwiki/` and any other non-source OpenWiki scratch paths while keeping `documentation/openwiki/` committed and reviewable. |  |  |

### Phase 3

- GOAL-003: Surface generated documentation to coding agents and integrate the workflow into existing documentation refresh automation.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-008 | Create `documentation/openwiki/README.md` as the stable entrypoint for generated docs, and ensure the generation pipeline writes predictable subtrees such as `documentation/openwiki/monorepo/`, `documentation/openwiki/applications/`, `documentation/openwiki/packages/`, and `documentation/openwiki/tools/`. |  |  |
| TASK-009 | Update `AGENTS.md` and the most relevant project-level agent entrypoints (`applications/caelundas/AGENTS.md`, `applications/lexico/AGENTS.md`, `packages/lexico-components/AGENTS.md`, and `infrastructure/AGENTS.md`) to link to the generated OpenWiki indexes that correspond to each project's code and architecture context. |  |  |
| TASK-010 | Extend `.github/workflows/refresh-documentation.yml` or add a dedicated `.github/workflows/refresh-openwiki-documentation.yml` workflow that installs the OpenWiki runtime prerequisites, runs the canonical Nx generation target on `workflow_dispatch`, and uploads or commits the generated docs using existing repository secret-management patterns. |  |  |
| TASK-011 | Update `documentation/development/context-engineering.md` and any command-reference docs that describe documentation surfaces so contributors know when to regenerate OpenWiki output and how coding agents should consume it. |  |  |

### Phase 4

- GOAL-004: Prove the integration is safe, reproducible enough for repository use, and compatible with existing validation workflows.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-012 | Run a scoped generation smoke test against one representative project and a full-repository generation smoke test, then verify that generated files land only under `documentation/openwiki/` and that project-specific links resolve from the corresponding `AGENTS.md` entrypoints. |  |  |
| TASK-013 | Add and run focused tests for wrapper argument parsing, configuration validation, and output normalization using the tool's existing test framework, then run the tool's typecheck target and any project-level tests required by the scaffold. |  |  |
| TASK-014 | Run repository validation after generated artifacts and link updates are in place: `pnpm exec nx run monorepo:markdown-lint:check`, `pnpm exec nx run monorepo:spell-check`, `pnpm exec nx run openwiki:typecheck`, and the required `pnpm exec nx affected --target=analyze-code --configuration=check --base=main` pass. |  |  |

## 3. Files

- **FILE-001**: `tools/openwiki/project.json` - Canonical Nx targets, inputs, outputs, cache policy, and runtime command definitions for OpenWiki integration.
- **FILE-002**: `tools/openwiki/src/main.ts` - CLI entrypoint for the OpenWiki wrapper tool.
- **FILE-003**: `tools/openwiki/src/modules/generate-documentation/**` - Command, service, constants, and types that invoke OpenWiki and translate workspace options into CLI parameters.
- **FILE-004**: `tools/openwiki/src/modules/output-normalization/**` - Post-processing logic that normalizes generated Markdown into repository-friendly output.
- **FILE-005**: `tools/openwiki/README.md` - Operational documentation for installing prerequisites, setting provider credentials, and running Nx targets.
- **FILE-006**: `tools/openwiki/openwiki.config.json` or `tools/openwiki/openwiki.config.yaml` - Source-of-truth OpenWiki include, exclude, output, and provider configuration.
- **FILE-007**: `documentation/openwiki/README.md` - Stable top-level index for generated OpenWiki artifacts.
- **FILE-008**: `documentation/openwiki/**` - Generated repository and per-project documentation pages managed by the OpenWiki workflow.
- **FILE-009**: `AGENTS.md` - Root agent context entrypoint that should link to the generated OpenWiki documentation index.
- **FILE-010**: `applications/caelundas/AGENTS.md`, `applications/lexico/AGENTS.md`, `packages/lexico-components/AGENTS.md`, `infrastructure/AGENTS.md` - Project-level agent context entrypoints that should link to matching generated docs.
- **FILE-011**: `.github/workflows/refresh-documentation.yml` or `.github/workflows/refresh-openwiki-documentation.yml` - On-demand automation for refreshing OpenWiki-generated documentation.
- **FILE-012**: `documentation/development/context-engineering.md` - Human-authored guidance describing how generated documentation fits into agent context engineering.
- **FILE-013**: `.gitignore` - Ignore rules for transient OpenWiki cache and scratch artifacts.

## 4. Dependencies

- **DEP-001**: The implementation depends on identifying and pinning the authoritative OpenWiki upstream repository or package and a supported installation method.
- **DEP-002**: The wrapper depends on a locally available Python runtime and package launcher that are compatible with the pinned OpenWiki version.
- **DEP-003**: If OpenWiki requires remote model providers, the workflow depends on repository or local environment secrets for those providers.
- **DEP-004**: The agent-facing documentation links depend on existing `AGENTS.md` files remaining the stable context entrypoints for contributors and coding agents.
- **DEP-005**: Optional workflow automation depends on the existing GitHub Actions setup pattern used by `.github/workflows/refresh-documentation.yml`.

## 5. Testing & Validation

- **TEST-001**: Wrapper command tests verify invalid mode handling, missing environment-variable failures, scoped path resolution, and CLI argument composition for full-repo and project-scoped generation.
- **TEST-002**: Output-normalization tests verify deterministic rewriting of headings, filenames, root index generation, and project-level cross-link generation.
- **TEST-003**: Smoke-test `pnpm exec nx run openwiki:generate-project -- --project=lexico` (or equivalent final target syntax) and confirm output only touches the expected subtree beneath `documentation/openwiki/`.
- **TEST-004**: Smoke-test `pnpm exec nx run openwiki:generate` and confirm the generated top-level index and project indexes resolve without broken relative links.
- **VAL-001**: Run `pnpm exec nx run monorepo:markdown-lint:check` and `pnpm exec nx run monorepo:spell-check` after generation to prove generated docs are repository-clean.
- **VAL-002**: Run `pnpm exec nx run openwiki:typecheck` and the tool's unit test target to prove the wrapper conforms to repo TypeScript standards.
- **VAL-003**: Trigger the selected GitHub Actions workflow with `workflow_dispatch` and verify runtime setup, Nx execution, artifact publication or commit behavior, and secret usage all succeed.
- **VAL-004**: Run `pnpm exec nx affected --target=analyze-code --configuration=check --base=main` after all implementation changes to satisfy the repo-wide completion gate.

## 6. Risks & Assumptions

- **RISK-001**: OpenWiki may not support Python 3.14 or may require a narrower runtime range than the rest of the repository currently uses.
- **RISK-002**: OpenWiki output may remain nondeterministic enough to produce noisy diffs, making Nx caching and committed documentation updates unreliable without additional normalization.
- **RISK-003**: Generated documentation may include vocabulary, headings, or formatting that fail existing `cspell` and markdown-lint rules.
- **RISK-004**: Full-repository generation may be too slow or expensive to run on every change, especially if it relies on remote LLM providers.
- **RISK-005**: Linking generated docs from AGENTS surfaces without clear scoping could overwhelm agents with broad context rather than improving relevance.
- **ASSUMPTION-001**: The OpenWiki CLI can accept a local repository path and a caller-controlled output directory.
- **ASSUMPTION-002**: Generated documentation can be scoped by project root or input path, not only by whole-repo indexing.
- **ASSUMPTION-003**: Root and project `AGENTS.md` files will remain the primary discoverability surface for coding-agent context in this monorepo.

## 7. Alternatives

- **ALT-001**: Considered adding OpenWiki as another `tools/synchronization` `check|write` command. Selected a dedicated `tools/openwiki` project instead because OpenWiki is an external runtime with likely nondeterministic output, while `tools/synchronization` is currently reserved for deterministic marker-based drift checks.
- **ALT-002**: Considered importing OpenWiki as a library from TypeScript or directly embedding LangChain code. Selected a CLI boundary because the external research indicates LangChain package churn and an uncertain OpenWiki API surface, making a documented executable far safer than internal imports.
- **ALT-003**: Considered running OpenWiki automatically on every pull request. Selected on-demand Nx targets plus optional `workflow_dispatch` automation because cost, latency, rate limits, and output variability make always-on generation too risky for the initial rollout.
- **ALT-004**: Considered overwriting or heavily regenerating existing `AGENTS.md` and README files with model-generated content. Selected a dedicated `documentation/openwiki/` subtree plus stable links so generated material remains additive, reviewable, and easy to revert without damaging human-maintained context files.
- **ALT-005**: Considered adding duplicate root-level `monorepo:openwiki-*` alias targets. Selected canonical `openwiki:*` project targets only because the repository has already moved documentation synchronization ownership into dedicated tool projects rather than duplicating commands at the root.

## 8. Related Specifications / Further Reading

- `documentation/planning/2026-06-26T18:40:14Z-refactor-synchronization-tool-migration.plan.md`
- `documentation/planning/plan-enhanceMonorepoDocumentation.prompt.md`
- `documentation/development/context-engineering.md`
- `.github/workflows/refresh-documentation.yml`
- `.github/workflows/validate-conventions.yml`
- `tools/synchronization/project.json`
- `tools/synchronization/src/modules/agent-skills/agent-skills.command.ts`
- `https://www.langchain.com/blog/introducing-openwiki-an-open-source-agent-for-repo-documentation`
- `https://nx.dev/reference/core-api/nx/executors/run-commands`
- `https://nx.dev/concepts/how-caching-works`
