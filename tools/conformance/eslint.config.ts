import baseConfig from "../../configuration/eslint.config.ts";

export default [
  // 🛠️ Base Config
  ...baseConfig,

  // 🚫 Project Ignores
  // Exclude scaffold template files (these are not linted as project source)
  {
    ignores: ["**/templates/**"],
  },

  // 📦 Dependency Checks
  {
    files: ["**/*.json"],
    rules: {
      "@nx/dependency-checks": [
        "error",
        {
          ignoredDependencies: [
            "@nestjs/common",
            "@types/mustache",
            "lodash",
            "react",
          ],
          ignoredFiles: [
            "{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}",
            "{projectRoot}/src/generators/**/templates/**",
          ],
        },
      ],
    },
  },
];
