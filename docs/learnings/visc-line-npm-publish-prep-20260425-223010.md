# visc-line Production-Readiness Session Learnings

**Session:** 2025-04-25 | **Topic:** npm 1.0.0 publish prep + comprehensive codebase hardening

---

## Non-Obvious Discoveries

### 1. Broken `package.json` `exports` Map (`"imports"` vs `"import"`)
- The original exports field used `"imports"` as the subpath key, which is **not a valid Node.js exports field**. The correct key is `"import"` (singular). This means any ESM consumer using Node module resolution would silently fail to resolve the module.
- File: `package.json:49`
- Fix: Changed to `"."` entry with `"import"`/`"require"` subpaths.

### 2. `tipviz` Bundled Twice / Peer Dependency Redundancy
- `tsdown.config.mjs` had `deps.alwaysBundle: ["tipviz"]` which forces bundle. Simultaneously `tipviz` was listed in both `dependencies` and `peerDependencies`. The AGENTS.md specified tipviz should be forced-bundled, but the duplicate in `dependencies` was unnecessary and misleading.
- Files: `package.json:63`, `tsdown.config.mjs:6`

### 3. D3 `AnyScale` Union Cannot Accept `unknown` — Requires Explicit Cast Utility
- D3's `AnyScale = ScaleLinear | ScaleLogarithmic | ScalePower | ScaleTime`. Calling `xScale(datum.x)` where `xScale: AnyScale` and `datum.x: unknown` fails because TypeScript cannot confirm `unknown` is assignable to each union member's input. This required scattered `as (v: unknown) => number` casts throughout `line.mts`, `points.mts`, `tooltip.mts`, `grid.mts`.
- Created `src/utils/scaleCast.mts` with `asScaleNumber()`, `asInvertibleScale()`, `asTickable()` as centralized escape hatches.

### 4. jsdom Missing `window.matchMedia` and `SVGElement.prototype.getTotalLength`
- `renderLine` calls `window.matchMedia("(prefers-reduced-motion: reduce)")` directly. jsdom does not mock this — it throws `TypeError: window.matchMedia is not a function`.
- `SVGElement.prototype.getTotalLength` is also unmocked in jsdom — needed for path animation. Tests need explicit polyfill in `beforeEach`.
- File: `src/components/line.mts:79`

### 5. D3 `scaleLinear().domain([undefined, undefined])` Returns `[null, null]`, Not `[undefined, undefined]`
- The grid renderer used `if (xMin === undefined)` as an early-return guard for invalid domains. But D3 converts `undefined` in domain arrays to `null`. Guard needed `== null` (covers both `null` and `undefined`) rather than `=== undefined`.
- File: `src/components/grid.mts:38,93`

### 6. TypeScript `noUnusedLocals: true` — Test Files Are Project Files
- After enabling `noUnusedLocals` and `noUnusedParameters`, new type errors appeared in test files (unused imports like `afterEach`). The `tsconfig.json` `include` array contained `src/**/*.mts` meaning test files were type-checked by `tsc --noEmit`. However, vitest provides `describe/it/beforeEach/afterEach` as globals only when `globals: true` in vitest config. ESLint could not resolve these globals in test files, causing cascading issues.
- Fix for tsc: exclude test files from `tsconfig.json`. Fix for ESLint: add separate config block for test files with `project: false`.
- File: `tsconfig.json`, `eslint.config.mjs`

### 7. ESLint OOM on Full Project Type-Checked Run
- ESLint with `typescript-eslint`'s `typeChecked` rules (`strictTypeChecked`, `stylisticTypeChecked`) combined with project service running on the full project causes OOM on constrained hardware. Not a code issue — CI runner with more memory handles it.
- File: `eslint.config.mjs`

### 8. D3 `.attr()` Callback Datum Type Conflict in Tooltip
- In `tooltip.mts` inside `cursorDots.each()`, the inner `.attr("cx", (d) => ...)` callback's `d` is typed as `ProcessedSeries<T>` (from the parent data join), NOT as the inner join's datum `T`. Calling `xScale(xAccessor(d))` where `xAccessor(d)` fails because `d` is `ProcessedSeries<T>` not `T`. Worked around by extracting `xNumScale = asScaleNumber(xScale)` outside the inner callback and casting with `// eslint-disable-next-line @typescript-eslint/no-explicit-any`.
- File: `src/interactivity/tooltip.mts:313`

### 9. `npm pack --dry-run` Verifies Published Contents Without Publishing
- `npm pack --dry-run` (not `--dry-run` as a flag to `npm publish`) prints the exact tarball contents. Confirms only `dist/` and `package.json`/`LICENSE`/`README` are included when `files: ["dist"]` is set.
- File: `package.json:28`

### 10. ESM Import of Browser-Only Library Fails in Node REPL
- Importing the compiled ESM (`index.mjs`) directly in Node REPL fails with `ReferenceError: HTMLElement is not defined` because the bundle contains browser DOM APIs. This is expected for a browser-only UMD/ESM library — not a build bug. Verification must be done via `npm pack --dry-run` and CJS require.
