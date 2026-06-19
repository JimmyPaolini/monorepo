/// <reference types='vitest' />
import path from "node:path";

import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(() => ({
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    emptyOutDir: true,
    lib: {
      entry: "src/index.ts",
      fileName: "index",
      formats: ["es" as const],
      name: "lexico-components",
    },
    outDir: "../../dist/packages/lexico-components",
    reportCompressedSize: true,
    rolldownOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", /^@radix-ui\/.*/],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  cacheDir: "../../node_modules/.vite/packages/lexico-components",
  plugins: [
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(["*.md"]),
    dts({
      entryRoot: "src",
      pathsToAliases: false,
      tsconfigPath: path.join(import.meta.dirname, "tsconfig.json"),
    }),
  ],
  root: import.meta.dirname,
}));
