import path from "node:path";
import { fileURLToPath } from "node:url";

import eslint from "@eslint/js";
import markdown from "@eslint/markdown";
import eslintReact from "@eslint-react/eslint-plugin";
import nxPlugin from "@nx/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import-x";
import jsdocPlugin from "eslint-plugin-jsdoc";
import jsoncPlugin from "eslint-plugin-jsonc";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import perfectionistPlugin from "eslint-plugin-perfectionist";
import tsdocPlugin from "eslint-plugin-tsdoc";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintPluginYml from "eslint-plugin-yml";
import tseslint from "typescript-eslint";

import type { ConfigWithExtends } from "typescript-eslint";

const tsconfigRootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export default [
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
      "CHANGELOG.md",
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
      // Nx generator template files (scaffold output, not project source)
      "**/conformance/**/templates/**",
      // Terraform providers and generated files
      "**/.terraform/**",
      ".github/copilot-instructions.md",
      // Raw data folders (large JSON dumps, not source code)
      "**/data/wikipedia/**",
      "**/data/wiktionary/**",
      // Nx-generated agent skill folders
      ".github/skills/monitor-ci/**",
      ".github/skills/nx-generate/**",
      ".github/skills/nx-import/**",
      ".github/skills/nx-plugins/**",
      ".github/skills/nx-run-tasks/**",
      ".github/skills/nx-workspace/**",
      "documentation/skills/monitor-ci/**",
      "documentation/skills/nx-generate/**",
      "documentation/skills/nx-import/**",
      "documentation/skills/nx-plugins/**",
      "documentation/skills/nx-run-tasks/**",
      "documentation/skills/nx-workspace/**",
      "documentation/skills/link-workspace-packages/**",
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
      // Placeholder files with only a comment header are intentional
      "unicorn/no-empty-file": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ Emoji Hygiene ━━━━━━━━━━━━━━━━━━━
  // Prevent variation selectors (\uFE0F) in emojis to avoid rendering issues.
  // Standardizes on plain emojis (e.g., 🏗 instead of 🏗️).
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
      "**/*.json",
      "**/*.jsonc",
      "**/*.yaml",
      "**/*.yml",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          message:
            "Emojis should not use variation selectors (\uFE0F) as they can cause rendering issues. Use plain emojis instead.",
          selector:
            String.raw`Literal[value=/\uFE0F/], TemplateElement[value.raw=/\uFE0F/]`,
        },
      ],
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
      "configuration/eslint.config.base.ts",
    ],
    plugins: {
      import: importPlugin,
      perfectionist: perfectionistPlugin,
      "@typescript-eslint": tseslint.plugin,
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
      "perfectionist/sort-imports": [
        "error",
        {
          type: "natural",
          order: "asc",
          ignoreCase: true,
          internalPattern: ["^@monorepo/.+"],
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          newlinesBetween: 1,
        },
      ],
      "perfectionist/sort-named-imports": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-named-exports": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-exports": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-interfaces": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-object-types": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-union-types": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-intersection-types": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-array-includes": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-arrays": [
        "off",
      ],
      "perfectionist/sort-enums": [
        "error",
        { type: "natural", order: "asc", partitionByNewLine: true },
      ],
      "perfectionist/sort-heritage-clauses": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-decorators": [
        "error",
        { type: "natural", order: "asc", partitionByNewLine: true },
      ],
      "perfectionist/sort-classes": [
        "error",
        {
          type: "natural",
          order: "asc",
          groups: [
            "constructor",
            "index-signature",
            "static-property",
            "static-block",
            "private-property",
            "protected-property",
            "property",
            "accessor-property",
            "static-method",
            "private-method",
            "protected-method",
            "get-method",
            "set-method",
            "method",
          ],
        },
      ],
      "perfectionist/sort-sets": ["error", { type: "natural", order: "asc" }],
      "perfectionist/sort-maps": ["error", { type: "natural", order: "asc" }],
      "perfectionist/sort-modules": [
        "error",
        {
          type: "natural",
          order: "asc",
          groups: [
            "declare-enum",
            "export-enum",
            "enum",
            ["declare-interface", "declare-type"],
            ["export-interface", "export-type"],
            ["interface", "type"],
            "declare-class",
            "class",
            "export-class",
            "declare-function",
            "export-function",
            "function",
          ],
        },
      ],
      "perfectionist/sort-export-attributes": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-import-attributes": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-variable-declarations": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-switch-case": [
        "error",
        { type: "natural", order: "asc" },
      ],
      "perfectionist/sort-objects": [
        "error",
        {
          type: "natural",
          order: "asc",
          partitionByComment: true,
          partitionByNewLine: true,
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
          leadingUnderscore: "allow",
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
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-extraneous-class": [
        "error",
        { allowWithDecorator: true },
      ],
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-useless-constructor": "off",
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
  // @eslint-react/eslint-plugin: native ESLint 10+ support, TypeScript-first.
  // recommended-typescript covers: no-missing-key, no-array-index-key,
  // no-nested-component-definitions, dom/no-unsafe-target-blank,
  // hooks-extra/rules-of-hooks, hooks-extra/exhaustive-deps, and more.
  {
    ...eslintReact.configs["recommended-typescript"],
    files: ["**/*.tsx", "**/*.jsx"],
  },
  {
    files: ["**/*.tsx", "**/*.jsx"],
    plugins: {
      "jsx-a11y": jsxA11yPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Downgrade from the preset's default "error" to "warn"
      "@eslint-react/no-array-index-key": "warn",
      "perfectionist/sort-jsx-props": [
        "error",
        {
          type: "natural",
          order: "asc",
          customGroups: [
            { groupName: "reserved", elementNamePattern: "^(key|ref)$" },
            { groupName: "shorthand", modifiers: ["shorthand"] },
          ],
          groups: ["reserved", "unknown", "shorthand"],
        },
      ],

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
      "**/testing/**/*.{ts,tsx,mts,cts,js,mjs,cjs,jsx}",
      "**/__tests__/**/*.{ts,tsx,mts,cts,js,mjs,cjs,jsx}",
    ],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/unbound-method": "off",
      "no-console": "off",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ JavaScript Config Files ━━━━━━━━━━━━━━━━━━━
  // Disables ALL type-checked rules for .js/.mjs/.cjs files since they
  // lack TypeScript type information (e.g., *.config.cjs, commitlint.config.ts)
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      // Disable ALL type-checked rules for JS files
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-useless-constructor": "off",
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
    files: ["**/*.json", "**/*.jsonc", "**/*.jsonl", "**/*.json5"],
  })),
  {
    files: ["**/*.json", "**/*.jsonc", "**/*.jsonl", "**/*.json5"],
    rules: {
      // Keep Nx dependency checks enabled
      "@nx/dependency-checks": "error",
      // JSONC style rules
      "jsonc/sort-keys": [
        "error",
        "asc",
        { caseSensitive: false, natural: true, minKeys: 2 },
      ],
      "jsonc/sort-array-values": [
        "error",
        {
          minValues: 2,
          order: { type: "asc", caseSensitive: false, natural: true },
          pathPattern: String.raw`^(?!(?:.*\.)?commands?$)`,
        },
      ],
      "jsonc/quotes": ["error", "double"],
      "jsonc/comma-dangle": ["error", "never"],
      "jsonc/indent": ["error", 2],
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ JSONC Files ━━━━━━━━━━━━━━━━━━━
  // JSONC files support trailing commas; align with Prettier's trailingComma: "all" + jsonc parser
  {
    files: ["**/*.jsonc"],
    rules: {
      "jsonc/comma-dangle": ["error", "always-multiline"],
    },
  },

  // ━━━━━━━━━━━━━━━━━━━ devcontainer.json files ━━━━━━━━━━━━━━━━━━━
  // Allow line-separated groups in devcontainer.json for security audit tool flexibility
  {
    files: ["**/devcontainer.json"],
    rules: {
      "jsonc/sort-array-values": [
        "error",
        {
          minValues: 2,
          order: { type: "asc", caseSensitive: false, natural: true },
          pathPattern: "^(?!runArgs$)",
        },
      ],
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
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
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
    files: ["configuration/eslint.config.base.ts"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
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
