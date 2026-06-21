import { builtinModules } from "node:module";

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import packageJson from "./package.json" with { type: "json" };

export default defineConfig({
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: "packages/lexico-entities/src/index.ts",
      fileName: "index",
      formats: ["es", "cjs"],
    },
    outDir: "dist/packages/lexico-entities",
    reportCompressedSize: true,
    rolldownOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        ...Object.keys(packageJson.dependencies),
        /^@nestjs\/.*/,
        /^typeorm.*/,
      ],
    },
  },
  plugins: [tsconfigPaths()],
});
