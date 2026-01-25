import type { UserConfig } from "@commitlint/types";

const configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  plugins: ["commitlint-plugin-gitmoji", "commitlint-plugin-tense"],
  rules: {
    "subject-exclamation-mark": [0],
    "start-with-gitmoji": [2, "always"],

    // 💬 Enforce present imperative verb tense
    "tense/subject-tense": [
      2,
      "always",
      { allowedTenses: "present-imperative" },
    ],

    // 🏷️ Type enforcement
    "type-enum": [
      2,
      "always",
      [
        "build", // Changes that affect the build system or external dependencies
        "chore", // Other changes that don't modify src or test files
        "ci", // Changes to CI configuration files and scripts
        "docs", // Documentation only changes
        "feat", // A new feature
        "fix", // A bug fix
        "perf", // A code change that improves performance
        "refactor", // A code change that neither fixes a bug nor adds a feature
        "revert", // Reverts a previous commit
        "style", // Changes that do not affect the meaning of the code
        "test", // Adding missing tests or correcting existing tests
      ],
    ],

    // 🔭 Scope enforcement
    "scope-enum": [
      2,
      "always",
      [
        // 🕋 Root
        "monorepo", // Workspace root
        "applications", // All applications
        "packages", // All packages
        "tools", // Build or development tooling
        // 🏢 Projects
        "caelundas", // Caelundas application
        "lexico", // Lexico application
        "lexico-components", // Lexico components package
        "JimmyPaolini", // JimmyPaolini application
        // 🗑️ Other
        "documentation", // Documentation
        "dependencies", // Dependency updates
        "infrastructure", // Infrastructure changes
        "deployments", // CI/CD workflows
      ],
    ],

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
