import { builtinModules } from "node:module";

import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { defineConfig } from "vite";

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
  plugins: [nxViteTsPaths()],
});
