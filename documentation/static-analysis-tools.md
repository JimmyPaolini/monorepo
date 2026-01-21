# Static Analysis Tools

This document describes all static analysis tools integrated into the monorepo.

## Overview

The monorepo uses a comprehensive suite of static analysis tools organized into four categories:

- **Foundation:** Core development tools (4 tools)
- **Security & Architecture:** Dependency and vulnerability management (3 tools)
- **Performance & Quality:** Code quality and bundle optimization (4 tools)
- **Documentation & Compliance:** Documentation standards and licensing (3 tools)

All tools are integrated with Nx for caching and affected command support, and are enforced via pre-commit hooks.

---

## Foundation: Core Development Tools

### 1. TypeScript (v5.9.3)

**Purpose:** Static type checking and compile-time safety

**Configuration:** `tsconfig.base.json` (shared) + project-specific `tsconfig.json` files

**Key Compiler Options:**

- **Strict mode enabled** - All strict type-checking options active
- **No unchecked indexed access** - Requires null checks for array/object access
- **Exact optional property types** - Distinguishes `undefined` from missing properties
- **No unused locals/parameters** - Enforces clean code
- **Verbatim module syntax** - Explicit type-only imports
- **Module:** NodeNext (ESM + CommonJS interop)
- **Target:** ES2022

**Path Mappings:**

- `@monorepo/lexico-components` → `packages/lexico-components/src/index.ts`

**Usage:**

```bash
# Type-check specific project
nx run caelundas:typecheck
nx run lexico:typecheck
nx run lexico-components:typecheck
nx run code-generator:typecheck

# Type-check all projects
nx run-many -t typecheck --all

# Type-check workspace root
nx run monorepo:typecheck
```

**Files:**

- `tsconfig.base.json` (shared compiler options)
- `applications/caelundas/tsconfig.json`
- `applications/lexico/tsconfig.json`
- `packages/lexico-components/tsconfig.json`
- `tools/code-generator/tsconfig.json`

---

### 2. ESLint (v9.x flat config)

**Purpose:** Code linting and style enforcement

**Configuration:** `eslint.config.base.ts` (flat config format)

**Key Features:**

- **Nx plugin integration** - Module boundary enforcement
- **TypeScript-aware rules** - Type-checked linting
- **Import sorting** - Automatic import organization (node builtins → external → internal → relative → types)
- **React + Hooks rules** - React 19 best practices
- **Accessibility checks** - jsx-a11y plugin
- **Markdown linting** - Code blocks in documentation
- **JSON linting** - Configuration file validation via eslint-plugin-jsonc
- **YAML linting** - Full YAML syntax and style enforcement via eslint-plugin-yml

**Major Rule Categories:**

- `@typescript-eslint/explicit-function-return-type` - Required return types
- `@typescript-eslint/no-explicit-any` - Ban `any` types
- `@typescript-eslint/consistent-type-imports` - Type-only imports
- `@typescript-eslint/naming-convention` - PascalCase types, camelCase variables
- `import/order` - Enforced import grouping with blank lines
- `@nx/enforce-module-boundaries` - Architectural boundaries

**Usage:**

```bash
# Lint specific project
nx run caelundas:lint
nx run lexico:lint
nx run lexico-components:lint
nx run code-generator:lint

# Lint all projects
nx run-many -t lint --all

# Auto-fix issues
nx run caelundas:lint:write
```

**Files:**

- `eslint.config.base.ts` (shared rules)
- `applications/lexico/eslint.config.ts` (React-specific overrides)

---

### 3. Prettier (v3.7.1)

**Purpose:** Code formatting (opinionated, zero-config)

**Configuration:** Uses Prettier defaults + `eslint-config-prettier` to disable conflicting ESLint rules

**Supported File Types:**

- TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.cts`)
- JSON/JSONC/JSON5 (using eslint-plugin-jsonc)
- YAML/YML (using eslint-plugin-yml)
- CSS/SCSS
- Markdown
- HTML

**Usage:**

```bash
# Format specific project (writes changes)
nx run caelundas:format
nx run lexico:format
nx run lexico-components:format

# Check formatting without changes
nx run caelundas:format:check

# Format workspace root
nx run monorepo:format
```

**Integration:** Runs before ESLint in pre-commit hooks to avoid conflicts

**Files:**

- No explicit config file (uses Prettier defaults)
- Integrated via `eslint-config-prettier` in ESLint config

---

### 4. Knip (v5.x)

**Purpose:** Dead code detection (unused files, exports, dependencies, types)

**Configuration:** `knip.json`

**Workspace Configuration:**

- **Root workspace** - Scripts, base configs, Nx files
- **caelundas** - CLI app, excludes test files and output
- **lexico** - TanStack Start app, ignores generated routes and Supabase types
- **lexico-components** - React library, ignores shadcn-generated UI components
- **code-generator** - Nx generators, entry points are generator.ts files

**Ignored Dependencies:** Tools used via CLI/npx

- Static analysis tools (dependency-cruiser, type-coverage, license-checker)
- Nx plugins, TSX
- Documentation plugins (eslint-plugin-tsdoc, eslint-plugin-jsdoc)

**Ignored Binaries:**

- `depcruise` (used in project.json targets)
- `supabase` (Supabase CLI)

**Usage:**

```bash
# Check for dead code (runs on pre-commit for changed files)
pnpm knip

# Check specific workspace
pnpm knip --workspace applications/caelundas
```

**Files:**

- `knip.json` (workspace configuration)

---

## Security & Architecture

### 1. dependency-cruiser (v17.3.6)

**Purpose:** Validates architectural boundaries and prevents circular dependencies

**Configuration:** `.dependency-cruiser.cjs`

**Key Rules:**

- No circular dependencies (error)
- No orphaned files (warning)
- No test imports in application code (error)
- Production code cannot depend on devDependencies (error)

**Usage:**

```bash
# Check specific project
nx run caelundas:dependency-check
nx run lexico:dependency-check
nx run lexico-components:dependency-check

# Check all projects
nx run-many -t dependency-check --all
```

**CI:** `.github/workflows/dependency-check.yml` (runs on PR and push to main)

**Files Modified:**

- `.dependency-cruiser.cjs` (new)
- `applications/caelundas/project.json` (added target)
- `applications/lexico/project.json` (added target)
- `packages/lexico-components/project.json` (added target)
- `tools/code-generator/project.json` (added target)
- `.github/workflows/dependency-check.yml` (new)

---

### 2. npm audit (pnpm built-in)

**Purpose:** Scans for security vulnerabilities in dependencies

**Configuration:** Root `project.json`

**Targets:**

- `audit` (default: check) - Scan for vulnerabilities at moderate+ severity
- `audit:write` - Automatically fix vulnerabilities where possible

**Usage:**

```bash
# Check for vulnerabilities
nx run monorepo:audit

# Auto-fix vulnerabilities
nx run monorepo:audit:write
```

**CI:** `.github/workflows/security-audit.yml` (weekly on Mondays + PR checks)

**Results:** Fixed 16 vulnerabilities via package overrides in `package.json`

**Files Modified:**

- `project.json` (added targets)
- `package.json` (added 9 security overrides)
- `.github/workflows/security-audit.yml` (new)

---

### 3. npm-check-updates (v19.3.1)

**Purpose:** Automated dependency update checking

**Configuration:** `.ncurc.json`

**Usage:**

```bash
# Check for updates
nx run monorepo:dependency-lint

# Apply updates
nx run monorepo:dependency-lint:write
```

**CI:** `.github/workflows/dependency-updates.yml` (weekly on Mondays)

**Files Modified:**

- `.ncurc.json` (new)
- `project.json` (added dependency-lint target)
- `.github/workflows/dependency-updates.yml` (new)

---

## Performance & Quality

### 4. size-limit (v12.2.0)

**Purpose:** Bundle size tracking with performance budgets

**Configuration:** `applications/lexico/package.json`

**Limits:**

- JavaScript: 180KB (gzipped)
- CSS: 20KB (gzipped)

**Usage:**

```bash
# Check bundle size (requires build first)
nx run lexico:bundlesize
```

**CI:** `.github/workflows/bundlesize.yml` (runs on PR and push to main when lexico or lexico-components change)

**Note:** Replaced bundlesize due to Node 22 compatibility issues

**Files Modified:**

- `applications/lexico/package.json` (added size-limit config)
- `applications/lexico/project.json` (added bundlesize target)
- `.github/workflows/bundlesize.yml` (new)

---

### 5. type-coverage (v2.29.7)

**Purpose:** Measures TypeScript type safety coverage

**Configuration:** Each TypeScript project's `package.json`

**Baselines:**

- caelundas: 99.46%
- lexico: 99.36%
- lexico-components: 99.84%
- code-generator: 100%

**Features:**

- Strict mode enabled (counts type assertions as untyped)
- Ignores catch blocks
- Excludes test files and generated code
- Outputs detailed reports showing untyped locations

**Usage:**

```bash
# Check specific project
nx run caelundas:type-coverage
nx run lexico:type-coverage
nx run lexico-components:type-coverage
nx run code-generator:type-coverage

# Check all projects
nx run-many -t type-coverage --all
```

**CI:** `.github/workflows/type-coverage.yml` (runs on PR and push to main, uploads detailed reports as artifacts)

**Files Modified:**

- `applications/caelundas/package.json` (added typeCoverage config)
- `applications/caelundas/project.json` (added target)
- `applications/lexico/package.json` (added typeCoverage config)
- `applications/lexico/project.json` (added target)
- `packages/lexico-components/package.json` (added typeCoverage config)
- `packages/lexico-components/project.json` (added target)
- `tools/code-generator/package.json` (added typeCoverage config)
- `tools/code-generator/project.json` (added target)
- `.github/workflows/type-coverage.yml` (new)

---

### 6. cspell (v9.6.0)

**Purpose:** Spell checking across entire codebase

**Configuration:** `cspell.config.yaml`

**Features:**

- 100+ domain-specific words (astronomical terms, iCalendar, frameworks)
- Checks all TypeScript, JavaScript, Markdown, YAML, JSON files
- Ignores generated files, node_modules, planning docs

**Usage:**

```bash
# Check spelling
nx run monorepo:spell-check
```

**CI:** `.github/workflows/spell-check.yml`

**Results:** 239 files checked, 0 issues found

**Files Modified:**

- `cspell.config.yaml` (new)
- `project.json` (added spell-check target)
- `.github/workflows/spell-check.yml` (new)

---

### 7. markdownlint-cli2 (v0.20.0)

**Purpose:** Markdown linting and style enforcement

**Configuration:** `.markdownlint-cli2.jsonc`

**Key Rules:**

- Enforce fenced code blocks with language specs
- Enforce ATX-style headers (`#` not underlines)
- Use dashes for lists
- Allow HTML and bare URLs for flexibility
- No line length limits (too restrictive for technical docs)

**Configurations:**

- `check` - Lint without changes
- `fix` - Auto-fix issues

**Usage:**

```bash
# Check markdown
nx run monorepo:markdown-lint

# Auto-fix issues
nx run monorepo:markdown-lint:write
```

**CI:** `.github/workflows/markdown-lint.yml`

**Results:** Fixed 4 issues, 10 markdown files passing

**Files Modified:**

- `.markdownlint-cli2.jsonc` (new)
- `project.json` (added markdown-lint target)
- `.github/workflows/markdown-lint.yml` (new)
- `.github/copilot-instructions.md` (fixed code fence)
- `tools/README.md` (fixed 2 code fences)

---

## Documentation & Compliance

### 8. license-checker (v25.0.1)

**Purpose:** OSS license compliance auditing

**Configuration:** `.license-checker.json`

**Approved Licenses:**

- MIT
- Apache-2.0
- BSD-2-Clause, BSD-3-Clause
- ISC
- 0BSD
- CC0-1.0
- Unlicense
- Python-2.0
- CC-BY-3.0, CC-BY-4.0

**Usage:**

```bash
# Check production dependency licenses
nx run monorepo:license-check
```

**CI:** `.github/workflows/license-check.yml` (weekly on Mondays + PR checks)

**Results:** All 3 production dependencies compliant

**Files Modified:**

- `.license-checker.json` (new)
- `project.json` (added license-check target)
- `.github/workflows/license-check.yml` (new)

---

### 9. eslint-plugin-tsdoc (v0.5.0) + eslint-plugin-jsdoc (v62.3.0)

**Purpose:** TSDoc comment syntax validation and documentation enforcement

**Configuration:** `eslint.config.base.ts`

**Features:**

- Validates TSDoc syntax (`tsdoc/syntax` - warning)
- Requires documentation on exported items (`jsdoc/require-jsdoc` - warning)
  - Functions
  - Classes
  - Methods
  - Interfaces
  - Type aliases
  - Enums
- Excludes test files and private/internal code

**Usage:**

```bash
# Lint runs automatically with TSDoc checks
nx run caelundas:lint
nx run lexico:lint
nx run lexico-components:lint
nx run code-generator:lint
```

**Example:**

```typescript
/**
 * Calculates planetary aspects within a date range.
 *
 * @param startDate - Beginning of calculation period
 * @param endDate - End of calculation period
 * @returns Array of aspect events sorted chronologically
 *
 * @throws {ValidationError} If date range is invalid
 */
export function calculateAspects(
  startDate: Date,
  endDate: Date,
): AspectEvent[] {
  // ...
}
```

**Files Modified:**

- `eslint.config.base.ts` (added tsdoc and jsdoc plugins)

---

## Pre-commit Integration

All tools are automatically enforced via lint-staged on commit.

**Configuration:** `.lintstagedrc.ts`

### File Type Checks

**TypeScript/JavaScript** (`*.ts`, `*.tsx`, `*.js`, `*.jsx`):

- format (Prettier)
- lint (ESLint + TSDoc)
- typecheck (tsc)
- knip (dead code)
- type-coverage
- spell-check

**Configuration Files** (`*.json`, `*.yaml`, `*.yml`, `*.css`, `*.html`):

- format (Prettier)
- spell-check

**Markdown** (`*.md`):

- format (Prettier)
- lint (ESLint)
- spell-check
- markdown-lint

**Package Files** (`package.json`, `pnpm-workspace.yaml`):

- check-lockfile
- license-check

---

## Knip Configuration Updates

Added the following to `knip.json`:

**Ignored Dependencies:**

- `dependency-cruiser`
- `type-coverage`
- `license-checker`
- `eslint-plugin-tsdoc`
- `eslint-plugin-jsdoc`

**Ignored Binaries:**

- `depcruise`

These tools are used via npx or direct binary execution, so knip needs to know they're intentionally used.

---

## CI Workflows Summary

All workflows are in `.github/workflows/`:

### On Every PR + Push to Main

1. **lint.yml** - ESLint + TSDoc validation
2. **format.yml** - Prettier formatting check
3. **typecheck.yml** - TypeScript type checking
4. **test.yml** - Unit/integration/e2e tests with coverage
5. **knip.yml** - Dead code detection
6. **dependency-check.yml** - Architecture validation
7. **spell-check.yml** - Spelling validation
8. **markdown-lint.yml** - Markdown linting
9. **type-coverage.yml** - TypeScript coverage tracking (new)
10. **bundlesize.yml** - Bundle size limits (new, only when lexico changes)

### Weekly Scheduled

1. **security-audit.yml** - Vulnerability scanning (Mondays 6am UTC)
2. **dependency-updates.yml** - Update notifications (Mondays 10am UTC)
3. **license-check.yml** - License compliance (Mondays 9am UTC)

### Additional Triggers

- **security-audit.yml** - Also runs on every PR
- **license-check.yml** - Also runs on PRs that change package.json files
- **bundlesize.yml** - Only runs when lexico, lexico-components, or pnpm-lock.yaml change

---

## Impact Summary

### Security

- Weekly security audits via npm audit
- Automated dependency update tracking
- License compliance checking
- Fixed 16 security vulnerabilities

### Architecture

- Enforced dependency rules prevent circular dependencies
- Clear architectural boundaries
- No test code leaking into production

### Quality

- Type coverage tracked at 99%+ across all projects
- Spelling errors caught pre-commit
- Markdown standardized
- Documentation requirements enforced

### Performance

- Bundle size limits prevent bloat (180KB JS, 20KB CSS)

### Developer Experience

- All checks run automatically on commit
- Fast feedback via Nx caching
- Clear error messages
- Auto-fix available for many issues

---

## Maintenance & Execution Frequency

### Every Commit (Pre-commit Hooks)

#### Fast, Critical Quality Checks

- Format (Prettier) - Auto-fixes formatting
- Lint (ESLint) - Catches style violations and bugs
- Typecheck (TypeScript) - Ensures type safety
- Knip - Detects dead code
- Type coverage - Tracks type safety percentage
- Spell check - Catches typos
- Markdown lint - Enforces documentation standards

**Why:** These tools are fast (<30s), provide immediate feedback, and prevent low-quality code from being committed.

---

### Every PR + Push to Main (CI)

#### Comprehensive Validation

- All pre-commit tools (validate across all affected projects)
- Tests with coverage - Ensures code correctness
- Dependency check - Validates architecture
- Bundle size - Prevents performance regressions (lexico only)
- Security audit - Catches vulnerabilities early

**Why:** CI provides a safety net for multi-project changes, runs on fresh environment, and blocks merging problematic code.

**Execution Time:** 3-5 minutes (parallelized with Nx affected)

---

### Weekly (Scheduled)

#### Maintenance & Monitoring

- **Mondays 6am UTC:** Security audit
  - Checks for new CVEs in dependencies
  - Fixed 16 vulnerabilities historically
- **Mondays 9am UTC:** License compliance
  - Ensures all dependencies use approved licenses
  - Prevents legal issues
- **Mondays 10am UTC:** Dependency updates
  - Reports available package updates
  - Allows planned update cycles

**Why:** These checks don't need to run constantly:

- CVEs are published on a weekly cycle
- Dependency updates are disruptive (require testing)
- License changes are rare
- Weekly cadence balances freshness with noise

---

### Manual (On-Demand)

- `nx run monorepo:dependency-lint:write` - Apply dependency updates
- `nx run monorepo:audit:write` - Auto-fix vulnerabilities
- `nx run lexico:bundlesize` - Check bundle size locally
- Regenerate type coverage baselines after major refactors

---

## Execution Frequency Recommendations

### ✅ Run on Every PR/Push (Fast & Critical)

| Tool                 | Execution Time | Impact | Reason                                        |
| -------------------- | -------------- | ------ | --------------------------------------------- |
| TypeScript           | ~10s           | High   | Catches type errors immediately               |
| ESLint               | ~15s           | High   | Prevents bugs and enforces style              |
| Prettier             | ~5s            | Medium | Consistent formatting across team             |
| Knip                 | ~10s           | Medium | Detects unused code early                     |
| Tests                | ~30s           | High   | Ensures functionality                         |
| Spell check          | ~5s            | Low    | Catches typos in docs/comments                |
| Markdown lint        | ~3s            | Low    | Enforces documentation standards              |
| Dependency check     | ~8s            | Medium | Prevents circular deps                        |
| Type coverage        | ~10s           | Medium | Tracks type safety trends                     |
| Bundle size (lexico) | ~20s           | High   | Prevents performance regressions (when built) |

**Total:** ~3-5 minutes (parallelized with `--parallel=3`)

---

### 📅 Run Weekly (Slow or External Dependency)

| Tool               | Execution Time | Impact | Reason                                      |
| ------------------ | -------------- | ------ | ------------------------------------------- |
| Security audit     | ~30s           | High   | CVEs published weekly, not every commit     |
| License check      | ~10s           | Medium | Licenses rarely change                      |
| Dependency updates | ~15s           | Low    | Updates need planning, not immediate action |

**Why Weekly:**

- Security: CVE databases update on ~24-48 hour cycles, not instantaneously
- Dependencies: Update fatigue - checking every commit creates noise
- Licenses: License changes are rare events

---

### 🚫 Don't Run in CI (Manual/Local Only)

| Tool                    | Why Manual                                                 |
| ----------------------- | ---------------------------------------------------------- |
| `audit:write`           | May break builds, requires manual testing                  |
| `dependency-lint:write` | Requires thorough testing across all projects              |
| Baseline updates        | Type coverage baselines change with architecture refactors |

---

## Current Implementation Status

### ✅ Implemented

- All foundation tools (TypeScript, ESLint, Prettier, Knip)
- All security tools (dependency-cruiser, npm audit, license-checker)
- All quality tools (spell-check, markdown-lint, type-coverage, bundlesize)
- Pre-commit hooks via lint-staged
- 13 GitHub Actions workflows with proper triggers

### 📊 Metrics

- **Pre-commit time:** ~15-30s (only changed files)
- **CI time:** ~3-5 minutes (affected projects only)
- **Weekly checks:** ~1 minute total
- **Type coverage:** 99%+ across all projects
- **Zero security vulnerabilities** (16 fixed via overrides)
- **100% license compliance**

---

### Security & Architecture Links

- [Dependency Cruiser](https://github.com/sverweij/dependency-cruiser)
- [pnpm audit](https://pnpm.io/cli/audit)
- [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

### Performance & Quality Links

- [size-limit](https://github.com/ai/size-limit)
- [type-coverage](https://github.com/plantain-00/type-coverage)
- [cspell](https://cspell.org/)
- [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2)

### Documentation & Compliance Links

- [license-checker](https://www.npmjs.com/package/license-checker)
- [TSDoc Specification](https://tsdoc.org/)
- [eslint-plugin-tsdoc](https://www.npmjs.com/package/eslint-plugin-tsdoc)
- [eslint-plugin-jsdoc](https://www.npmjs.com/package/eslint-plugin-jsdoc)

### Foundation Tools

- [TypeScript](https://www.typescriptlang.org/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Knip](https://knip.dev/)
