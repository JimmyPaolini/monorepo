// Size-limit configuration for lexico
// Tracks client-side bundle sizes to prevent regressions.
// Run via: nx run lexico:bundlesize (which calls `npx size-limit`)
// Docs: https://github.com/ai/size-limit

module.exports = [
  {
    name: "Client JS",
    path: "../../dist/applications/lexico/client/assets/main-*.js",
    limit: "180 KB",
    gzip: true,
  },
  {
    name: "Client CSS",
    path: "../../dist/applications/lexico/client/assets/*.css",
    limit: "20 KB",
    gzip: true,
  },
];
