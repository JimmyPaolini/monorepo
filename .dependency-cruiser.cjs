/** @type {import('dependency-cruiser').IConfiguration} */
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
          "^packages/.+/project\\.json$",
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
