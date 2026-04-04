# Python Conventions

Canonical Python tooling setup for this monorepo. All Python projects inherit configuration from:

1. **Root `pyproject.toml`** — shared `[tool.ruff]`, `[tool.pyright]`, `[tool.pytest.ini_options]` base config
2. **`nx.json` targetDefaults** — monorepo-wide Nx targets for every Python tool
3. **Project `pyproject.toml`** — project-specific overrides only (suppressed warnings, excludes, etc.)
4. **Project `project.json`** — thin composite target overrides that compose Python sub-targets

## Root pyproject.toml

Located at `pyproject.toml` (workspace root). Contains **tool config sections only** — no `[project]`, `[build-system]`, or uv workspace config to avoid interfering with dependency resolution.

```toml
[tool.ruff]
target-version = "py311"
line-length = 100
# ...

[tool.pyright]
pythonVersion = "3.11"
typeCheckingMode = "strict"
# ...

[tool.pytest.ini_options]
markers = ["unit: ...", "integration: ..."]
```

Projects inherit these settings automatically. Add project-level `[tool.ruff]`, `[tool.pyright]` sections only for overrides (e.g., `exclude`, `venvPath`, per-package suppressions).

## Nx targetDefaults (nx.json)

Seven Python tool targets are defined as monorepo-wide `targetDefaults`:

| Target        | Tool    | Description                                        |
| ------------- | ------- | -------------------------------------------------- |
| `ruff-format` | ruff    | Format Python source (`--check` / write modes)     |
| `ruff-lint`   | ruff    | Lint Python source (`check` / `--fix` modes)       |
| `pyright`     | pyright | Primary type checker (strict mode)                 |
| `py-test`     | pytest  | Run tests (unit/integration/coverage/watch)        |
| `vulture`     | vulture | Dead code detection                                |
| `ty`          | ty      | Supplementary type checker (Astral, pre-1.0)       |
| `bandit`      | bandit  | Security linter (runs in `security-audit` CI only) |

All targets use `executor: "nx:run-commands"`, `cache: true`, `cwd: "{projectRoot}"`, and `uv run` for invocation.

## Project Tags

Every project must declare a language tag:

- `language:typescript` — TypeScript projects (caelundas, lexico, lexico-components, code-generator)
- `language:python` — Python projects (affirmations)

These tags identify which composite target overrides apply to each project.

## Python project.json Pattern

Python projects override the TS-default composite targets to compose Python sub-targets. The key pattern:

```json
{
  "tags": ["language:python", "scope:<name>", "type:application"],
  "targets": {
    "format": {
      "configurations": {
        "check": {
          "commands": ["nx run {projectName}:ruff-format:check"],
          "parallel": true
        },
        "write": {
          "commands": ["nx run {projectName}:ruff-format:write"],
          "parallel": false
        }
      }
    },
    "lint": {
      "configurations": {
        "check": {
          "commands": ["nx run {projectName}:ruff-lint:check"],
          "parallel": true
        },
        "write": {
          "commands": ["nx run {projectName}:ruff-lint:write"],
          "parallel": false
        }
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "commands": ["nx run {projectName}:pyright", "nx run {projectName}:ty"],
        "parallel": true
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": { "commands": ["nx run {projectName}:py-test"] },
      "configurations": {
        "unit": { "commands": ["nx run {projectName}:py-test:unit"] },
        "integration": {
          "commands": ["nx run {projectName}:py-test:integration"]
        },
        "coverage": { "commands": ["nx run {projectName}:py-test:coverage"] }
      }
    },
    "bandit": {},
    "py-test": {},
    "pyright": {},
    "ruff-format": {},
    "ruff-lint": {},
    "ty": {},
    "vulture": {}
  }
}
```

> **Note**: Each sub-target (`ruff-format`, `ruff-lint`, etc.) must be declared as `{}` in `project.json` for Nx to apply the targetDefault. An empty `{}` tells Nx "this project has this target — use the monorepo default."

## Project pyproject.toml Pattern

```toml
[project]
name = "my-python-app"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [...]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src"]
reproducible = true

# Project-specific overrides (base config inherited from root pyproject.toml)
[tool.ruff]
exclude = ["notebooks/**", ".vulture_whitelist.py"]

[tool.pyright]
venvPath = "."
venv = ".venv"
# Per-package suppressions (for stubs-less third-party deps)
reportMissingModuleSource = "none"

[tool.ty.environment]
python-version = "3.11"

[tool.ty.analysis]
allowed-unresolved-imports = ["my_external_package.**"]

[tool.bandit]
exclude_dirs = ["testing", "output", "notebooks"]
skips = ["B101"]  # assert_used — OK in test code
```

## Adding a New Python Project

1. Create `project.json` with `language:python` tag and all sub-targets declared as `{}`
2. Create `pyproject.toml` using the pattern above
3. Run `uv sync` to generate `uv.lock`
4. Add `ty` and `bandit` as dev dependencies: `uv add --dev ty 'bandit[toml]'`
5. Override composite targets (`format`, `lint`, `typecheck`, `test`) in `project.json`
6. Verify: `nx run <project>:code-analysis`

The new project automatically inherits all Python tool targetDefaults — no `nx.json` changes needed.

## Tool Execution

All tool invocations use `uv run` (not `uvx`) for reproducible versions pinned in `uv.lock`:

```bash
uv run ruff format .
uv run ruff check .
uv run pyright src/
uv run pytest
uv run ty check src/
uv run bandit -c pyproject.toml -r src/
uv run vulture src/ .vulture_whitelist.py --min-confidence 80
```

## ty Configuration (CON-001)

ty is pre-1.0. Keep its configuration **project-level** (in the project's `pyproject.toml`, not root) until ty stabilizes. Current config:

```toml
[tool.ty.environment]
python-version = "3.11"

[tool.ty.analysis]
allowed-unresolved-imports = ["langchain.**", "langgraph.**"]
```

Do not add `[tool.ty]` to the root `pyproject.toml` until ty reaches 1.0.
