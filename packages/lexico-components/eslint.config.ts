import baseConfig from "../../eslint.config.base.ts";

export default [
  ...baseConfig,
  {
    ignores: [
      "src/components",
      "src/lib/utils",
      "src/components/ui",
      "src/lib",
      "src/hooks",
    ],
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
            "vite-plugin-dts",
            "@nx/vite",
          ],
        },
      ],
    },
  },
];
