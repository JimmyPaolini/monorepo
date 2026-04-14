---
name: Python Tooling Expansion — Monorepo-Wide Lift-Up with ty, bandit, hatchling
description: Lift existing Python tooling to monorepo-wide Nx targetDefaults, add language tags, namedInputs, root pyproject.toml, ty type checker, and bandit security linter
created: 2026-04-03T12:00:00Z
updated: 2026-04-04T04:27:00Z
status: "Completed"
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Lift all Python tooling from project-level to monorepo-wide patterns, matching how TypeScript tools (ESLint, Biome, vitest) are configured via Nx targetDefaults and shared configs. This includes:

1. **Lift existing tools** (ruff, pyright, pytest, vulture) from affirmations `project.json` to `nx.json` targetDefaults
2. **Add new tools** — **ty** (Astral's Rust-based type checker) alongside pyright, **bandit** (security linter)
3. **Add `language:python` / `language:typescript` tags** to all projects for conditional sub-target composition in composite targets
4. **Add `namedInputs`** for Python files (`pythonSource`, `pythonTests`) for proper cache invalidation
5. **Create root `pyproject.toml`** with shared `[tool.ruff]`, `[tool.pyright]`, and `[tool.pytest]` base config (mirrors `tsconfig.base.json` / `eslint.config.base.ts` pattern)
6. **Standardize hatchling** build backend configuration

The affirmations project serves as the reference implementation. Future Python projects inherit all tooling automatically via targetDefaults and tags.

**uvx** was evaluated and excluded from scope; the monorepo will continue using `uv run` for all Nx target commands.

## 1. Requirements & Constraints

- **REQ-001**: Lift all existing Python tool targets (ruff, pyright, pytest, vulture) from `applications/affirmations/project.json` to `nx.json` targetDefaults
- **REQ-002**: Add `ty` as a complementary type checker running alongside pyright (not replacing it)
- **REQ-003**: Add `bandit` as a Python security linter with `pyproject.toml` configuration
- **REQ-004**: Add `language:python` and `language:typescript` tags to all projects for conditional sub-target composition
- **REQ-005**: Add Python-specific `namedInputs` (`pythonSource`, `pythonTests`) to `nx.json` for cache invalidation
- **REQ-006**: Create root `pyproject.toml` with shared `[tool.ruff]`, `[tool.pyright]`, `[tool.pytest]` base config
- **REQ-007**: Standardize `hatchling` build backend configuration across Python projects
- **REQ-008**: Integrate ty into `code-analysis` CI workflow and bandit into `security-audit` CI workflow via `nx affected`
- **SEC-001**: bandit must scan all Python source directories (`src/`) and report security findings in the `security-audit` CI workflow alongside Gitleaks, pnpm audit, and Trivy
- **CON-001**: ty is pre-1.0 (v0.0.28) — configuration stays project-level (not in root pyproject.toml) until stable
- **CON-002**: All tool invocations must use `uv run` (not `uvx`) for consistency with existing Nx targets
- **CON-003**: Python version ≥ 3.11 (`requires-python = ">=3.11"`)
- **CON-004**: All configuration lives in `pyproject.toml` — no standalone config files (`.bandit`, `ty.toml`, etc.)
- **CON-005**: Nx executor pattern: `executor: "nx:run-commands"` with `cwd: "{projectRoot}"` (using Nx interpolation, not hardcoded paths)
- **CON-006**: Root `pyproject.toml` must NOT declare `[project]` or uv workspace config — tool config sections only, to avoid interfering with uv dependency resolution
- **GUD-001**: Python targetDefaults mirror TS patterns: `ruff-format` parallels `biome-format`, `ruff-lint` parallels `biome-lint`, `pyright` parallels `typecheck` (tsc)
- **GUD-002**: New targets follow `check`/`write` configuration pattern where applicable (ruff-format, ruff-lint)
- **GUD-003**: Tool dev dependencies remain in each project's `pyproject.toml` via `uv add --dev` (not shared at root)
- **PAT-001**: Existing TS targetDefault pattern in `nx.json` — `biome-format`, `biome-lint`, `eslint`, `oxlint`, etc. — serves as the template for Python tool targets
- **PAT-002**: Python projects override composite targets (`format`, `lint`, `typecheck`, `test`) to compose Python sub-targets instead of TS sub-targets
- **PAT-003**: `code-analysis` composite target lists all analysis sub-targets as sequential commands
- **PAT-004**: pyright strict mode retained as primary type checker; ty runs as supplementary check
- **PAT-005**: Tag convention: `language:python` / `language:typescript` (replacing existing `lang:python` for consistency)

## 2. Implementation Steps

### Implementation Phase 1 — Foundation: Tags, namedInputs, Root pyproject.toml

- GOAL-001: Establish monorepo-wide infrastructure for Python tooling before defining individual tool targets

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Completed | Date                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-001 | Add `language:typescript` tag to all TS projects: update `tags` arrays in `applications/caelundas/project.json`, `applications/lexico/project.json`, `packages/lexico-components/project.json`, `tools/code-generator/project.json`. Add/update entries in `nx.json` `projects` section where tags are defined there (e.g., caelundas, monorepo)                                                                                                                                 | ✅        | 2026-04-04T00:00:00Z |
| TASK-002 | Replace `lang:python` with `language:python` in `applications/affirmations/project.json` `tags` array. Final tags: `["language:python", "scope:affirmations", "type:application"]`                                                                                                                                                                                                                                                                                               | ✅        | 2026-04-04T00:00:00Z |
| TASK-003 | Add Python `namedInputs` to `nx.json`: `"pythonSource": ["{projectRoot}/**/*.py", "{projectRoot}/pyproject.toml"]` and `"pythonTests": ["{projectRoot}/testing/**/*.py"]`. These parallel the existing TS-oriented `default` and `production` namedInputs                                                                                                                                                                                                                        | ✅        | 2026-04-04T00:00:00Z |
| TASK-004 | Create root `pyproject.toml` (NEW file at workspace root) with shared tool configuration only — NO `[project]` section, NO `[build-system]`, NO uv workspace config. Include: `[tool.ruff]` (target-version="py311", line-length=100, select=\["E","F","I","UP","B","SIM","TCH"\], ignore=\["E501"\], quote-style="double"), `[tool.pyright]` (pythonVersion="3.11", typeCheckingMode="strict", shared suppressions), `[tool.pytest.ini_options]` (markers for unit/integration) | ✅        | 2026-04-04T00:00:00Z |
| TASK-005 | Slim `applications/affirmations/pyproject.toml` — remove `[tool.ruff]`, `[tool.ruff.lint]`, `[tool.ruff.format]`, `[tool.pyright]` base settings that are now in root. Keep only project-specific overrides: ruff `exclude = ["notebooks/**", ".vulture_whitelist.py"]`, pyright `venvPath`/`venv` settings, pyright per-package suppressions for LangChain/LangGraph                                                                                                            | ✅        | 2026-04-04T00:00:00Z |
| TASK-006 | Validate config inheritance: run `uv run ruff check .`, `uv run pyright src/`, `uv run pytest` from `applications/affirmations/` and confirm they resolve the root `pyproject.toml` base config merged with project-level overrides                                                                                                                                                                                                                                              | ✅        | 2026-04-04T00:00:00Z |

### Implementation Phase 2 — New Tool Installation & Configuration

- GOAL-002: Install ty and bandit in affirmations and configure in pyproject.toml

| Task     | Description                                                                                                                                                                                                                                                                                                                       | Completed | Date                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-007 | Add `ty` as a dev dependency: `cd applications/affirmations && uv add --dev ty`                                                                                                                                                                                                                                                   | ✅        | 2026-04-04T04:27:00Z |
| TASK-008 | Add `bandit[toml]` as a dev dependency: `cd applications/affirmations && uv add --dev 'bandit[toml]'`                                                                                                                                                                                                                             | ✅        | 2026-04-04T04:27:00Z |
| TASK-009 | Add `[tool.ty]` configuration to `applications/affirmations/pyproject.toml` (project-level, not root — ty is pre-1.0) — set `environment.python-version = "3.11"`, configure `environment.root = ["./src"]`, add `allowed-unresolved-imports` for `langchain.**`, `langgraph.**`, `langchain_ollama.**`, `langchain_community.**` | ✅        | 2026-04-04T04:27:00Z |
| TASK-010 | Add `[tool.bandit]` configuration to `applications/affirmations/pyproject.toml` (project-level, not root — bandit config is security-context-specific) — set `exclude_dirs = ["testing", "output", "notebooks"]`, `skips = ["B101"]`                                                                                              | ✅        | 2026-04-04T04:27:00Z |
| TASK-011 | Verify existing `[build-system]` and `[tool.hatch.build.targets.wheel]` config — ensure `packages = ["src"]` and `reproducible = true` are set                                                                                                                                                                                    | ✅        | 2026-04-04T04:27:00Z |
| TASK-012 | Run `uv run ty check src/` locally — resolve or suppress findings with `# ty: ignore[rule-name]` for false positives                                                                                                                                                                                                              | ✅        | 2026-04-04T04:27:00Z |
| TASK-013 | Run `uv run bandit -c pyproject.toml -r src/` locally — resolve or suppress findings with `# nosec` comments where appropriate                                                                                                                                                                                                    | ✅        | 2026-04-04T04:27:00Z |

### Implementation Phase 3 — Nx targetDefaults for All Python Tools

- GOAL-003: Define all Python tool targets as monorepo-wide targetDefaults in `nx.json`, mirroring the TS tool targetDefault pattern

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Completed | Date                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-014 | Add `ruff-format` targetDefault to `nx.json`: `executor: "nx:run-commands"`, `cache: true`, `options: { "command": "uv run ruff format {args} .", "cwd": "{projectRoot}" }`, `configurations: { "check": { "args": "--check" }, "write": { "args": "" } }`, `defaultConfiguration: "check"`, `inputs: ["pythonSource", "{workspaceRoot}/pyproject.toml"]`. Mirrors `biome-format` pattern                                                                                                                 | ✅        | 2026-04-04T04:27:00Z |
| TASK-015 | Add `ruff-lint` targetDefault to `nx.json`: `executor: "nx:run-commands"`, `cache: true`, `options: { "command": "uv run ruff check {args} .", "cwd": "{projectRoot}" }`, `configurations: { "check": {}, "write": { "args": "--fix" } }`, `defaultConfiguration: "check"`, `inputs: ["pythonSource", "{workspaceRoot}/pyproject.toml"]`. Mirrors `biome-lint` pattern                                                                                                                                    | ✅        | 2026-04-04T04:27:00Z |
| TASK-016 | Add `pyright` targetDefault to `nx.json`: `executor: "nx:run-commands"`, `cache: true`, `options: { "command": "uv run pyright src/", "cwd": "{projectRoot}" }`, `inputs: ["pythonSource", "{workspaceRoot}/pyproject.toml"]`                                                                                                                                                                                                                                                                             | ✅        | 2026-04-04T04:27:00Z |
| TASK-017 | Add `py-test` targetDefault to `nx.json`: `executor: "nx:run-commands"`, `cache: true`, `options: { "command": "uv run pytest", "cwd": "{projectRoot}" }`, `configurations: { "unit": { "command": "uv run pytest -m unit" }, "integration": { "command": "uv run pytest -m integration" }, "coverage": { "command": "uv run pytest --cov=src --cov-report=term-missing" }, "watch": { "command": "uv run pytest-watch" } }`, `inputs: ["pythonSource", "pythonTests", "{workspaceRoot}/pyproject.toml"]` | ✅        | 2026-04-04T04:27:00Z |
| TASK-018 | Add `vulture` targetDefault to `nx.json`: `executor: "nx:run-commands"`, `cache: true`, `options: { "command": "uv run vulture src/ .vulture_whitelist.py --min-confidence 80", "cwd": "{projectRoot}" }`, `inputs: ["pythonSource", "{projectRoot}/.vulture_whitelist.py"]`                                                                                                                                                                                                                              | ✅        | 2026-04-04T04:27:00Z |
| TASK-019 | Add `ty` targetDefault to `nx.json`: `executor: "nx:run-commands"`, `cache: true`, `options: { "command": "uv run ty check src/", "cwd": "{projectRoot}" }`, `inputs: ["pythonSource", "{workspaceRoot}/pyproject.toml"]`                                                                                                                                                                                                                                                                                 | ✅        | 2026-04-04T04:27:00Z |
| TASK-020 | Add `bandit` targetDefault to `nx.json`: `executor: "nx:run-commands"`, `cache: true`, `options: { "command": "uv run bandit -c pyproject.toml -r src/", "cwd": "{projectRoot}" }`, `inputs: ["pythonSource"]`                                                                                                                                                                                                                                                                                            | ✅        | 2026-04-04T04:27:00Z |

### Implementation Phase 4 — Simplify Affirmations project.json & Update Composites

- GOAL-004: Remove verbose tool definitions from affirmations project.json — replace with thin overrides of composite targets that reference Python targetDefaults instead of TS ones

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                              | Completed | Date                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-021 | Replace affirmations `format` target with composite override: `{ "configurations": { "check": { "commands": ["nx run {projectName}:ruff-format:check"], "parallel": true }, "write": { "commands": ["nx run {projectName}:ruff-format:write"], "parallel": false } } }` — removes the verbose `uv run ruff format` command definitions (now inherited from `ruff-format` targetDefault)                  | ✅        | 2026-04-04T04:27:00Z |
| TASK-022 | Replace affirmations `lint` target with composite override: `{ "configurations": { "check": { "commands": ["nx run {projectName}:ruff-lint:check"], "parallel": true }, "write": { "commands": ["nx run {projectName}:ruff-lint:write"], "parallel": false } } }`                                                                                                                                        | ✅        | 2026-04-04T04:27:00Z |
| TASK-023 | Replace affirmations `typecheck` target with composite override that runs both pyright and ty: `{ "options": { "commands": ["nx run {projectName}:pyright", "nx run {projectName}:ty"], "parallel": true } }` — replaces the hardcoded `uv run pyright src/` command                                                                                                                                     | ✅        | 2026-04-04T04:27:00Z |
| TASK-024 | Replace affirmations `test` target with reference to `py-test`: `{ "options": { "commands": ["nx run {projectName}:py-test"] }, "configurations": { "unit": { "commands": ["nx run {projectName}:py-test:unit"] }, "integration": { "commands": ["nx run {projectName}:py-test:integration"] }, "coverage": { "commands": ["nx run {projectName}:py-test:coverage"] } } }`                               | ✅        | 2026-04-04T04:27:00Z |
| TASK-025 | Remove the verbose `vulture` target body from affirmations `project.json` — it now inherits entirely from the `vulture` targetDefault. Keep only if project-specific overrides are needed (e.g., custom whitelist path)                                                                                                                                                                                  | ✅        | 2026-04-04T04:27:00Z |
| TASK-026 | Update affirmations `code-analysis` composite target commands to use new target names: `["nx run {projectName}:format:check", "nx run {projectName}:lint:check", "nx run {projectName}:markdown-lint", "nx run {projectName}:spell-check", "nx run {projectName}:typecheck", "nx run {projectName}:vulture", "nx run {projectName}:yaml-lint"]` — note: `typecheck` now composes pyright + ty internally | ✅        | 2026-04-04T04:27:00Z |
| TASK-027 | Verify all targets run successfully: `nx run affirmations:format:check`, `nx run affirmations:lint:check`, `nx run affirmations:typecheck`, `nx run affirmations:test:unit`, `nx run affirmations:vulture`, `nx run affirmations:ty`, `nx run affirmations:bandit`, `nx run affirmations:code-analysis`                                                                                                  | ✅        | 2026-04-04T04:27:00Z |

### Implementation Phase 5 — Documentation

- GOAL-005: Document the monorepo-wide Python tooling patterns

| Task     | Description                                                                                                                                                                                                                         | Completed | Date                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-028 | Update `applications/affirmations/AGENTS.md` — add ty and bandit to tooling section, document that tool targets are inherited from nx.json targetDefaults, list available Nx targets                                                | ✅        | 2026-04-04T04:27:00Z |
| TASK-029 | Update root `AGENTS.md` — add `language:python` / `language:typescript` tag convention to Key Conventions section, update affirmations Quick Workflows with new target names (`ty`, `bandit`, `py-test`)                            | ✅        | 2026-04-04T04:27:00Z |
| TASK-030 | Add `ty`, `bandit`, `hatchling`, `pyright` terms to `cspell.config.yaml` if not already present                                                                                                                                     | ✅        | 2026-04-04T04:27:00Z |
| TASK-031 | Create `documentation/conventions/python.md` — document canonical Python tooling setup: root pyproject.toml base config, project-level overrides, Nx targetDefaults, tag-based composite overrides, how to add a new Python project | ✅        | 2026-04-04T04:27:00Z |
| TASK-032 | Update `documentation/frameworks/langchain-python.md` — add `[tool.ty]`, `[tool.bandit]`, `[tool.hatch]` reference configs specific to LangChain projects                                                                           | ✅        | 2026-04-04T04:27:00Z |

### Implementation Phase 6 — CI Validation

- GOAL-006: Validate all Python tools run correctly in CI via existing workflows

| Task     | Description                                                                                                                                                                      | Completed | Date                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-033 | Verify `.github/actions/setup-monorepo` installs `uv` and runs `uv sync` for Python projects — if not, add uv installation step                                                  | ✅        | 2026-04-04T04:27:00Z |
| TASK-034 | Run `nx run affirmations:code-analysis` in CI to validate all Python tools (including ty) execute successfully                                                                   | ✅        | 2026-04-04T04:27:00Z |
| TASK-035 | Verify `nx affected --target=code-analysis` correctly includes affirmations when Python files change                                                                             | ✅        | 2026-04-04T04:27:00Z |
| TASK-036 | Add `nx affected --target=bandit` step to `.github/workflows/security-audit.yml` after the `Setup monorepo` step, alongside existing Gitleaks, dependency-audit, and Trivy steps | ✅        | 2026-04-04T04:27:00Z |
| TASK-037 | Verify `security-audit.yml` workflow passes with bandit — confirm it runs on PRs, pushes to main, and weekly schedule                                                            | ✅        | 2026-04-04T04:27:00Z |
| TASK-038 | Verify that TS projects (caelundas, lexico, etc.) are unaffected — their `format`, `lint`, `typecheck`, `test` targets still compose TS sub-targets correctly                    | ✅        | 2026-04-04T04:27:00Z |

## 3. Alternatives

- **ALT-001**: **Replace pyright with ty** — Rejected because ty is pre-1.0 (v0.0.28); running alongside pyright provides safety while gaining exposure to ty's evolving rule set. Can revisit when ty reaches 1.0.
- **ALT-002**: **Use uvx instead of uv run for tool execution** — Rejected per user preference. `uv run` keeps tools in the project lockfile (`uv.lock`) ensuring reproducible versions; `uvx` runs ephemeral versions which may differ across environments.
- **ALT-003**: **Add bandit via Ruff's security rules (S prefix)** — Ruff implements some bandit rules as `S` rules (e.g., `S101`, `S301`). However, Ruff's coverage is incomplete compared to standalone bandit, and having a dedicated security tool provides clearer audit trails. Could enable Ruff `S` rules as a complement in the future.
- **ALT-004**: **Use mypy instead of ty** — Rejected because ty is from the same team as ruff and uv (Astral), offering better ecosystem alignment and significantly faster performance. The monorepo already uses Astral tools (ruff, uv).
- **ALT-005**: **Separate ty.toml / .bandit config files** — Rejected per CON-004. All tool config belongs in `pyproject.toml` for single-source-of-truth consistency.
- **ALT-006**: **Run bandit in code-analysis workflow** — Rejected. bandit is a security tool and belongs alongside Gitleaks, pnpm audit, and Trivy in `security-audit.yml` for clear separation of concerns between code quality and security scanning.
- **ALT-007**: **Keep all Python tool targets project-level** — Rejected. Lifting to targetDefaults ensures new Python projects inherit tooling automatically (matching TS pattern), eliminates duplicated target definitions, and centralizes cache/input configuration.
- **ALT-008**: **Create a uv workspace in root pyproject.toml** — Rejected per CON-006. A uv workspace would change dependency resolution behavior for all Python projects. Root pyproject.toml is tool-config-only to avoid side effects. Each Python project manages its own dependencies independently.
- **ALT-009**: **Use `lang:python` / `lang:typescript` tag prefix** — Rejected in favor of `language:python` / `language:typescript` for better readability and consistency. Existing `lang:python` tag on affirmations will be migrated.

## 4. Dependencies

- **DEP-001**: `ty` — PyPI package `ty` (v0.0.28+). Installed via `uv add --dev ty`
- **DEP-002**: `bandit[toml]` — PyPI package `bandit` with TOML extra. Installed via `uv add --dev 'bandit[toml]'`
- **DEP-003**: `hatchling` — Already present in `[build-system]` requires. No additional install needed
- **DEP-004**: `uv` — Already available in monorepo (uv.lock pattern established). Must be available in CI via `.github/actions/setup-monorepo`
- **DEP-005**: Nx — Existing monorepo orchestrator. `nx.json` targetDefaults and namedInputs will be extended (not replaced)
- **DEP-006**: ruff, pyright, pytest, vulture — Already installed as dev dependencies in affirmations. No new installs needed; targets are being lifted from project-level to monorepo-level

## 5. Files

- **FILE-001**: `nx.json` — Add `pythonSource`/`pythonTests` namedInputs; add 7 new targetDefaults (`ruff-format`, `ruff-lint`, `pyright`, `py-test`, `vulture`, `ty`, `bandit`); update `projects` section for tag additions
- **FILE-002**: `pyproject.toml` (NEW — workspace root) — Shared `[tool.ruff]`, `[tool.pyright]`, `[tool.pytest.ini_options]` base config. No `[project]` or `[build-system]` sections
- **FILE-003**: `applications/affirmations/pyproject.toml` — Remove base tool configs (now in root); add `[tool.ty]` and `[tool.bandit]`; keep project-specific overrides only
- **FILE-004**: `applications/affirmations/project.json` — Replace verbose tool targets with thin composite overrides; update tags from `lang:python` to `language:python`; update `code-analysis` commands
- **FILE-005**: `applications/affirmations/uv.lock` — Auto-updated by `uv add --dev ty 'bandit[toml]'`
- **FILE-006**: `applications/caelundas/project.json` — Add `language:typescript` tag
- **FILE-007**: `applications/lexico/project.json` — Add `language:typescript` tag
- **FILE-008**: `packages/lexico-components/project.json` — Add `language:typescript` tag
- **FILE-009**: `tools/code-generator/project.json` — Add `language:typescript` tag
- **FILE-010**: `applications/affirmations/AGENTS.md` — Document new tools and inherited targetDefaults
- **FILE-011**: `AGENTS.md` (root) — Add tag convention, update affirmations Quick Workflows
- **FILE-012**: `cspell.config.yaml` — Add tool names to dictionary if needed
- **FILE-013**: `documentation/conventions/python.md` (NEW) — Canonical Python tooling setup guide
- **FILE-014**: `documentation/frameworks/langchain-python.md` — Add ty, bandit, hatch reference configs
- **FILE-015**: `.github/actions/setup-monorepo/action.yml` — Verify uv installation step (may need no changes)
- **FILE-016**: `.github/workflows/security-audit.yml` — Add `nx affected --target=bandit` step

## 6. Testing

- **TEST-001**: `nx run affirmations:ruff-format:check` — validates ruff-format targetDefault works
- **TEST-002**: `nx run affirmations:ruff-lint:check` — validates ruff-lint targetDefault works
- **TEST-003**: `nx run affirmations:pyright` — validates pyright targetDefault works
- **TEST-004**: `nx run affirmations:py-test:unit` — validates py-test targetDefault works
- **TEST-005**: `nx run affirmations:vulture` — validates vulture targetDefault works
- **TEST-006**: `nx run affirmations:ty` — validates ty targetDefault works with no errors on current codebase
- **TEST-007**: `nx run affirmations:bandit` — validates bandit targetDefault works with no unresolved findings
- **TEST-008**: `nx run affirmations:format:check` — validates composite format override composes ruff-format correctly
- **TEST-009**: `nx run affirmations:lint:check` — validates composite lint override composes ruff-lint correctly
- **TEST-010**: `nx run affirmations:typecheck` — validates composite typecheck runs both pyright + ty
- **TEST-011**: `nx run affirmations:test` — validates test override delegates to py-test
- **TEST-012**: `nx run affirmations:code-analysis` — validates full composite target with all Python tools
- **TEST-013**: TS projects unaffected: `nx run caelundas:format:check`, `nx run caelundas:lint:check`, `nx run caelundas:typecheck` still run TS tools (biome, eslint, tsc)
- **TEST-014**: Config inheritance: `uv run ruff check .` from affirmations resolves root pyproject.toml base + project overrides
- **TEST-015**: CI workflow `code-analysis.yml` passes with `nx affected --target=code-analysis` including affirmations
- **TEST-016**: CI workflow `security-audit.yml` passes with `nx affected --target=bandit` step

## 7. Risks & Assumptions

- **RISK-001**: ty is pre-1.0 and may introduce breaking config changes in minor versions. Mitigation: pin version in `uv.lock`, keep config minimal and project-level (not root), document known suppressions
- **RISK-002**: ty may produce false positives on LangChain/LangGraph code due to missing type stubs. Mitigation: use `allowed-unresolved-imports` in `[tool.ty.analysis]`
- **RISK-003**: bandit may flag legitimate patterns as security issues (e.g., `subprocess` usage, `assert` in tests). Mitigation: configure `exclude_dirs` and `skips` in `[tool.bandit]`, use `# nosec` for justified suppressions
- **RISK-004**: CI may lack `uv` in the runner environment. Mitigation: verify `.github/actions/setup-monorepo` installs uv (TASK-033)
- **RISK-005**: Root `pyproject.toml` may interfere with uv dependency resolution if it contains `[project]` or workspace config. Mitigation: CON-006 explicitly prohibits this — root file is tool-config-only
- **RISK-006**: Ruff/pyright config inheritance from root may not merge correctly with project-level overrides. Mitigation: TASK-006 validates this explicitly before proceeding to targetDefaults
- **RISK-007**: TS projects may accidentally pick up Python targetDefaults if target names collide. Mitigation: Python tool targets use distinct names (`ruff-format`, `ruff-lint`, `pyright`, `py-test`, `vulture`, `ty`, `bandit`) that don't overlap with TS targets (`biome-format`, `biome-lint`, `eslint`, `oxlint`, `typecheck`, `test`)
- **ASSUMPTION-001**: The affirmations project's `src/` directory contains all code that should be type-checked and security-scanned
- **ASSUMPTION-002**: `uv add --dev` will add packages to `[dependency-groups] dev` in `pyproject.toml` and update `uv.lock`
- **ASSUMPTION-003**: ruff, pyright, and pytest all support `pyproject.toml` config inheritance by walking parent directories
- **ASSUMPTION-004**: Nx targetDefaults are only activated when a project explicitly declares the target name (empty `{}` is sufficient) or references it from a composite target — they do not auto-apply to projects that don't declare them
- **ASSUMPTION-005**: Future Python projects will follow the affirmations pattern: declare Python tool targets (even as empty `{}`) in their `project.json` and override composite targets to reference Python sub-targets

## 8. Related Specifications / Further Reading

- [ty Documentation](https://docs.astral.sh/ty/) — Configuration reference, rules, CLI
- [ty Configuration Reference](https://docs.astral.sh/ty/reference/configuration/)
- [ty Rules Reference](https://docs.astral.sh/ty/reference/rules/)
- [Bandit Documentation](https://bandit.readthedocs.io/en/latest/) — Getting started, configuration, test plugins
- [Bandit GitHub](https://github.com/PyCQA/bandit) — Source, issues
- [Hatchling / Hatch Documentation](https://hatch.pypa.io/latest/) — Build backend config
- [uv Tools Guide](https://docs.astral.sh/uv/guides/tools/) — `uv run` vs `uvx` distinction
- [Nx Target Defaults](https://nx.dev/reference/nx-json#target-defaults) — How targetDefaults work
- [Existing Plan: Affirmations Application](documentation/planning/2026-02-27-feature-affirmations-application-1.plan.md) — Original Python scaffolding patterns
- [Existing Plan: Static Analysis Tools Expansion](documentation/planning/2026-02-25-feature-static-analysis-tools-expansion-1.plan.md) — Monorepo-wide analysis tool integration patterns
