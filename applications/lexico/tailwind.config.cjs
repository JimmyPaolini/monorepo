const path = require("node:path");

const baseConfig = require("../../packages/lexico-components/tailwind.config.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: [
    path.join(__dirname, "src/**/*.{js,ts,jsx,tsx,html}"),
    path.join(
      __dirname,
      "../../packages/lexico-components/src/**/*.{js,ts,jsx,tsx}",
    ),
  ],
};
