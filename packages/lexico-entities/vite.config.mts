import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [nxViteTsPaths()],
  build: {
    lib: {
      entry: "packages/lexico-entities/src/index.ts",
      fileName: "index",
      formats: ["es", "cjs"],
    },
    outDir: "dist/packages/lexico-entities",
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
