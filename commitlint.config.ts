import { scopes, types } from "./conventional.config.cjs";

import type { UserConfig } from "@commitlint/types";

const configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  plugins: ["commitlint-plugin-gitmoji", "commitlint-plugin-tense"],
  rules: {
    // ❗
    "subject-exclamation-mark": [0],
    // 😀 Enforce gitmoji at start of commit message
    "start-with-gitmoji": [2, "always"],

    // 💬 Enforce present imperative verb tense
    "tense/subject-tense": [
      2,
      "always",
      { allowedTenses: ["present-imperative"] },
    ],

    // 🏷️ Type enforcement
    "type-enum": [2, "always", [...(types as string[])]],

    // 🔭 Scope enforcement
    "scope-enum": [2, "always", [...(scopes as string[])]],

    // 📏 Length limits
    "header-max-length": [2, "always", 100],
    "body-max-length": [1, "always", 1000],

    // 🔡 Case enforcement
    "type-case": [2, "always", "lower-case"],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "always", "lower-case"],

    // 🎨 Format rules
    "subject-full-stop": [2, "never", "."],
    "subject-empty": [2, "never"],
    "body-leading-blank": [2, "always"],
    "footer-leading-blank": [2, "always"],
  },
};

export default configuration;
