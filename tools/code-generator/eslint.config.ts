import baseConfig from "../../configuration/eslint.config.base.ts";

export default [
  ...baseConfig,
  {
    ignores: ["**/templates/**", "**/.venv/**"],
  },
  {
    files: ["**/*.json"],
    rules: {
      "@nx/dependency-checks": [
        "error",
        {
          ignoredFiles: ["{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}"],
          ignoredDependencies: ["@types/ejs", "@types/mustache", "lodash"],
        },
      ],
    },
  },
];
