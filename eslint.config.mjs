"use strict";

import eslint from "@eslint/js";
import functional from "eslint-plugin-functional";
import immutable from "eslint-plugin-immutable";
import perfectionist from "eslint-plugin-perfectionist";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "docs/**",
      "coverage/**",
      "examples/**",
      "**/*.test.mts",
    ],
  },
  // Non-TypeScript base config (includes eslint.config.mjs itself)
  {
    files: ["*.mjs", "*.js"],
    ...eslint.configs.recommended,
  },
  // TypeScript source files — type-aware linting
  {
    files: ["src/**/*.mts", "src/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2024,
        projectService: {
          allowDefaultProject: [
            "*.mts",
            "src/__tests__/helpers/createMockSVG.mts",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      functional,
      immutable,
      unicorn,
    },
    rules: {
      ...tseslint.configs.strictTypeChecked[0].rules,
      ...tseslint.configs.stylisticTypeChecked[0].rules,
      // --- Naming conventions ---
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/naming-convention": [
        "error",
        { format: ["PascalCase"], selector: "class" },
        { format: ["camelCase"], selector: ["variable", "function", "method"] },
        // Allow any format for const variables (covers UPPER_SNAKE_CASE constants)
        { format: null, modifiers: ["const"], selector: "variable" },
        {
          format: ["camelCase"],
          prefix: ["is", "has", "can", "should", "will", "did"],
          selector: "variable",
          types: ["boolean"],
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // --- TypeScript specifics ---
      "@typescript-eslint/no-inferrable-types": "error",
      // Allow test describe/it without imports
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Disable — null-safe == checks are valid in this codebase
      eqeqeq: "off",
      "functional/immutable-data": "off",
      "functional/prefer-readonly-type": "off",
      "functional/prefer-tacit": "off",
      "max-params": ["error", 6],
      "no-restricted-globals": [
        "error",
        {
          message:
            "Ensure AbortController is used with fetch if needed for cancellation.",
          name: "fetch",
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          message: "Use setHTML method or createContextualFragment instead.",
          property: "innerHTML",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          message:
            "Do not use '+' for string concatenation. Use template literals.",
          selector:
            "BinaryExpression[operator='+'][left.type='Literal'][left.value=/./], BinaryExpression[operator='+'][right.type='Literal'][right.value=/./]",
        },
        {
          message:
            "Avoid standard for-loops. Use for...of or array methods.",
          selector: "ForStatement",
        },
      ],
      "no-var": "error",
      "prefer-const": "error",
      "prefer-destructuring": [
        "error",
        {
          AssignmentExpression: { array: true, object: true },
          VariableDeclarator: { array: true, object: true },
        },
        { enforceForRenamedProperties: false },
      ],
      "prefer-template": "error",
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "unicorn/filename-case": "off",
      "unicorn/prefer-at": "error",
      "unicorn/prefer-node-protocol": "error",
    },
  },
  perfectionist.configs["recommended-natural"],
);
