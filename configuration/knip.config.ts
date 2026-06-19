import type { KnipConfig } from "knip";

const config: KnipConfig = {
  $schema: "https://unpkg.com/knip@5/schema.json",

  // Globally ignored file patterns (tests, build output, caches)
  ignore: [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/dist/**",
    "**/node_modules/**",
    "**/.nx/**",
    "**/coverage/**",
    "notepads/**",
  ],

  // Binaries invoked via project.json targets or scripts, not imported in code
  ignoreBinaries: [
    "terraform", // Terraform CLI, used for infrastructure provisioning
    "oxfmt", // Oxfmt CLI, invoked via nx:run-commands oxfmt target
    "oxlint", // Oxlint CLI, invoked via nx:run-commands oxlint target
    "gitleaks", // Gitleaks CLI, used for detecting hardcoded secrets
    "trivy", // Trivy CLI, used for security scanning (container images & infrastructure)
    "uv", // uv Python package manager, used in lint-staged for nbstripout
    "unset", // Shell builtin, used in project.json pre-commit command
    "squawk",
  ],

  // devDependencies used via npx, CLI, or ESLint config (not directly imported)
  ignoreDependencies: [
    "@commitlint/config-conventional", // commitlint preset, referenced as string in extends array
    "@nx/eslint-plugin", // Loaded dynamically by Nx ESLint integration
    "@nx/js", // Nx JavaScript/TypeScript plugin (auto-detected by Nx)
    "@nx/web", // Nx web plugin (auto-detected by Nx)
    "@semantic-release/commit-analyzer", // semantic-release plugin, referenced in release.config.cjs
    "@semantic-release/github", // semantic-release plugin
    "@semantic-release/npm", // semantic-release plugin
    "@semantic-release/release-notes-generator", // semantic-release plugin
    "@swc/helpers", // SWC runtime helpers, required by @swc-node/register for compiled TS
    "commitlint-plugin-gitmoji", // commitlint plugin, referenced as string in plugins array
    "commitlint-plugin-tense", // commitlint plugin, referenced as string in plugins array
    "markdownlint-cli2", // Markdown linter CLI, invoked via nx:run-commands in project.json
    "pino-pretty", // Referenced as string transport target in LoggerService — knip can't trace string references
    "stylelint-config-standard", // stylelint preset, referenced as string in extends array
    "stylelint-config-tailwindcss", // stylelint preset, referenced as string in extends array
    "stylelint", // CSS linter CLI, invoked via nx:run-commands in project.json
    "tslib", // TypeScript helper library, implicit runtime dependency for compiled TS
    "unplugin-swc", // Vite plugin for SWC transformation with emitDecoratorMetadata support (caelundas/vitest.config.ts)
    "squawk-cli",
  ],

  // Allow exports that are only used in the same file (common for barrel re-exports)
  ignoreExportsUsedInFile: true,

  // JimmyPaolini is a GitHub profile page with no buildable code — skip analysis
  ignoreWorkspaces: ["applications/JimmyPaolini", "applications/affirmations"],

  workspaces: {
    // Root workspace: scripts, base configs, and Nx configuration files
    ".": {
      entry: [
        ".pnpmfile.mjs",
        "scripts/**/*.{js,mjs,ts,sh}",
        ".devcontainer/scripts/**/*.{js,mjs,ts,sh}",
        "configuration/vitest.config.ts",
        "configuration/commitlint.config.ts",
        "configuration/dependency-cruiser.cjs",
        "configuration/eslint.config.ts",
        "configuration/eslint.config.js",
        "configuration/lint-staged.config.ts",
        "configuration/oxfmt.config.ts",
        "configuration/oxlint.config.ts",
        ".fallowrc.jsonc", // fallow static analysis config
        "configuration/prettier.config.ts",
        "configuration/stylelint.config.cjs",
        "configuration/syncpack.config.cjs",
        "release.config.cjs",
        "validate-branch-name.config.cjs",
        ".pnpmfile.mjs",
      ],
      ignore: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/dist/**",
        "**/coverage/**",
        "applications/JimmyPaolini/**",
        // Skill scripts are invoked by the skill framework, not imported in code
        "**/.agents/skills/**/scripts/**",
        "**/.claude/skills/**/scripts/**",
        "**/.github/skills/**/scripts/**",
        "**/.opencode/skills/**/scripts/**",
        "**/documentation/skills/**/scripts/**",
      ],
      project: "**/*.{js,ts,mjs,cjs}",
    },

    // caelundas: Node.js CLI for astronomical calendar generation
    "applications/caelundas": {
      ignore: [
        "src/**/*.test.ts",
        "src/**/*.integration.test.ts",
        "src/**/*.end-to-end.test.ts",
        "src/**/*.constants.ts", // Standard module constants files (may be empty placeholders)
        "src/**/*.types.ts", // Standard module types files (may be empty placeholders)
        "src/modules/caelundas/caelundas.body-types.ts", // Split-out type surface not yet adopted by the wider module graph
        "output/**", // Generated calendar output files
        "testing/**", // Test fixtures and setup
      ],
      ignoreDependencies: [
        "pino-pretty", // Referenced as string transport target in LoggerService — knip can't trace string references
      ],
      project: "src/**/*.ts",
    },

    // lexico: TanStack Start SSR web application with Supabase backend
    "applications/lexico": {
      entry: [
        "src/client.tsx", // Client-side entry point
        "src/router.tsx", // TanStack Router configuration
        "src/routes/**/*.tsx", // File-based routing — all route files are entry points
      ],
      ignore: [
        "src/routeTree.gen.ts", // Auto-generated by TanStack Router
        "src/lib/database.types.ts", // Auto-generated by Supabase CLI
        "src/lib/auth.ts", // Supabase auth utilities (used at runtime)
        "src/lib/bookmarks.ts", // Bookmark feature module (used at runtime)
        "src/lib/supabase.ts", // Supabase client initialization (used at runtime)
        "src/components/entry/principal-parts.tsx", // Dynamic component loaded by route
      ],
      ignoreBinaries: [
        "supabase", // Supabase CLI, used for local dev and migrations
      ],
      project: "src/**/*.{ts,tsx}",
    },

    // lexico-components: Shared React component library (shadcn/ui)
    "packages/lexico-components": {
      entry: ["src/index.ts", "src/components/**/*.tsx", "vite.config.mts"],
      ignoreDependencies: ["tailwindcss-animate"],
      project: ["src/**/*.ts", "src/**/*.tsx", "vite.config.mts"],
    },

    // lexico-entities: Shared TypeORM entities
    "packages/lexico-entities": {
      entry: [
        "src/index.ts",
        "scripts/**/*.ts",
        "src/modules/database/data-source.ts",
        "src/modules/database/migrations/**/*.ts",
      ],
      ignoreDependencies: [
        "@testcontainers/postgresql", // Used by integration helper in packages/lexico-entities/testing (outside knip project scope)
        "pg", // TypeORM postgres driver — loaded dynamically by TypeORM, not directly imported
      ],
      ignore: [
        // TODO: re add these
        "src/**/*.constants.ts", // Standard module constants files (may be empty placeholders)
        "src/**/*.types.ts", // Standard module types files (may be empty placeholders)
        "src/modules/database/database.module.ts", // Conformance-generated module stub, not yet exported
        "src/modules/entities/entities.module.ts", // Conformance-generated module stub, not yet exported
      ],
      project: ["src/**/*.ts", "scripts/**/*.ts"],
    },

    // lexico-ingestion: Data ingestion CLI for the Lexico database
    "applications/lexico-ingestion": {
      ignore: [
        "src/**/*.test.ts",
        "src/**/*.integration.test.ts",
        "src/**/*.end-to-end.test.ts",
        "src/**/*.constants.ts", // Standard module constants files (may be empty placeholders)
        "src/**/*.types.ts", // Standard module types files (may be empty placeholders)
        "testing/**", // Test fixtures and setup
      ],
      ignoreDependencies: [
        "pino-pretty", // Referenced as string transport target in LoggerService — knip can't trace string references
        "tsx", // TypeScript executor CLI (not used; project uses @swc-node/register instead)
        "vitest", // Knip misses vitest usage because tests are ignored
      ],
      project: "src/**/*.ts",
    },

    // conformance: Nx generator plugin for scaffolding React components
    "tools/conformance": {
      entry: "src/generators/*/generator.ts", // Each generator's entry point
      ignore: [
        "src/**/templates/**", // Template files (EJS syntax, not valid TS)
        "src/**/*.test.ts",
      ],
      ignoreDependencies: [
        "@nestjs/common", // Peer dependency — consumed by generated NestJS modules, not the generator itself
        "@nestjs/config", // Peer dependency — consumed by generated NestJS modules, not the generator itself
        "react", // Peer dependency — consumed by generated components, not the generator itself
      ],
      project: "src/**/*.ts",
    },
  },
};

export default config;
