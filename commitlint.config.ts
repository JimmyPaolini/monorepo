import { scopes, types } from "./conventional.config.cjs";

import type { UserConfig } from "@commitlint/types";

const configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  plugins: ["commitlint-plugin-gitmoji", "commitlint-plugin-tense"],
  rules: {
    // ❗ Breaking change
    "subject-exclamation-mark": [0],

    // 😀 Enforce gitmoji at start of commit message
    "start-with-gitmoji": [2, "always"],

    // 💬 Enforce grammatical tense
    "tense/subject-tense": [
      2,
      "always",
      { allowedTenses: ["present-imperative"] },
    ],

    // 🏷️ Enforce enums
    "type-enum": [2, "always", [...(types as string[])]],
    "scope-enum": [2, "always", [...(scopes as string[])]],

    // 📏 Limit lengths
    "header-max-length": [2, "always", 100],
    "body-max-length": [1, "always", 1000],

    // 🦶 Forbid footer
    "footer-empty": [2, "always"],

    // 🔡 Enforce case
    "type-case": [2, "always", "lower-case"],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "always", "lower-case"],

    // 🎨 Format rules
    "subject-full-stop": [2, "never", "."],
    "subject-empty": [2, "never"],
    "body-leading-blank": [2, "always"],
  },
};

export default configuration;
