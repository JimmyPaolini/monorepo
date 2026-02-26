import path from "node:path";
import { fileURLToPath } from "node:url";

import eslint from "@eslint/js";
import markdown from "@eslint/markdown";
import nxPlugin from "@nx/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import jsdocPlugin from "eslint-plugin-jsdoc";
import jsoncPlugin from "eslint-plugin-jsonc";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tsdocPlugin from "eslint-plugin-tsdoc";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintPluginYml from "eslint-plugin-yml";
import tseslint from "typescript-eslint";

import type { ConfigWithExtends } from "typescript-eslint";

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...([] as any[]),

  // ━━━━━━━━━━━━━━━━━━━ Global Ignores ━━━━━━━━━━━━━━━━━━━
  // Patterns excluded from ALL linting (build output, generated code, locks)
  {
    ignores: [
      "**/dist",
      "**/node_modules",
      "**/coverage",
      "**/.nx",
      "**/build",
      "**/tmp",
      "**/*.min.js",
      "**/vite.config.*.timestamp*",
      "**/vitest.config.*.timestamp*",
      "lint-staged.config.ts",
      // Shadcn generated components
      "packages/lexico-components/src/components",
      "packages/lexico-components/src/lib/utils",
      "packages/lexico-components/src/components/ui",
      "packages/lexico-components/src/lib",
      "packages/lexico-components/src/hooks",
      // Lock files and Helm templates use formats that can't be linted
      "**/pnpm-lock.yaml",
      "**/helm/**/templates/**",
      // Terraform providers and generated files
      "**/.terraform/**",
      ".github/copilot-instructions.md",
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━ Base ESLint Recommended ━━━━━━━━━━━━━━━━━━━
  // Core ESLint recommended rules applied to all non-markdown source files
  {
    ...eslint.configs.recommended,
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.mts",
      "**/*.cts",
      "**/*.js",
      "**/*.mjs",
      "**/*.cjs",
      "**/*.jsx",
      "**/*.json",
      "**/*.jsonc",
      "**/*.json5",
      "**/*.yaml",
      "**/*.yml",
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━ Nx Plugin ━━━━━━━━━━━━━━━━━━━
  // Module boundary enforcement and dependency validation
  ...nxPlugin.configs["flat/base"],
  ...nxPlugin.configs["flat/typescript"],
  ...nxPlugin.configs["flat/javascript"],

  // ━━━━━━━━━━━━━━━━━━━ Unicorn Recommended Rules ━━━━━━━━━━━━━━━━━━━
  // Code quality and modern JavaScript patterns
  {
    ...eslintPluginUnicorn.configs.recommended,
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.mts",
      "**/*.cts",
      "**/*.js",
      "**/*.mjs",
      "**/*.cjs",
      "**/*.jsx",
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━ Unicorn Rule Overrides ━━━━━━━━━━━━━━━━━━━
  // Disable rules that conflict with existing conventions
  {
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.mts",
      "**/*.cts",
      "**/*.js",
      "**/*.mjs",
      "**/*.cjs",
      "**/*.jsx",
    ],
    rules: {
      // PascalCase React components and kebab-case filenames are used throughout
      "unicorn/filename-case": "off",
      // null is used extensively in the codebase (React refs, database nulls, API contracts)
      "unicorn/no-null": "off",
      // Common abbreviations are acceptable (ctx, env, req, res, db, fn)
      "unicorn/prevent-abbreviations": "off",
      // reduce() is used in pipeline transformations and aggregations
      "unicorn/no-array-reduce": "off",
      // forEach() is acceptable for imperative operations with side effects
      "unicorn/no-array-for-each": "off",
      // CJS config files exist (.cjs extensions for tools that don't support ESM)
      "unicorn/prefer-module": "off",
      // CLI applications (caelundas) use process.exit() for clean shutdown
      "unicorn/no-process-exit": "off",
      // Not all entry points support top-level await (CJS configs, legacy tooling)
      "unicorn/prefer-top-level-await": "off",
      // ESLint core rule no-nested-ternary already handles this
      "unicorn/no-nested-ternary": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ Unicorn Test File Relaxations ━━━━━━━━━━━━━━━━━━━
  // Allow test-specific patterns
  {
    files: ["**/*.test.ts", "**/*.spec.ts", "**/testing/**"],
    rules: {
      // Test helpers are often defined inline for clarity
      "unicorn/consistent-function-scoping": "off",
      // Explicit undefined in test assertions is acceptable
      "unicorn/no-useless-undefined": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ Unicorn Config File Relaxations ━━━━━━━━━━━━━━━━━━━
  // Allow CommonJS patterns in config files
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    rules: {
      // Config files explicitly use .cjs extension when CommonJS is required
      "unicorn/prefer-module": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ Main Configuration ━━━━━━━━━━━━━━━━━━━
  // Core rules for all TS/JS source files: module boundaries, import ordering,
  // strict TypeScript type safety, naming conventions, and best practices
  {
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.mts",
      "**/*.cts",
      "**/*.js",
      "**/*.mjs",
      "**/*.cjs",
      "**/*.jsx",
    ],
    ignores: [
      "lint-staged.config.ts",
      "prettier.config.ts",
      "eslint.config.base.ts",
    ],
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Nx-specific rules
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
      "@nx/dependency-checks": "error",

      // Import rules for better module management
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import/no-duplicates": "error",
      "import/no-unresolved": "off", // TypeScript handles this
      "import/named": "off", // TypeScript handles this
      "import/namespace": "off", // TypeScript handles this
      "import/default": "off", // TypeScript handles this
      "import/no-named-as-default-member": "off", // TypeScript handles this

      // Strict TypeScript rules
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/prefer-reduce-type-parameter": "error",
      "@typescript-eslint/prefer-return-this-type": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true, ignoreVoidOperator: true },
      ],
      "@typescript-eslint/no-meaningless-void-operator": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/consistent-type-exports": [
        "error",
        {
          fixMixedExportsWithInlineTypeSpecifier: true,
        },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["camelCase"],
          filter: {
            regex: "^(_|__(filename|dirname))$",
            match: false,
          },
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          filter: {
            regex: "^__(filename|dirname)$",
            match: false,
          },
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["UPPER_CASE"],
        },
        {
          selector: "import",
          format: ["camelCase", "PascalCase"],
          filter: {
            regex: "^_$",
            match: false,
          },
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          filter: {
            regex: "^_$",
            match: false,
          },
        },
        {
          selector: "objectLiteralProperty",
          format: null,
        },
      ],

      // General best practices
      // "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-throw-literal": "off", // TypeScript ESLint handles this
      "@typescript-eslint/only-throw-error": "error",
      "no-unused-expressions": "off", // TypeScript ESLint handles this
      "@typescript-eslint/no-unused-expressions": "error",
      "no-unused-vars": "off", // TypeScript ESLint handles this
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "prefer-template": "error",
      "object-shorthand": ["error", "always"],
      "prefer-arrow-callback": "error",
      "no-duplicate-imports": "off", // import/no-duplicates handles this
      "sort-imports": [
        "error",
        {
          ignoreCase: true,
          ignoreDeclarationSort: true, // import/order handles this
        },
      ],
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ TypeScript Strict Type-Checked ━━━━━━━━━━━━━━━━━━━
  // Enables strict + stylistic type-checked rule sets from typescript-eslint.
  // Requires parserOptions.projectService for type-aware linting.
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    ignores: ["lint-staged.config.ts", "prettier.config.ts"],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    ignores: ["lint-staged.config.ts", "prettier.config.ts"],
  })),
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    ignores: ["lint-staged.config.ts", "prettier.config.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ TSDoc / JSDoc Documentation ━━━━━━━━━━━━━━━━━━━
  // Enforces TSDoc syntax and requires JSDoc on public declarations
  // (functions, methods, classes, interfaces, types, enums)
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "lint-staged.config.ts",
      "prettier.config.ts",
    ],
    plugins: {
      tsdoc: tsdocPlugin,
      jsdoc: jsdocPlugin,
    },
    rules: {
      "tsdoc/syntax": "warn",
      "jsdoc/require-jsdoc": [
        "warn",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          contexts: [
            "TSInterfaceDeclaration",
            "TSTypeAliasDeclaration",
            "TSEnumDeclaration",
          ],
          publicOnly: true,
          exemptEmptyConstructors: true,
          exemptEmptyFunctions: false,
          checkConstructors: false,
        },
      ],
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ React / Hooks / Accessibility ━━━━━━━━━━━━━━━━━━━
  // React 19 (new JSX transform), hooks rules, and WCAG accessibility checks
  {
    files: ["**/*.tsx", "**/*.jsx"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React rules
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      "react/prop-types": "off", // TypeScript handles this
      "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
      "react/jsx-no-target-blank": "error",
      "react/jsx-key": "error",
      "react/no-array-index-key": "warn",
      "react/no-unstable-nested-components": "error",
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-curly-brace-presence": [
        "error",
        { props: "never", children: "never" },
      ],
      "react/self-closing-comp": "error",
      "react/jsx-pascal-case": "error",

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // Accessibility rules
      ...jsxA11yPlugin.configs.recommended.rules,
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ Test Files ━━━━━━━━━━━━━━━━━━━
  // Relaxed rules for test files: allow `any`, unsafe operations, and console
  {
    files: [
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/testing/**",
      "**/__tests__/**",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "no-console": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ JavaScript Config Files ━━━━━━━━━━━━━━━━━━━
  // Disables ALL type-checked rules for .js/.mjs/.cjs files since they
  // lack TypeScript type information (e.g., *.config.cjs, commitlint.config.ts)
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      // Disable ALL type-checked rules for JS files
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/promise-function-async": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/prefer-readonly": "off",
      "@typescript-eslint/prefer-reduce-type-parameter": "off",
      "@typescript-eslint/prefer-return-this-type": "off",
      "@typescript-eslint/switch-exhaustiveness-check": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-meaningless-void-operator": "off",
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
      "@typescript-eslint/consistent-type-exports": "off",
      "@typescript-eslint/naming-convention": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ JSON Files ━━━━━━━━━━━━━━━━━━━
  // JSON/JSONC/JSON5 linting with style enforcement and Nx dependency checks
  ...jsoncPlugin.configs["flat/recommended-with-jsonc"].map((config) => ({
    ...config,
    files: ["**/*.json", "**/*.jsonc", "**/*.json5"],
  })),
  {
    files: ["**/*.json", "**/*.jsonc", "**/*.json5"],
    rules: {
      // Keep Nx dependency checks enabled
      "@nx/dependency-checks": "error",
      // JSONC style rules
      "jsonc/sort-keys": "off", // Don't enforce key sorting by default
      "jsonc/quotes": ["error", "double"],
      "jsonc/comma-dangle": ["error", "never"],
      "jsonc/indent": ["error", 2],
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ YAML Files ━━━━━━━━━━━━━━━━━━━
  // YAML/YML linting with indent, quoting, and best practice rules
  ...eslintPluginYml.configs["flat/standard"].map((config) => ({
    ...config,
    files: ["**/*.yaml", "**/*.yml"],
  })),
  ...eslintPluginYml.configs["flat/prettier"].map((config) => ({
    ...config,
    files: ["**/*.yaml", "**/*.yml"],
  })),
  {
    files: ["**/*.yaml", "**/*.yml"],
    rules: {
      // Style rules
      "yml/indent": ["error", 2],
      "yml/quotes": ["error", { prefer: "double", avoidEscape: false }],
      "yml/no-multiple-empty-lines": [
        "error",
        { max: 1, maxEOF: 0, maxBOF: 0 },
      ],
      "yml/key-spacing": ["error", { beforeColon: false, afterColon: true }],
      "yml/spaced-comment": ["error", "always"],

      // Best practices
      "yml/no-empty-document": "error",
      "yml/no-empty-key": "error",
      "yml/no-empty-mapping-value": "off", // Allow empty values (common in GitHub Actions triggers)
      "yml/no-empty-sequence-entry": "error",
      "yml/no-tab-indent": "error",
      "yml/plain-scalar": ["error", "always"],

      // Disable sorting by default (can be enabled per-project)
      "yml/sort-keys": "off",
      "yml/sort-sequence-values": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ Config File Overrides ━━━━━━━━━━━━━━━━━━━
  // Allow workspace imports in *.config.* files without module boundary errors
  {
    files: [
      "**/*.config.ts",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.cjs",
    ],
    rules: {
      "@nx/enforce-module-boundaries": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ Vitest Config Files ━━━━━━━━━━━━━━━━━━━
  // Disable type-checked rules for vitest configs (circular dependency issues)
  {
    files: ["**/vitest.config.ts", "**/vitest.config.base.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ Self-Config ━━━━━━━━━━━━━━━━━━━
  // Relaxed rules for eslint.config.base.ts itself (plugin typing limitations)
  {
    files: ["eslint.config.base.ts"],
    rules: {
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ Markdown Files ━━━━━━━━━━━━━━━━━━━
  // GitHub Flavored Markdown (GFM) with YAML frontmatter support
  {
    files: ["**/*.md"],
    plugins: {
      markdown,
    },
    language: "markdown/gfm",
    languageOptions: {
      frontmatter: "yaml",
    },
    rules: {
      // Enable markdown-specific rules
      "markdown/fenced-code-language": "warn",
      "markdown/heading-increment": "error",
      "markdown/no-duplicate-definitions": "error",
      "markdown/no-duplicate-headings": "warn",
      "markdown/no-empty-definitions": "error",
      "markdown/no-empty-images": "error",
      "markdown/no-empty-links": "error",
      "markdown/no-html": ["error", { allowed: ["img", "a"] }],
      "markdown/no-invalid-label-refs": "error",
      "markdown/no-missing-atx-heading-space": "error",
      "markdown/no-missing-label-refs": "error",
      "markdown/no-missing-link-fragments": "error",
      "markdown/no-multiple-h1": "error",
      "markdown/no-reference-like-urls": "error",
      "markdown/no-reversed-media-syntax": "error",
      "markdown/no-space-in-emphasis": "error",
      "markdown/no-unused-definitions": "error",
      "markdown/require-alt-text": "error",
      "markdown/table-column-count": "error",
      "markdown/no-bare-urls": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ Prettier (must be last) ━━━━━━━━━━━━━━━━━━━
  // Disables all formatting rules that conflict with Prettier
  eslintConfigPrettier,
] as ConfigWithExtends[];
