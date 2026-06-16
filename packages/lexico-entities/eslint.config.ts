import baseConfig from "../../configuration/eslint.config.ts";

export default [
  // 🙈 Ignores
  { ignores: ["src/modules/database/migrations/**"] },

  // 🛠️ Base Config
  ...baseConfig,

  // 📦 Dependency Checks
  {
    files: ["**/*.json"],
    rules: {
      "@nx/dependency-checks": [
        "error",
        {
          ignoredDependencies: [
            "vite",
            "@nx/vite",
            "typescript",
            "pg",
            "@nestjs/core",
          ],
          ignoredFiles: [
            "{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}",
            "{projectRoot}/vite.config.{js,ts,mjs,mts}",
          ],
        },
      ],
    },
  },
];
