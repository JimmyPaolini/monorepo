import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/applications/lexico",
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": path.resolve(
        import.meta.dirname,
        "../../packages/lexico-components/src",
      ),
    },
  },
  server: {
    port: 3000,
    host: "localhost",
  },
  preview: {
    port: 3000,
    host: "localhost",
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    // React plugin must come after TanStack Start plugin
    react(),
  ],
  build: {
    outDir: "../../dist/applications/lexico",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  css: {
    devSourcemap: true,
  },
});
