// Size-limit configuration for lexico-components
// Tracks shared component library bundle size to prevent regressions.
// Run via: nx run lexico-components:bundlesize (which calls `npx size-limit`)
// Docs: https://github.com/ai/size-limit

module.exports = [
  {
    name: "Library bundle",
    path: "../../dist/packages/lexico-components/index.js",
    limit: "25 KB",
    gzip: true,
  },
];
