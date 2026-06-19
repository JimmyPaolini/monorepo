// Fallow — Static analysis: dead code, duplication, health, and audit
// https://docs.fallow.tools/configuration/overview
//
// Fallow is an advisory-first static analysis tool that surfaces unused code,
// duplicate logic, cyclomatic/cognitive complexity, and regression gates.
// All rules default to "warn" so the baseline never blocks CI; tighten to
// "error" after each team review cycle.
//
// This is the first .mjs file in configuration/ — Fallow requires ESM format
// (.mjs or .fallowrc.json). Plain ESM default export; no TypeScript syntax.
//
// Related configs:
//   - configuration/knip.config.ts  — complementary dead-code analysis (unused exports/deps)
//   - configuration/oxlint.config.ts — primary linter (oxc rules)
//   - configuration/eslint.config.ts — supplementary linter (TypeScript, imports, etc.)
//
// Nx targets (to be added in TASK-004):
//   - `fallow` (check): `fallow check --config configuration/fallow.config.mjs`
//   - `fallow` with `--write` flag: auto-fixes where supported

/** @type {import('fallow').FallowConfig} */
const config = {
  // 🔖 Entry
  //
  // Root entry points fallow uses to resolve the module graph. Mirrors the
  // workspace-root entries in knip.config.ts so both tools agree on what
  // counts as "reachable" code.
  entry: [
    ".pnpmfile.mjs",
    "release.config.cjs",
    "validate-branch-name.config.cjs",
    // Configuration files (tools invoked via Nx run-commands)
    "configuration/vitest.config.ts",
    "configuration/commitlint.config.ts",
    "configuration/dependency-cruiser.cjs",
    "configuration/eslint.config.ts",
    "configuration/eslint.config.js",
    "configuration/lint-staged.config.ts",
    "configuration/oxfmt.config.ts",
    "configuration/oxlint.config.ts",
    "configuration/prettier.config.ts",
    "configuration/stylelint.config.cjs",
    "configuration/syncpack.config.cjs",
    "configuration/fallow.config.mjs",
    // Scripts (run directly — not imported by application code)
    "scripts/**/*.{js,mjs,ts,sh}",
    ".devcontainer/scripts/**/*.{js,mjs,ts,sh}",
    // Application source entry points (broad pattern; one per app)
    "**/src/main.ts",
  ],

  // 🚫 Ignore patterns
  //
  // Combined from: ESLint global ignores, Oxlint ignorePatterns, and knip
  // ignore list. Keeps fallow's module graph free of build artifacts,
  // generated files, external data, and vendored/scaffolded code that should
  // not be audited for dead code.
  ignorePatterns: [
    // Build artifacts and caches
    "**/dist/**",
    "**/node_modules/**",
    "**/.venv/**",
    "**/coverage/**",
    "**/.nx/**",
    "**/build/**",
    "**/tmp/**",
    "**/.terraform/**",
    // Minified and timestamp-stamped Vite/Vitest outputs
    "**/*.min.js",
    "**/vite.config.*.timestamp*",
    "**/vitest.config.*.timestamp*",
    // Lock files and generated changelogs (not owned code)
    "CHANGELOG.md",
    "**/pnpm-lock.yaml",
    // Templated/scaffolded source — generated, not authored
    "**/helm/**/templates/**",
    "**/conformance/**/templates/**",
    // Copilot orchestration scripts (not project source)
    "**/.agents/skills/**/scripts/**",
    "**/.claude/skills/**/scripts/**",
    "**/.github/skills/**/scripts/**",
    "**/.opencode/skills/**/scripts/**",
    "**/documentation/skills/**/scripts/**",
    ".github/skills/**",
    // Documentation skill bundles (markdown + assets, not TS/JS source)
    "documentation/skills/monitor-ci/**",
    "documentation/skills/nx-generate/**",
    "documentation/skills/nx-import/**",
    "documentation/skills/nx-plugins/**",
    "documentation/skills/nx-run-tasks/**",
    "documentation/skills/nx-workspace/**",
    "documentation/skills/link-workspace-packages/**",
    // External data corpora (large static files, not code)
    "**/data/wikipedia/**",
    "**/data/wiktionary/**",
    "**/data/library/**",
    "**/applications/lexico-ingestion/data/**",
    // Auto-generated constant files (literature/library ingestion data)
    "**/applications/lexico-ingestion/src/modules/literature/literature.constants.ts",
    "**/applications/lexico-ingestion/src/modules/library/library.constants.ts",
    "**/library.json",
    // Shadcn/ui and lexico-components vendored/generated UI code
    "**/packages/lexico-components/src/components/**",
    "**/packages/lexico-components/src/lib/**",
    "**/packages/lexico-components/src/hooks/**",
    // TanStack Router auto-generated route tree
    "**/src/routeTree.gen.ts",
    // Supabase auto-generated database types
    "**/src/lib/database.types.ts",
    // Applications excluded from analysis (Python notebook; static portfolio)
    "applications/JimmyPaolini/**",
    "applications/affirmations/**",
    // Local scratch space
    "notepads/**",
    // Copilot instructions file (markdown, not source)
    ".github/copilot-instructions.md",
    // Constant and type barrel files — legitimate internal re-exports
    "**/src/**/*.constants.ts",
    "**/src/**/*.types.ts",
    // Test infrastructure (fixtures, helpers, shared test utilities)
    "**/testing/**",
  ],

  // 🔍 Rules
  //
  // All rules are advisory ("warn") during initial baseline adoption.
  // The "error" level should be introduced incrementally after the team
  // reviews and suppresses legitimate false positives via ignoreExports /
  // ignoreFiles in TASK-003.
  rules: {
    // Reports files that are never imported or referenced from any entry point
    "unused-files": "warn",

    // Reports exported symbols (functions, classes, variables) that are never
    // consumed by any other file in the project
    "unused-exports": "warn",

    // Reports exported TypeScript type / interface declarations that are never
    // referenced — complements knip's type-unused detection
    "unused-types": "warn",

    // Reports package.json dependencies that are declared but never imported
    "unused-dependencies": "warn",

    // Reports import cycles — circular dependencies make tree-shaking harder
    // and signal design issues; advisory-only until graph is understood
    "circular-dependencies": "warn",

    // Reports imports that cannot be resolved to a file or package — catches
    // broken paths and missing dependencies early
    "unresolved-imports": "warn",

    // Disabled initially: flags private types that leak into public API surface.
    // Too noisy on a fresh baseline; enable after unused-types noise is cleared.
    "private-type-leaks": "off",
  },

  // 📋 Duplicates
  //
  // AST-based (not semantic) clone detection. "mild" mode uses token matching
  // which is fast and low-noise. Thresholds chosen to catch non-trivial
  // copy-paste while ignoring short utility snippets.
  duplicates: {
    // "mild" = token-based AST clone detection (faster, lower false-positive
    // rate than "strict" semantic matching)
    mode: "mild",

    // Minimum token count for a clone pair to be reported
    minTokens: 50,

    // Minimum line count for a clone pair to be reported
    minLines: 5,
  },

  // 🏥 Health
  //
  // Complexity gates applied per function. These thresholds are intentionally
  // higher than style-guide ideals so the first scan produces an actionable
  // report rather than a wall of noise.
  health: {
    // McCabe cyclomatic complexity — number of linearly independent paths
    // through a function. Tighten toward 10 as the codebase improves.
    maxCyclomatic: 20,

    // Cognitive complexity (Sonar model) — how hard the code is to understand.
    // Tighten toward 10 as refactoring progresses.
    maxCognitive: 15,
  },

  // 🔒 Audit
  //
  // Regression gate: only block on issues *introduced* by the current diff,
  // not the pre-existing baseline. This allows incremental adoption without
  // requiring a clean sweep before CI can enforce the tool.
  audit: {
    // "new-only" — fail only when a PR introduces NEW violations.
    // "all"      — fail when any violation exists (use after full cleanup).
    gate: "new-only",
  },

  // 🪟 Exports used in file
  //
  // When true, an export that is also consumed within the same file is NOT
  // flagged as unused. Matches knip's `ignoreExportsUsedInFile: true` to
  // avoid false positives on barrel re-export patterns like:
  //   export { Foo } from './foo';  // consumed by this barrel's own re-exports
  ignoreExportsUsedInFile: true,

  // 📦 Ignore dependencies
  //
  // Packages that fallow should treat as "used" even when they cannot be
  // traced through static imports. Mirrors the root `ignoreDependencies` list
  // in knip.config.ts and extends it with workspace-level suppressions that
  // are relevant at the monorepo root (since fallow operates as a single
  // root-level analysis, unlike knip which is workspace-scoped).
  ignoreDependencies: [
    "@commitlint/config-conventional", // commitlint preset, referenced as string in extends array
    "@nx/eslint-plugin", // Loaded dynamically by Nx ESLint integration
    "@nx/js", // Nx JavaScript/TypeScript plugin (auto-detected by Nx)
    "@nx/web", // Nx web plugin (auto-detected by Nx)
    "@semantic-release/changelog", // semantic-release plugin, referenced in release.config.cjs
    "@semantic-release/commit-analyzer", // semantic-release plugin, referenced in release.config.cjs
    "@semantic-release/git", // semantic-release plugin, referenced in release.config.cjs
    "@semantic-release/github", // semantic-release plugin, referenced in release.config.cjs
    "@semantic-release/npm", // semantic-release plugin, referenced in release.config.cjs
    "@semantic-release/release-notes-generator", // semantic-release plugin, referenced in release.config.cjs
    "@swc/helpers", // SWC runtime helpers, required by @swc-node/register for compiled TS
    "commitlint-plugin-gitmoji", // commitlint plugin, referenced as string in plugins array
    "commitlint-plugin-tense", // commitlint plugin, referenced as string in plugins array
    "markdownlint-cli2", // Markdown linter CLI, invoked via nx:run-commands in project.json
    "pg", // TypeORM postgres driver — loaded dynamically by TypeORM, not directly imported
    "pino-pretty", // Referenced as string transport target in LoggerService — fallow can't trace string references
    "squawk-cli", // CLI-only SQL linter, invoked via nx:run-commands in project.json
    "stylelint", // CSS linter CLI, invoked via nx:run-commands in project.json
    "stylelint-config-standard", // stylelint preset, referenced as string in extends array
    "stylelint-config-tailwindcss", // stylelint preset, referenced as string in extends array
    "tailwindcss-animate", // lexico-components peer dep, not directly imported — used via Tailwind plugin string reference
    "tslib", // TypeScript helper library, implicit runtime dependency for compiled TS
    "tsx", // TypeScript executor CLI, invoked via nx:run-commands; not imported in source
    "unplugin-swc", // Vite plugin for SWC transformation with emitDecoratorMetadata support
    "vitest", // Test runner — fallow misses usage because test files are excluded from analysis
  ],

  // 🚫 Ignore exports
  //
  // Named exports that should never be flagged as unused. Covers two categories:
  //
  //   1. Auto-generated files — content is owned by an external tool (TanStack
  //      Router, Supabase CLI) and cannot be modified; suppressing avoids noise.
  //
  //   2. Conformance-generated module stubs — TypeORM/NestJS modules scaffolded
  //      by the conformance generator that are consumed at runtime by the
  //      framework's DI container, not via static imports that fallow can trace.
  //
  // Matches the `ignore` lists in the per-workspace knip.config.ts entries.
  ignoreExports: [
    // TanStack Router auto-generated route tree
    { file: "**/src/routeTree.gen.ts", exports: ["*"] },
    // Supabase auto-generated database types
    { file: "**/src/lib/database.types.ts", exports: ["*"] },
    // Supabase auth/bookmark/client utilities (used at runtime, not via static import)
    { file: "**/src/lib/auth.ts", exports: ["*"] },
    { file: "**/src/lib/bookmarks.ts", exports: ["*"] },
    { file: "**/src/lib/supabase.ts", exports: ["*"] },
    // lexico-entities TypeORM module stubs (conformance-generated, consumed by NestJS DI)
    { file: "**/src/modules/database/database.module.ts", exports: ["*"] },
    { file: "**/src/modules/entities/entities.module.ts", exports: ["*"] },
  ],

  // 📦 Public packages
  //
  // Packages whose exports are part of the public API surface and should
  // always be treated as "used" regardless of internal consumers.
  // lexico-components exports are internal-only for now; add packages here
  // once a public NPM release is planned (TASK-003 will revisit).
  publicPackages: [],
};

export default config;
