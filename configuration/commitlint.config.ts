/**
 * Commitlint configuration — enforces Conventional Commits with Gitmoji support.
 *
 * Commit format: `<type>(<scope>): <gitmoji> <subject>`
 *
 * - Header max: 128 characters (aim for &lt;72 for readability)
 * - Body: allowed for Co-authored-by trailers (added by GitHub Copilot agents); footer: forbidden
 * - Subject: lowercase, imperative mood, no trailing period
 * - Gitmoji required at start of subject
 *
 * Types and scopes are defined in conventional.config.cjs.
 * See: documentation/skills/commit-code/SKILL.md for full documentation.
 */
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
    "type-enum": [2, "always", [...types.map((type) => type.name)]],
    "scope-enum": [2, "always", [...scopes.map((scope) => scope.name)]],

    // 📏 Limit lengths
    "header-max-length": [2, "always", 128],

    // 🚫 Forbid footer; allow Co-authored-by trailers in body (added by GitHub Copilot agents)
    "body-empty": [0, "always"],
    "footer-empty": [2, "always"],

    // 🔡 Enforce case
    "type-case": [2, "always", "lower-case"],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "always", "lower-case"],

    // 🎨 Format rules
    "subject-full-stop": [2, "never", "."],
    "subject-empty": [2, "never"],
  },
};

export default configuration;
