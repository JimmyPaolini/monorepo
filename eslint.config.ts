import * as eslint from "@eslint/js";
import * as nxPlugin from "@nx/eslint-plugin";
import * as importPlugin from "eslint-plugin-import";
import * as jsoncPlugin from "eslint-plugin-jsonc";
import * as jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import * as reactPlugin from "eslint-plugin-react";
import * as reactHooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

import type { ConfigWithExtends } from "typescript-eslint";

export default [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...([] as any[]),
  // Global ignores
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
    ],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // Nx plugin configurations
  ...nxPlugin.configs["flat/base"],
  ...nxPlugin.configs["flat/typescript"],
  ...nxPlugin.configs["flat/javascript"],

  // Global configuration for all files
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
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
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
      "@typescript-eslint/switch-exhaustiveness-check": "error",
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
            regex: "^_$",
            match: false,
          },
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
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
      // "no-console": ["warn", { allow: ["warn", "error"] }],
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

  // TypeScript-specific configuration
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
  })),
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.ts", "*.mts", "*.cts", "eslint.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
    },
  },

  // React-specific configuration
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

  // Test files configuration
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

  // JavaScript-specific configuration (for config files)
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // JSON files configuration - exclude from type-checked linting
  ...jsoncPlugin.configs["flat/recommended-with-jsonc"],
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

  // Special configuration for the eslint.config.ts file itself
  {
    files: ["eslint.config.ts"],
    rules: {
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
] as ConfigWithExtends[];
