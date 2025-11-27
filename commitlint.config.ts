import type { UserConfig } from "@commitlint/types";

const configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allow emoji in subject (after the colon)
    "subject-exclamation-mark": [0],
    // Type enforcement
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

    // Scope enforcement
    "scope-enum": [
      2,
      "always",
      [
        "monorepo", // Workspace root
        "caelundas", // Caelundas application
        "JimmyPaolini", // JimmyPaolini application
        "documentation", // Documentation
        "dependencies", // Dependency updates
        "infrastructure", // Infrastructure changes
        "ci", // CI/CD workflows
      ],
    ],

    // Length limits
    "header-max-length": [2, "always", 100],
    "body-max-length": [1, "always", 1000],

    // Case enforcement
    "type-case": [2, "always", "lower-case"],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "always", "lower-case"],

    // Format rules
    "subject-full-stop": [2, "never", "."],
    "subject-empty": [2, "never"],
    "body-leading-blank": [2, "always"],
    "footer-leading-blank": [2, "always"],
  },
};

export default configuration;
