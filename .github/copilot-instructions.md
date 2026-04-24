---
description: "Describes the coding style and best practices for the visc-line project, a D3.js library for rendering line charts."
applyTo: "src/**/*"
---

# Project overview

`visc-line` is a D3.js library written in TypeScript that provides a set of rendering functions that create the components of a line chart (e.g., `renderAxisLabel`, `renderGrid`, etc.) and utilities for the work flow of rendering.

## Golden Rules

- Use web standards.
- Write idempotent rendering logic.
- Try to use functional patterns for rendering logic.
- Use inline styles for maximal portability.
- Avoid invalid values (data wranggling first).
- Parse dates.

## Tech Stack

- TypeScript.
- D3.js v7.

## Source Clean Code Practices

### 1. Operational Discipline

- Confirm requirements (scope, acceptance, constraints) before modifying logic or adding features.
- Keep each change focused: reviewable patches, one file per edit, and a clear snapshot of why work was done.
- Pair new behavior with a targeted test or validation step whenever feasible to guard the contract.
- Document assumptions or trade-offs directly in code comments or accompanying docs so future readers understand the intent.

### 2. Naming & Declarations

- Favor descriptive identifiers over abbreviations, use domain terms consistently, and limit single-letter names to conventional loop counters (`i`, `j`).
- Use `PascalCase` for classes/components, `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for compile-time constants, and prefix booleans with `is`, `has`, `can`, or `should`.
- Prefer `const` for values that never reassign or inmutabilty in a given programming language. Use `let` only when mutation is required (or `mutable` in languages that support it).

### 3. Control Flow & Structure

- Handle invalid states early and return immediately to avoid deep nesting or repeated conditionals.
- Extract small, pure helper functions for reusable logic; each function should do one thing and be easy to reason about.
- Prefer readable iterators (`map`, `filter`, `reduce`, `for...of`) over manual index looping, and keep branch coverage explicit.

### 4. Async & Error Handling

- Create specific descriptive error messages that include context and potential causes to aid debugging and support.
- Log unexpected failures at the call site and propagate typed error objects so callers can make decisions (retry, fallback, bubble up). For example:

```javascript
async function fetchCatalog(signal: AbortSignal): Promise<Catalog> {
  const response = await fetch(CATALOG_URL, { signal });
  if (!response.ok) throw new Error(`Catalog request failed with ${response.status}`);
  return response.json();
}
```
