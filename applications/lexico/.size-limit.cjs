// Size-limit configuration for lexico
// Tracks client-side bundle sizes to prevent regressions.
// Run via: nx run lexico:bundlesize (which calls `npx size-limit`)
// Docs: https://github.com/ai/size-limit

module.exports = [
  {
    gzip: true,
    limit: "180 KB",
    name: "Client JS",
    path: "../../dist/applications/lexico/client/assets/index-*.js",
  },
  {
    gzip: true,
    limit: "20 KB",
    name: "Client CSS",
    path: "../../dist/applications/lexico/client/assets/*.css",
  },
];
