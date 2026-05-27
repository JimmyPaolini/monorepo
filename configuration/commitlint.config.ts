/**
 * Commitlint configuration — enforces Conventional Commits with Gitmoji support.
 *
 * Commit format: `<type>(<scope>): <gitmoji> <subject>`
 *
 * - Header max: 128 characters (aim for &lt;72 for readability)
 * - Body: forbidden unless every line is a `Co-authored-by:` trailer (added by GitHub Copilot agents)
 * - Footer: forbidden
 * - Subject: lowercase, imperative mood, no trailing period
 * - Gitmoji required at start of subject
 *
 * Types and scopes are defined in conventional.config.cjs.
 * See: documentation/skills/commit-code/SKILL.md for full documentation.
 */
import { scopes, types } from "./conventional.config.cjs";

import type { Plugin, Rule, RuleOutcome, UserConfig } from "@commitlint/types";

/** Every non-empty body line must be a `Co-authored-by:` trailer. */
const bodyCoAuthoredOnly: Rule = (parsed): RuleOutcome => {
  const body: string | null = parsed.body as string | null;
  if (!body) return [true];
  const lines = body.split("\n").filter((line: string) => line.trim() !== "");
  const allCoAuthored = lines.every((line: string) =>
    /^Co-authored-by: \S+/.test(line),
  );
  return [
    allCoAuthored,
    "Body must be empty or contain only Co-authored-by trailers",
  ];
};

const coAuthoredPlugin: Plugin = {
  rules: { "body-co-authored-only": bodyCoAuthoredOnly },
};

const configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    "commitlint-plugin-gitmoji",
    "commitlint-plugin-tense",
    coAuthoredPlugin,
  ],
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

    // 🚫 Forbid footer; body allowed only for Co-authored-by trailers (added by GitHub Copilot agents)
    "body-co-authored-only": [2, "always"],
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
