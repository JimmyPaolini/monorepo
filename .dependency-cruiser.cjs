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
 *   nx run <project>:dependency-analysis
 *
 * CI: Runs automatically via .github/workflows/dependency-analysis.yml
 *     (on PRs affecting source files + weekly scheduled run)
 *
 * @type {import('dependency-cruiser').IConfiguration}
 * @see https://github.com/sverweij/dependency-cruiser
 */
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
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|cts|mts|json)$",
          "(^|/)package\\.json$",
          "(^|/)tsconfig\\.json$",
          "\\.d\\.ts$",
          "^applications/.+/project\\.json$",
          "^applications/.+/vitest\\.config\\.ts$",
          "^documentation/.*\\.md$",
          "^packages/.+/project\\.json$",
          "^planning/.*\\.md$",
          "^scripts/.*\\.sh$",
          "^tools/.+/project\\.json$",
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
          "(^|/)testing/",
          "(^|/)tests/",
          "(^|/)__tests__/",
          "(^|/)__mocks__/",
          "(^|/)vitest\\.config",
          "(^|/)vite\\.config",
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
        path: "\\.cjs$",
      },
      to: {
        path: "\\.mjs$",
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
        "\\.gen\\.(ts|tsx|js|jsx)$",
      ],
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
