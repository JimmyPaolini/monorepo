/**
 * Dependency Cruiser Configuration
 *
 * Validates architectural boundaries and prevents problematic dependency patterns
 * across the monorepo. Rules enforce circular dependency prevention, orphan detection,
 * test isolation, production/dev dependency separation, and module system consistency.
 *
 * Each rule's `comment` field documents its purpose.
 *
 * Usage:
 *   nx run <project>:dependency-cruiser
 *
 * CI: Runs automatically via .github/workflows/analyze-code.yml
 *     (on PRs affecting source files + weekly scheduled run)
 *
 * @type {import('dependency-cruiser').IConfiguration}
 * @see https://github.com/sverweij/dependency-cruiser
 */
const path = require("node:path");

module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies cause maintenance issues",
      from: {
        // TypeORM bidirectional entity relations (ManyToMany, OneToMany) require
        // value imports of the related entity class for decorator callbacks.
        // These intra-package cycles are intentional and unavoidable.
        pathNot: "^packages/lexico-entities/src/modules/entities/",
      },
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
          String.raw`(^|/)\.[^/]+\.(js|cjs|mjs|ts|cts|mts|json)$`,
          String.raw`(^|/)package\.json$`,
          String.raw`(^|/)tsconfig\.json$`,
          String.raw`\.d\.ts$`,
          String.raw`^applications/.+/project\.json$`,
          String.raw`^applications/.+/vitest\.config\.ts$`,
          String.raw`^applications/lexico-ingestion/src/modules/.+\.(types|constants)\.ts$`,
          String.raw`^documentation/.*\.md$`,
          String.raw`^packages/.+/project\.json$`,
          String.raw`^planning/.*\.md$`,
          String.raw`^scripts/.*\.sh$`,
          String.raw`^tools/.+/project\.json$`,
        ],
      },
      to: {},
    },
    {
      name: "no-test-imports-in-app",
      severity: "error",
      comment: "Application code should not import test utilities",
      from: {
        pathNot: String.raw`\.test\.(ts|tsx)$`,
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
          String.raw`\.test\.(ts|tsx)$`,
          String.raw`\.spec\.(ts|tsx)$`,
          "(^|/)testing/",
          "(^|/)tests/",
          "(^|/)__tests__/",
          "(^|/)__mocks__/",
          String.raw`(^|/)vitest\.config`,
          String.raw`(^|/)vite\.config`,
        ],
      },
      to: {
        dependencyTypes: ["npm-dev"],
        pathNot: ["node_modules/@types/"],
      },
    },
    {
      name: "no-esm-in-cjs",
      severity: "error",
      comment: "Don't import ESM in CommonJS files",
      from: {
        path: String.raw`\.cjs$`,
      },
      to: {
        path: String.raw`\.mjs$`,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      path: [
        // Build outputs should not be analyzed
        "^dist/",
        // Generator template files are not valid TS/JS
        "/files/",
        "__[a-zA-Z]+__",
        // Auto-generated files may have circular deps
        String.raw`\.gen\.(ts|tsx|js|jsx)$`,
      ],
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: path.join(__dirname, "tsconfig.base.json"),
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
