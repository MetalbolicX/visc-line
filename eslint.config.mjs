"use strict";

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import perfectionist from "eslint-plugin-perfectionist";
import jsdoc from "eslint-plugin-jsdoc";
import unicorn from "eslint-plugin-unicorn";

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
    plugins: {
      jsdoc,
      unicorn,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2024,
      },
    },
    rules: {
      // --- Formatting & Basic Syntax ---
      "quotes": ["error", "double"],
      "semi": ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "eqeqeq": ["error", "always"],

      // Enforce template literals, forbid '+' for concatenation
      "prefer-template": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "BinaryExpression[operator='+'][left.type='Literal'][left.value=/./], BinaryExpression[operator='+'][right.type='Literal'][right.value=/./]",
          message: "Do not use '+' for string concatenation. Use template literals.",
        },
        {
          selector: "CallExpression[callee.property.name='push']",
          message: "Do not use .push(). Use the spread operator to maintain immutability.",
        },
        {
          selector: "CallExpression[callee.property.name=/^(map|filter|flatMap|slice|concat)$/] > MemberExpression > CallExpression[callee.property.name=/^(map|filter|flatMap|slice|concat)$/]",
          message: "Pipeline detected: Avoid chaining multiple array methods. Use '.values()' to start an Iterator Helper pipeline instead to save memory."
        },
        {
          selector: "ForStatement",
          message: "Avoid standard for-loops. Use for...of or array methods (map, filter, etc.).",
        },
      ],

      // --- Naming Conventions ---
      // Supports kebab-case and name.type.extension (e.g., user.route.ts)
      "unicorn/filename-case": "off",
      
      "@typescript-eslint/naming-convention": [
        "error",
        { "selector": "class", "format": ["PascalCase"] },
        { "selector": ["variable", "function", "method"], "format": ["camelCase"] },
        // Enforce verbs for booleans
        { 
          "selector": "variable", 
          "types": ["boolean"], 
          "format": ["camelCase"], 
          "prefix": ["is", "has", "can", "should", "will", "did"] 
        },
      ],

      // --- TypeScript Specifics ---
      "@typescript-eslint/no-inferrable-types": "error", // No types for primitives
      "@typescript-eslint/explicit-function-return-type": "off",

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
        "VariableDeclarator": {
          "array": true,
          "object": true
        },
        "AssignmentExpression": {
          "array": true,
          "object": true
        }
      }, { "enforceForRenamedProperties": false }],
      // Limit function parameters to keep signatures manageable. Default
      // chosen here is 3 — adjust if your codebase prefers 4.
      "max-params": ["error", 3],

      // --- JSDoc (Enforced for JS and TS) ---
      "jsdoc/require-jsdoc": ["warn", { 
        "require": {
          "FunctionDeclaration": true,
          "MethodDefinition": true,
          "ClassDeclaration": true,
          "ArrowFunctionExpression": true
        },
        "contexts": ["VariableDeclaration"]
      }],
      "jsdoc/check-alignment": "warn",
      "jsdoc/require-description": "warn",

      // --- Environment & Modern APIs ---
      "unicorn/prefer-node-protocol": "error", // Use node: prefix
      // Prefer using .at() for cleaner, modern index access when appropriate
      "unicorn/prefer-at": "error",
      "no-restricted-properties": [
        "error",
        { "property": "innerHTML", "message": "Use textContent or createContextualFragment instead." }
      ],
      "no-restricted-globals": [
        "error",
        { "name": "fetch", "message": "Ensure AbortController is used with fetch if needed for cancellation." }
      ]
    },
  }
);
