import baseConfig from "../../configuration/eslint.config.base.ts";

export default [
  ...baseConfig,
  {
    ignores: ["**/templates/**"],
  },
  {
    files: ["**/*.{json}"],
    rules: {
      "@nx/dependency-checks": [
        "error",
        {
          ignoredFiles: ["{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}"],
          ignoredDependencies: ["lodash"],
        },
      ],
    },
  },
];
