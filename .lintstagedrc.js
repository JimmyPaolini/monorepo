import { relative } from "node:path";

export default {
  "*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}": (files) => {
    // Convert absolute paths to relative paths for Nx
    const relativePaths = files.map((file) => relative(process.cwd(), file));
    return [
      `nx affected --target=typecheck --files=${relativePaths.join(",")}`,
      `nx affected --target=lint --files=${relativePaths.join(",")}`,
      `nx affected --target=format --files=${relativePaths.join(",")}`,
    ];
  },

  "*.{json,jsonc,json5,md,yml,yaml,css,scss,html}": (files) => {
    const relativePaths = files.map((file) => relative(process.cwd(), file));
    return `nx affected --target=format --files=${relativePaths.join(",")}`;
  },
};
