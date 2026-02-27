import baseConfig from "../../eslint.config.base.ts";

export default [
  ...baseConfig,
  {
    // Ignore Supabase Edge Functions (Deno runtime, separate tsconfig) and generated files
    ignores: ["supabase/functions/**", "src/routeTree.gen.ts"],
  },
  {
    files: ["**/*.json"],
    rules: {
      "@nx/dependency-checks": [
        "error",
        {
          ignoredFiles: [
            "{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}",
            "{projectRoot}/vite.config.{js,ts,mjs,mts}",
          ],
          ignoredDependencies: [
            "vite",
            "@vitejs/plugin-react",
            "vite-tsconfig-paths",
            "lodash",
          ],
        },
      ],
    },
  },
];
