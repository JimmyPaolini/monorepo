# Static Analysis Tools Implementation Plan

**Created:** January 21, 2026
**Status:** In Progress - Phase 3
**Updated:** January 21, 2026
**Priority:** High (Security), Medium (Quality), Low (Nice-to-have)

## Overview

This document outlines the implementation plan for integrating additional static code analysis tools into the monorepo. All tools will be integrated with NX for caching and affected command support, following existing patterns in the codebase.

## Implementation Priority

1. 🔴 **Phase 1: Security & Architecture** ✅ (High Priority)
   - Dependency Cruiser ✅
   - npm audit (via pnpm audit) ✅
   - npm-check-updates ✅

2. 🟡 **Phase 2: Performance & Quality** ✅ (Medium Priority)
   - ~~bundlesize (lexico only)~~ Replaced with size-limit ✅
   - size-limit (lexico only) ✅
   - type-coverage (baseline measurement first) ✅
   - cspell ✅

3. 🟢 **Phase 3: Documentation & Compliance** (Medium Priority)
   - TSDoc ESLint Plugin
   - markdownlint ✅
   - license-checker

---

## Phase 1: Security & Architecture

### 1.1 Dependency Cruiser ✅

**Status:** Completed January 21, 2026
**Purpose:** Validates architectural boundaries and dependency rules beyond NX module boundaries.

**Benefits:**

- Prevents circular dependencies
- Enforces layered architecture (e.g., domain → infrastructure, not vice versa)
- Generates visual dependency graphs
- Complements `@nx/enforce-module-boundaries`

**Installation:**

```bash
pnpm add -Dw dependency-cruiser
```

**Configuration:**

Create `.dependency-cruiser.cjs` in repository root:

```javascript
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies cause maintenance issues",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment: "Orphaned files may indicate dead code",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|cts|mts|json)$", // dot files
          "\\.d\\.ts$",
          "(^|/)tsconfig\\.json$",
          "(^|/)package\\.json$",
          "^applications/.+/vitest\\.config\\.ts$",
          "^applications/.+/project\\.json$",
        ],
      },
      to: {},
    },
    {
      name: "no-test-imports-in-app",
      severity: "error",
      comment: "Application code should not import test utilities",
      from: {
        pathNot: "\\.test\\.(ts|tsx)$",
      },
      to: {
        path: "(^|/)(testing|__tests__|__mocks__)/",
      },
    },
    {
      name: "not-to-dev-dep",
      severity: "error",
      comment: "Production code should not depend on devDependencies",
      from: {
        path: "^applications",
        pathNot: [
          "\\.test\\.(ts|tsx)$",
          "\\.spec\\.(ts|tsx)$",
          "(^|/)vitest\\.config",
        ],
      },
      to: {
        dependencyTypes: ["npm-dev"],
        pathNot: ["node_modules/@types/"],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "./tsconfig.base.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "^node_modules/[^/]+",
      },
      archi: {
        collapsePattern: "^(applications|packages)/[^/]+",
      },
    },
  },
};
```

**NX Integration:**

Add to `applications/caelundas/project.json`:

```json
{
  "targets": {
    "dependency-check": {
      "executor": "nx:run-commands",
      "options": {
        "command": "depcruise applications/caelundas/src --config .dependency-cruiser.cjs"
      },
      "cache": true,
      "inputs": [
        "default",
        "^default",
        "{projectRoot}/**/*.ts",
        "{projectRoot}/**/*.tsx"
      ],
      "description": "Validate dependency architecture"
    }
  }
}
```

Repeat for `lexico`, `lexico-components`, and root `project.json`.

**CI Integration:**

Create `.github/workflows/dependency-check.yml`:

```yaml
name: 🏗️ Dependency Architecture

on:
  push:
    branches:
      - main
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  setup:
    uses: ./.github/workflows/setup.yml

  dependency-check:
    name: 🏗️ Check Dependencies
    runs-on: ubuntu-latest
    needs: setup

    steps:
      - name: 📥 Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 📦 Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.20.0

      - name: 🟢 Setup node
        uses: actions/setup-node@v4
        with:
          node-version: 22.20.0
          cache: pnpm

      - name: 🎯 Set NX SHAs
        uses: nrwl/nx-set-shas@v4

      - name: ♻️ Restore cache
        uses: actions/cache/restore@v4
        with:
          path: .nx/cache
          key: ${{ needs.setup.outputs.cache-key }}

      - name: 📚 Install dependencies
        run: pnpm install --frozen-lockfile

      - name: 🏗️ Validate architecture
        run: npx nx affected -t dependency-check --parallel=3 --verbose
```

**Effort Estimate:** 4-6 hours (including rule refinement)

---

### 1.2 npm audit (Security Scanning)

**Purpose:** Built-in npm/pnpm vulnerability scanner - free, no account needed.

**Benefits:**

- No external accounts or tokens required
- Already integrated with pnpm
- Scans against npm's vulnerability database
- Can fail CI on high-severity issues

**Installation:**

No installation needed - `pnpm audit` is built-in.

**NX Integration:**

Add to root `project.json`:

```json
{
  "targets": {
    "audit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm audit --audit-level=high"
      },
      "description": "Scan for security vulnerabilities"
    },
    "audit-fix": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm audit --fix"
      },
      "description": "Automatically fix security vulnerabilities where possible"
    }
  }
}
```

**CI Integration:**

Create `.github/workflows/security-audit.yml`:

```yaml
name: 🔒 Security Audit

on:
  push:
    branches:
      - main
  pull_request:
  schedule:
    - cron: "0 6 * * 1" # Weekly Monday morning

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  audit:
    name: 🔒 Security Audit
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout repository
        uses: actions/checkout@v4

      - name: 📦 Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.20.0

      - name: 🟢 Setup node
        uses: actions/setup-node@v4
        with:
          node-version: 22.20.0
          cache: pnpm

      - name: 📚 Install dependencies
        run: pnpm install --frozen-lockfile

      - name: 🔒 Run security audit
        run: pnpm audit --audit-level=high
```

**Effort Estimate:** 1-2 hours

---

### 1.2 npm audit (Security Scanning) ✅

**Status:** Completed January 21, 2026
**Purpose:** Built-in npm/pnpm vulnerability scanner - free, no account needed.

---

### 1.3 npm-check-updates

**Purpose:** Automated dependency update checking and safe upgrade paths.

**Benefits:**

- Identifies outdated dependencies
- Suggests safe upgrade paths
- Can update package.json automatically
- Respects semver ranges

**Installation:**

```bash
pnpm add -Dw npm-check-updates
```

**Configuration:**

Create `.ncurc.json`:

```json
{
  "upgrade": false,
  "reject": ["@types/*"],
  "target": "minor",
  "workspaces": true,
  "root": true,
  "deep": true
}
```

**NX Integration:**

Add to root `project.json`:

```json
{
  "targets": {
    "check-updates": {
      "executor": "nx:run-commands",
      "options": {
        "command": "ncu --workspace --root --deep"
      },
      "description": "Check for dependency updates across all workspaces"
    },
    "update-deps": {
      "executor": "nx:run-commands",
      "options": {
        "command": "ncu --workspace --root --deep -u && pnpm install"
      },
      "description": "Update dependencies to latest versions"
    }
  }
}
```

**CI Integration:**

Create `.github/workflows/dependency-updates.yml`:

```yaml
name: 🔄 Dependency Updates

on:
  schedule:
    - cron: "0 10 * * 1" # Weekly Monday 10am
  workflow_dispatch: # Manual trigger

jobs:
  check-updates:
    name: 🔄 Check for Updates
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout repository
        uses: actions/checkout@v4

      - name: 📦 Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.20.0

      - name: 🟢 Setup node
        uses: actions/setup-node@v4
        with:
          node-version: 22.20.0
          cache: pnpm

      - name: 📚 Install dependencies
        run: pnpm install --frozen-lockfile

      - name: 🔄 Check for updates
        run: |
          pnpm exec ncu --workspace --root --deep --format group
          echo "Run 'nx run monorepo:update-deps' to apply updates"
```

**Effort Estimate:** 1-2 hours

---

### 1.3 npm-check-updates ✅

**Status:** Completed January 21, 2026
**Purpose:** Automated dependency update checking and safe upgrade paths.

---

## Phase 2: Performance & Quality

### 2.1 bundlesize

**Purpose:** Simple bundle size tracking with performance budgets.

**Target Projects:** `lexico` (web app), potentially `lexico-components` if published

**Installation:**

```bash
pnpm add -Dw size-limit @size-limit/preset-app @size-limit/file
```

**Configuration:**

Add to `applications/lexico/package.json`:

````json
{
  "size-limit": [
    {
      "name": "Client bundle",
      "path": "dist/public/**/*.js",
      "limit": "500 KB",
      "webpack": false,
      "gzip": true
    },
    {
      "name": "Critical CSS",
      "pbundlesize

**Purpose:** Advanced bundle size tracking with performance budgets and detailed analysis.

**Target Projects:** `lexico` only (web app)

**W

**Note:** These are **aspirational targets**. Measure actual bundle sizes after first build and adjust.hy Both bundlesize AND size-limit?**
- **bundlesize:** Simple, fast, GitHub status checks
- **size-limit:** Detailed analysis, loading time simulation, webpack/vite integration
- Use bundlesize for quick feedback, size-limit for deep analysis

**Installation:**

```bash
pnpm add -Dw bundlesize
````

**Configuration:**

Add to `applications/lexico/package.json`:

```json
{
  "bundlesize": [
    {
      "path": "./dist/public/**/*.js",
      "maxSize": "500 KB",
      "compression": "gzip"
    },
    {
      "path": "./dist/public/**/*.css",
      "maxSize": "50 KB",
      "compression": "gzip"
    }
  ]
}
```

Effort Estimate:\*\* 3-4 hours (including baseline establishment)

---

### 2.3 type-coverage

**Purpose:** Measures percentage of codebase with explicit type annotations.

**Target Projects:** All TypeScript projects

**Installation:**

```bash
pnpm add -Dw type-coverage
```

**Step 1: Measure Baseline**

Before setting targets, measure current coverage:

```bash
# In each project directory
cd applications/caelundas
npx type-coverage

cd ../lexico
npx type-coverage

cd ../../packages/lexico-components
npx type-coverage

cd ../../tools/code-generator
npx type-coverage
```

Record the baseline percentages, then set realistic targets (aim for +5-10% improvement).

**Configuration:**

Add to each project's `package.json` (example for caelundas):

```json
{
  "scripts": {
    "type-coverage": "type-coverage --at-least 90 --detail"
  },
  "typeCoverage": {
    "atLeast": 90,
    "ignoreCatch": true,
    "ignoreFiles": ["**/*.test.ts", "**/*.spec.ts", "**/testing/**"]
  }
}
```

**Note:** Replace `90` with actual baseline measurement + target improvement.yaml

- name: 📦 Check bundle size
  run: npx nx run lexico:bundlesize
  env:
  CI_REPO_OWNER: ${{ github.repository_owner }}
  CI_REPO_NAME: ${{ github.event.repository.name }}
  CI_COMMIT_MESSAGE: ${{ github.event.head_commit.message }}
  CI_COMMIT_SHA: ${{ github.sha }}
  CI: true

```

**Effort Estimate:** 2-3 hours

---

### 2.2 ath": "dist/public/**/*.css",
      "limit": "50 KB",
      "gzip": true
    }
  ]
}
```

**NX Integration:**

Add to `applications/lexico/project.json`:

```json
{
  "targets": {
    "size-check": {
      "executor": "nx:run-commands",
      "dependsOn": ["build"],
      "options": {
        "command": "size-limit",
        "cwd": "applications/lexico"
      },
      "cache": true,
      "inputs": ["default", "{projectRoot}/dist/**/*"],
      "description": "Check bundle size limits"
    }
  }
}
```

**CI Integration:**

Add to `.github/workflows/build.yml` (or create new workflow):

```yaml
- name: 📦 Check bundle size
  run: npx nx run lexico:size-check
```

**PR Comment Integration:**

Add to `.github/workflows/size-report.yml`:

```yaml
name: 📦 Bundle Size Report

on:
  pull_request:
    - ascendant
    - midheaven

    # Technical terms
    - monorepo
    - supabase
    - tanstack
    - shadcn
    - vite
    - vitest
    - pnpm
    - gitmoji

    # Acronyms
    - IANA
    - PNPM
    - SSR

# Allow camelCase splitting
allowCompoundWords: true
```

**NX Integration:**

Add to root `project.json`:

```json
{
  "targets": {
    "spell-check": {
      "executor": "nx:run-commands",
      "options": {
        "command": "cspell '**/*.{ts,tsx,js,jsx,md,mdx,json}' --no-progress --show-context"
      },
      "cache": true,
      "inputs": ["default", "{workspaceRoot}/cspell.config.yaml"],
      "description": "Check spelling in code and documentation"
    }
  }
}
```

**CI Integration:**

Create `.github/workflows/spell-check.yml`:

```yaml
name: 📝 Spell Check
 Phase 3: Documentation & Compliance

### 3.1 TSDoc ESLint Plugi
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm type-coverage",
        "cwd": "applications/caelundas"
      },
      "cache": true,
      "inputs": [
        "default",
        "{projectRoot}/**/*.ts",
        "{projectRoot}/**/*.tsx",
        "{projectRoot}/tsconfig.json"
      ],
      "description": "Check TypeScript type coverage"
    }
  }
}
```

Repeat for other TypeScript projects.

**CI Integration:**

Add to `.github/workflows/typecheck.yml`:

```yaml
- name: 📊 Check type coverage
  run: npx nx run-many -t type-coverage --all --parallel=3
```

Documentation & Compliance

### 3.1 TSDoc ESLint Plugin + Documentation Generation

**Purpose:** Enforce consistent API documentation and generate beautiful docs from code.

#### Part A: eslint-plugin-tsdoc (Linting)

**Installation:**

```bash
pnpm add -Dw eslint-plugin-tsdoc
```

**Configuration:**

Add to `eslint.config.base.ts`:

```typescript
import tsdoc from "eslint-plugin-tsdoc";

export default tseslint.config(
  // ... existing config
  {
    name: "tsdoc-rules",
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      tsdoc,
    },
    rules: {
      "tsdoc/syntax": "error",
    },
  },
);
```

**TSDoc vs JSDoc Key Differences:**standards in code comments.

| **Target Projects:** All TypeScript projects | TSDoc                           |
| -------------------------------------------- | ------------------------------- | ----------------------------- |
| **Spec**                                     | Informal, varies                | Official Microsoft spec       |
| **Type Info**                                | In comments (`@param {string}`) | From TypeScript types         |
| **Parser**                                   | Multiple (inconsistent)         | Single standardized parser    |
| **Focus**                                    | Type + description              | Description only              |
| **Tags**                                     | ~50+ tags                       | Core set of standardized tags |
| **Tooling**                                  | Spotty TS support               | First-class TS integration    |

**Standard TSDoc Tags:**

- `@param` - Parameter description (no types needed)
- `@returns` - Return value description
- `@remarks` - Additional details
- `@example` - Usage examples
- `@throws` - Exception descriptions
- `@see` - Cross-references
- `@public` / `@internal` - API visibility
- `@deprecated` - Deprecation notices
- `@beta` / `@alpha` - Release stages

**Example:**

````typescript
/**
 * Calculates planetary aspects within a date range.
 *
 * @param startDate - Beginning of calculation period
 * @param endDate - End of calculation period
 * @param options - Configuration for aspect calculations
 *
 * @returns Array of aspect events sorted chronologically
 *
 * @remarks
 * This function uses NASA JPL ephemeris data for accuracy.
 * Results are cached in SQLite for performance.
 *
 * @example
 * Calculate aspects for January 2026:
 * ```typescript
 * const aspects = await calculateAspects(
 *   new Date('2026-01-01'),
 *   new Date('2026-01-31'),
 *   { includeMinorAspects: true }
 * );
 * ```
 *
 * @throws {ValidationError}
 * Thrown if date range is invalid or exceeds 1 year
 *
 * @public
 */
export async function calculateAspects(
  startDate: Date,
  endDate: Date,
  options: AspectOptions
): Promise<AspectEvent[]> {
  // ...ation Site)

**Installation:**
```bash
pnpm add -Dw typedoc typedoc-plugin-markdown
````

**Purpose:**

- Generates beautiful static HTML documentation
- Works with TSDoc comments
- Can also output Markdown for wikis
- Searchable, themed, professional

**Configuration:**

Create `packages/lexico-components/typedoc.json`:

```json
{
  "entryPoints": ["./src/index.ts"],
  "out": "./docs",
  "plugin": ["typedoc-plugin-markdown"],
  "readme": "./README.md",
  "name": "Lexico Components",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeExternals": true,
  "categoryOrder": ["Components", "Hooks", "Utilities", "*"],
  "sort": ["source-order"],
  "searchInComments": true,
  "theme": "default"
}
```

**NX Integration:**

Add to `packages/lexico-components/project.json`:

```json
{
  "targets": {
    "docs": {
      "executor": "nx:run-commands",
      "dependsOn": ["build"],
      "options": {
        "command": "typedoc",
        "cwd": "packages/lexico-components"
      },
      "cache": true,
      "inputs": [
        "default",
        "{projectRoot}/src/**/*.ts",
        "{projectRoot}/src/**/*.tsx",
        "{projectRoot}/typedoc.json"
      ],
      "outputs": ["{projectRoot}/docs/"],
      "description": "Generate API documentation"
    }
  }
}
```

**Deploy to GitHub Pages (Optional):**

Add to `.github/workflows/docs.yml`:

```yaml
name: 📚 Documentation

on:
  push:
    branches:
      - main
    paths:
      - "packages/lexico-components/src/**"

jobs:
  build-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.20.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22.20.0
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: npx nx run lexico-components:docs
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./packages/lexico-components/docs
```

**Effort Estimate:**

- eslint-plugin-tsdoc: 1-2 hours
- API Extractor: 2-3 hours
- TypeDoc: 2-3 hours
- **Total: 5-8 hours**

---

### 3.2 markdownlint

**Purpose:** Comprehensive Markdown linting beyond ESLint's capabilities.

**Benefits:**

- Enforces consistent Markdown style
- Checks for broken links
- Validates heading hierarchy
- Auto-fix many issues
- More rules than ESLint markdown plugin

**Installation:**

```bash
pnpm add -Dw markdownlint-cli
```

**Configuration:**

Create `.markdownlint.json`:

```json
{
  "default": true,
  "MD003": { "style": "atx" },
  "MD007": { "indent": 2 },
  "MD013": { "line_length": 120, "code_blocks": false, "tables": false },
  "MD024": { "siblings_only": true },
  "MD033": false,
  "MD041": false,
  "no-hard-tabs": true,
  "whitespace": true
}
```

\*\*Create `.mnyk Security integration

- Day 5: npm-check-updates and CI workflows

**Week 3-4: Phase 2 (Performance & Quality)**

- Day 1: bundlesize for lexico
- Day 2: size-limit for lexico (deeper analysis)
- Day 3: type-coverage baseline for all projects
- Day 4-5: cspell setup and dictionary

**Week 5: Phase 3 (Documentation & Compliance)**

- Day 1-2: TSDoc ESLint Plugin + API Extractor
- Day 3: TypeDoc documentation generation
- Day 4: markdownlint
- Day 56 license-checker
  **NX Integration:**

Add to root `project.json`:

```json
{
  "targets": {
    "markdown-lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "markdownlint '**/*.md' --ignore-path .markdownlintignore"
      },
      "configurations": {
        "check": {
          "command": "markdownlint '**/*.md' --ignore-path .markdownlintignore"
        },
        "fix": {
          "command": "markdownlint '**/*.md' --ignore-path .markdownlintignore --fix"
        }
      },
      "defaultConfiguration": "check",
      "cache": true,
      "inputs": [
        "{workspaceRoot}/**/*.md",
        "!{workspaceRoot}/node_modules/**",
        "{workspaceRoot}/.markdownlint.json"
      ],
      "description": "Lint Markdown files"
    }
  }
- Regenerate API documentation for lexico-components
}
```

**CI Integration:**

Create `.github/workflows/markdown-lint.yml`:

```yaml
name: 📝 Markdown Lint

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  markdown-lint:
    name: 📝 Lint Markdown
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout repository
        uses: actions/checkout@v4

      - name: 📦 Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.20.0

      - name: 🟢 Setup node
        uses: actions/setup-node@v4
        with:
          node-version: 22.20.0
          cache: pnpm

      - name: 📚 Install dependencies
        run: pnpm install --frozen-lockfile

      - name: 📝 Lint Markdown
        run: npx nx run monorepo:markdown-lint
```

**lint-staged Integration:**

Add to `.lintstagedrc.ts`:

```typescript
{
  '*.md': [
    'markdownlint --fix',
  ],
}
```

**Effort Estimate:** 2-3 hours

---

### 3.3

--bundlesize and size-limit reports on PRs

- API Extractor validates no unintended API changes

## Phase 3: C security alerts

- Check npm-check-updates for dependency updateExperience

### 3.1 license-checker

**Purpose:** Audit and report on OSS licenses in dependencies.

**Installation:**

```bash
pnpm add -Dw license-checker
```

**Configuration:**

Add to root `project.json`:

```json
{
  "targets": {
    "license-check": {
      "executor": "nx:run-commands",
      "options": {
        "command": "license-checker --production --json --out licenses.json && license-checker --production --summary"
      },
      "description": "Check dependency licenses"
    }
  }
}
```

**Allowed Licenses Configuration:**

Create `scripts/check-licenses.sh`:

```bash
#!/bin/bash
set -e

# Allowed licenses for this project
ALLOWED_LICENSES=(
  "MIT"
  "Apache-2.0"
  "BSD-2-Clause"
  "BSD-3-Clause"
  "ISC"
  "CC0-1.0"
  "Unlicense"
  "0BSD"
)

echo "🔍 Checking dependency licenses..."

# Generate license report
pnpm exec license-checker \
  --production \
  --onlyAllow "$(IFS=';'; echo "${ALLOWED_LICENSES[*]}")" \
  --excludePackages "$(cat .licenseignore | tr '\n' ';')" \
  --summary

echo "✅ All licenses are compliant"
```

Create `.licenseignore`:

```
# Internal packages
@monorepo/*
```

**CI Integration:**

Run monthly or on dependency changes:

```yaml
name: 📜 License Check

on:
  schedule:
    - cron: "0 0 1 * *" # Monthly
  pull_request:
    paths:
      - "**/package.json"
      - "pnpm-lock.yaml"

jobs:
  license-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.20.0
      - name: 📜 Check licenses
        run: ./scripts/check-licenses.sh
```

**Effort Estimate:** 2-3 hours

---

## Integration Checklist

For each tool implemented:

- [ ] Install dependencies with `pnpm add -Dw`
- [ ] Create configuration file in repository root or project
- [ ] Add NX target to appropriate `project.json` files
- [ ] Enable caching in NX target (if applicable)
- [ ] Add GitHub Actions workflow
- [ ] Update `.lintstagedrc.ts` if tool should run pre-commit
- [ ] Document in `CONTRIBUTING.md` or tool-specific docs
- [ ] Add to monorepo README badges (optional)
- [ ] Test with `nx affected` and `nx run-many`
- [ ] Verify caching works (`nx run <target> --skip-nx-cache` then normal run)

---

## Testing Strategy

1. **Local Testing:**

   ```bash
   # Test individual tool
   nx run <project>:<target>

   # Test affected projects
   nx affected -t <target>

   # Test all projects
   nx run-many -t <target> --all

   # Verify caching
   nx run <project>:<target> # Should use cache on second run
   ```

```

2. **CI Testing:**
   - Create feature branch
   - Make small change to one project
   - Push and verify affected commands run correctly
   - Check workflow execution time (should be fast with caching)

3. **Integration Testing:**
   - Introduce intentional violation (e.g., circular dependency)
   - Verify tool catches it locally
   - Verify tool catches it in CI
   - Verify error message is clear

---

## Rollout Strategy

**Week 1-2: Phase 1 (Security & Architecture)**

- Day 1-2: Dependency Cruiser setup and rule refinement
- Day 3-4: Snyk Security integration
- Day 5: npm-check-updates and CI workflows

**Week 3-4: Phase 2 (Performance & Quality)**

- Day 1: bundlesize for lexico
- Day 2: size-limit for lexico (deeper analysis)
- Day 3: type-coverage baseline for all projects
- Day 4-5: cspell setup and dictionary

**Week 5: Phase 3 (Documentation & Compliance)**

- Day 1-2: TSDoc ESLint Plugin + API Extractor
- Day 3: TypeDoc documentation generation
- Day 4: markdownlint
- Day 5: license-checker

**Week 6: Refinement**

- Adjust thresholds based on findings
- Add project-specific rules
- Optimize CI performance

---

## Maintenance Plan

**Daily:**

- Pre-commit hooks run automatically
- Developers see tool output in terminal

**Per PR:**

- Implementation Approach:** One tool at a time, fully tested before moving to next.

**Week 1: Phase 1 (Security & Architecture)**

- Days 1-2: Dependency Cruiser (setup, config, NX integration, CI, test)
- Day 3: npm audit integration and CI workflow
- Day 4: npm-check-updates integration
- Day 5: Buffer/refinement

- Review Snyk security alerts
- Check npm-check-updates for dependency updates
- Update spell check dictionary if needed

**Monthly:**

- Licen4: Phase 3 (Documentation & Compliance)**

- Day 1: TSDoc ESLint Plugin
- Days 2-3: markdownlint
- Day 4: license-checker
- Day 5: Final testing and refinementness
- Remove/replace underperforming tools
- Upgrade tool versions

---

## Success Metrics

**Quantitative:**

- Zero circular dependencies detected (target: < 5 violations/month)
- Zero high-severity vulnerabilities in production (target: 0)
- Bundle size stays under limits (target: 100% compliance)
- Type coverage > 95% (target: increase 1% per quarter)
- Spelling errors caught pre-commit (target: 10+ per month)

**Qualitative:**

- Developers find tools helpful (survey after 1 month)
- PR reviews focus on logic, not style (fewer nitpicks)
- Onboarding time reduced (new devs catch  (lexico only)
---

## Estimated Total Effort
8-11 hours (Dependency Cruiser, Snyk, npm-check-updates)
- **Phasenpm audit security alerts
- Run npm-check-updates manually for dependency reviewTypeDoc, markdownlint, license-checker)
- **Testing & Refinement:** 6-10 hours

**Total:** 33-50 hours (~4-6 days of focused work, or 2-3
**Total:** 22-34 hours (~3-4 days of focused work, or 1-2 weeks part-time)

---


- [Dependency Cruiser Documentation](https://github.com/sverweij/dependency-cruiser)
- [Snyk Documentation](https://docs.snyk.io/)

- [npm-check-updates GitHub](https://github.com/raineorshine/npm-check-updates)
- [bundlesize GitHub](https://github.com/siddharthkp/bundlesize)
- [size-limit GitHub](https://github.com/ai/size-limit)
- [type-coverage GitHub](https://github.com/plantain-00/type-coverage)
- [cspell Configuration](https://cspell.org/configuration/)
- [TSDoc Specification](https://tsdoc.org/)
- [eslint-plugin-tsdoc](https://www.npmjs.com/package/eslint-plugin-tsdoc)
- [API Extractor](https://api-extractor.com/)
- [license-checker NPM](https://www.npmjs.com/package/license-checker
- [siSnyk Plan:\*\* Free tier sufficient, or upgrade to paid for advanced features?

2. **Type Coverage:** What's acceptable baseline? (Recommend measuring current level first, then set 90%+)
1. **Budget:** Is there budget for Snyk paid plan, or should we stick with Socket?
2. **Thresholds:** What's acceptable type coverage baseline? (Recommend starting at current level)
3. **Bundle Limits:** What's acceptable bundle size for lexico? (Suggest 500KB gzipped)
4. **Enforcement:** Should all checks be blocking in CI, or warnings initially?
5. **Scope:** Should code-generator project get full tool suite, or minimal?

---

## Next Steps

1. **Review this plan** with team and stakeholders
2. **Answer open questions** above
3. **Create GitHub issues** for each phase
4. **Assign ownership** for each tool implementation
5. **Schedule kickoff** for Phase 1
6. **Set up project board** to track progress
   8-11 hours (Dependency Cruiser, Snyk, npm-check-updates)

- **Phase 2:** 10-15 hours (bundlesize, size-limit, type-coverage, cspell)
- **Phase 3:** 9-14 hours (TSDoc/API Extractor/TypeDoc, markdownlint, license-checker)
- **Testing & Refinement:** 6-10 hourspnpm audit Documentation](https://pnpm.io/cli/audit
```
