"use strict";

import eslint from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";
import perfectionist from "eslint-plugin-perfectionist";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

// eslint-disable-next-line @typescript-eslint/no-deprecated
export default tseslint.config(
  {
    // Removed JS/MJS from ignores to satisfy "applyTo" requirements
    ignores: ["dist/**", "node_modules/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  perfectionist.configs["recommended-natural"],
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2024,
        projectService: {
          allowDefaultProject: [
            "eslint.config.mjs",
            "tsdown.config.mjs",
            "vite.config.mjs",
            "vitest.config.mts",
            "docs/docsify.js",
          ],
        },
        tsconfigRootDir: import.meta.dirname, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      },
    },
    plugins: {
      jsdoc,
      unicorn,
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/naming-convention": [
        "error",
        { "format": ["PascalCase"], "selector": "class" },
        { "format": ["camelCase"], "selector": ["variable", "function", "method"] },
        // Enforce verbs for booleans
        { 
          "format": ["camelCase"], 
          "prefix": ["is", "has", "can", "should", "will", "did"], 
          "selector": "variable", 
          "types": ["boolean"] 
        },
      ],
      // --- TypeScript Specifics ---
      "@typescript-eslint/no-inferrable-types": "error", // No types for primitives
      "eqeqeq": ["error", "always"],
      "jsdoc/check-alignment": "warn",

      "jsdoc/require-description": "warn",
      // --- JSDoc (Enforced for JS and TS) ---
      "jsdoc/require-jsdoc": ["warn", { 
        "contexts": ["VariableDeclaration"],
        "require": {
          "ArrowFunctionExpression": true,
          "ClassDeclaration": true,
          "FunctionDeclaration": true,
          "MethodDefinition": true
        }
      }],

      // Limit function parameters to keep signatures manageable. Default
      // chosen here is 3 — adjust if your codebase prefers 4.
      "max-params": ["error", 5],
      
      "no-restricted-globals": [
        "error",
        { "message": "Ensure AbortController is used with fetch if needed for cancellation.", "name": "fetch" }
      ],

      "no-restricted-properties": [
        "error",
        { "message": "Use textContent or createContextualFragment instead.", "property": "innerHTML" }
      ],
      "no-restricted-syntax": [
        "error",
        {
          message: "Do not use '+' for string concatenation. Use template literals.",
          selector: "BinaryExpression[operator='+'][left.type='Literal'][left.value=/./], BinaryExpression[operator='+'][right.type='Literal'][right.value=/./]",
        },
        {
          message: "Do not use .push(). Use the spread operator to maintain immutability.",
          selector: "CallExpression[callee.property.name='push']",
        },
        {
          message: "Pipeline detected: Avoid chaining multiple array methods. Use '.values()' to start an Iterator Helper pipeline instead to save memory.",
          selector: "CallExpression[callee.property.name=/^(map|filter|flatMap|slice|concat)$/] > MemberExpression > CallExpression[callee.property.name=/^(map|filter|flatMap|slice|concat)$/]"
        },
        {
          message: "Avoid standard for-loops. Use for...of or array methods (map, filter, etc.).",
          selector: "ForStatement",
        },
      ],

      "no-var": "error",
      "prefer-const": "error",

      // --- Destructuring ---
      // Use the ESLint core rule to prefer destructuring for variable
      // declarations and assignments. This captures array/object
      // destructuring style (e.g. `const [first] = arr` instead of
      // `const first = arr[0]`).
      //
      // For modern element access (like using `arr.at(-1)` instead of
      // `arr[arr.length - 1]` or `arr.slice(-1)[0]`) we also enable the
      // unicorn rule `unicorn/prefer-at` below.
      //
      // Note: enforcing destructuring in function parameters isn't
      // covered by the core `prefer-destructuring` rule. If you'd like
      // that enforced (or want to limit messy signatures), consider
      // enabling `max-params` or adding a community rule/plugin.
      "prefer-destructuring": ["error", {
        "AssignmentExpression": {
          "array": true,
          "object": true
        },
        "VariableDeclarator": {
          "array": true,
          "object": true
        }
      }, { "enforceForRenamedProperties": false }],
      // Enforce template literals, forbid '+' for concatenation
      "prefer-template": "error",
      // --- Formatting & Basic Syntax ---
      "quotes": ["error", "double"],

      "semi": ["error", "always"],
      // --- Naming Conventions ---
      // Supports kebab-case and name.type.extension (e.g., user.route.ts)
      "unicorn/filename-case": "off",
      // Prefer using .at() for cleaner, modern index access when appropriate
      "unicorn/prefer-at": "error",
      // --- Environment & Modern APIs ---
      "unicorn/prefer-node-protocol": "error" // Use node: prefix
    },
  }
);
