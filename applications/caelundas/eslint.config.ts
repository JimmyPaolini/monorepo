import baseConfig from "../../configuration/eslint.config.base.ts";

export default [
  ...baseConfig,
  {
    files: ["**/*.{json}"],
    rules: {
      "@nx/dependency-checks": ["error", {}],
    },
  },
];
