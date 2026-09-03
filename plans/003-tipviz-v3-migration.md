# Plan 003: Migrate tooltip to the tipviz v3 API and fix the dependency declarations

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- src/interactivity/ package.json tsdown.config.mjs`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (public interactivity behavior; consumers depending on tooltip HTML output will see DOM changes)
- **Depends on**: plans/002-characterization-suite.md
- **Category**: bug
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

`src/interactivity/tooltip.mts:223` calls `tooltip.setHtml((d) => tooltipHtml(d))`
— but tipviz v3 REMOVED `setHtml`. The v3 API is `setTemplate(htmlString)`
+ `setData(record)` with `[data-bind]` placeholders. Meanwhile
`package.json` simultaneously declares tipviz as a runtime dependency
`^3.0.1` (line 84) AND a peer dependency `^2.1.0` (line 88) — contradictory.
Concretely: with the version the lockfile actually resolves (3.0.1), any
code path reaching line 223 throws `TypeError: tooltip.setHtml is not a
function`; consumers installing per the peer range get v2, where the
bundled v3 assumptions break. Tooltips are broken or version-ambiguous on
the library's flagship interactivity feature. This plan migrates the call
site to v3 and makes the declarations say one true thing.

## Current state

- `src/interactivity/tooltip.mts` — 363 lines. Line 1-2: `import "tipviz"; import type { TipVizTooltip } from "tipviz";` (side-effect import registers `<tip-viz-tooltip>` custom element). Line 223 (inside the mousemove handler): `tooltip.setHtml((d) => tooltipHtml(d as unknown as TooltipData));`
- tipviz v3 source of truth (sibling checkout at `/home/metalbolicx/Documents/tipviz`, version 3.0.1):
  - `TipVizTooltip` class (`src/components/tooltip/tooltip.mts:24`) exposes: `setTemplate(htmlString: string)` (line 348), `setData(data: Record<string, number | string>)` (line 275), `show(targetEl)` / `hide()`, `setDirection`/`setOffset` callbacks, `setStyles`/`loadStylesheet`, `setSanitizerConfig(config)`.
  - Templates use `[data-bind]` placeholders: `setTemplate('<span data-bind="name"></span>')` then `setData({ name: "Alice" })`.
  - NO `setHtml` exists anywhere in v3 source (verified by grep).
  - On module evaluation v3 registers `customElements.define("tip-viz-tooltip", ...)` guarded by `customElements.get` — dynamic `import()` is safe; registration happens at load.
- `package.json:84` — `"dependencies": { "tipviz": "^3.0.1" }`; `package.json:88` — `"peerDependencies": { "tipviz": "^2.1.0" }`.
- `tsdown.config.mjs:6` — `alwaysBundle: ["tipviz"]` (tipviz is force-bundled into dist; d3 stays external).
- `src/interactivity/__tests__/tooltip.test.mts` — 220 lines, no mocks found by grep (`setHtml` does not appear in it).
- README.md and AGENTS.md mention peer dep `tipviz@^2.3.0` / `^2.1.0` in different places — update to match whatever this plan settles on.
- Node modules are NOT installed in the current working copy; Step 0 establishes ground truth.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `pnpm install` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0 (see Step 0 — may fail BEFORE migration) |
| Tooltip tests | `pnpm test -- tooltip` | pass after Step 3 |
| Build     | `pnpm build` | exit 0 |
| Bundle probe | `grep -c "tip-viz-tooltip" dist/index.umd.js` | ≥ 1 (tipviz bundled) |

## Suggested executor toolkit

- Read `/home/metalbolicx/Documents/tipviz/AGENTS.md` lines 55–93 for the authoritative v2→v3 migration notes before writing code.
- The tipviz source at `/home/metalbolicx/Documents/tipviz/src/components/tooltip/tooltip.mts` is readable — consult it for exact `setTemplate`/`setData`/sanitizer semantics.

## Scope

**In scope**:
- `src/interactivity/tooltip.mts`
- `src/interactivity/__tests__/tooltip.test.mts`
- `package.json` (dependencies/peerDependencies blocks only)
- `README.md` and `AGENTS.md` (version-mention lines only)

**Out of scope** (do NOT touch):
- `tsdown.config.mjs` bundling strategy stays as-is (`alwaysBundle: ["tipviz"]`). Lazy-loading tipviz to shrink bundles was considered and deferred — the custom-element registration is side-effectful and the tooltip is a headline feature; revisit only with dist-size measurements.
- The listener-namespace leak at tooltip.mts:269/335 — that is plan 005. Resist fixing it here.
- `zoomPan.mts`, any `src/chart/` or `src/components/` file.

## Git workflow

- Branch: `advisor/003-tipviz-v3-migration`
- Commits: `fix: migrate tooltip to tipviz v3 setTemplate/setData API`, `fix: align tipviz dependency declarations with bundled v3`.
- Conventional commits; do NOT push unless instructed.

## Steps

### Step 0: Establish ground truth

Run `pnpm install`, then `pnpm type-check` and `pnpm test -- tooltip`.
Record the exact output of both (pass or fail, with messages).

- If `type-check` errors on `setHtml` not existing on `TipVizTooltip`: migration confirmed; continue.
- If both pass: a compat path exists that this plan did not predict. STOP and report the output (do not improvise).

**Verify**: output recorded; decision made per the two branches above.

### Step 1: Migrate the call site to v3

In `src/interactivity/tooltip.mts`:

1. Replace the `setHtml` callback with v3 style: at tooltip setup, call `tooltip.setTemplate(...)` ONCE with an HTML template whose dynamic slots are `[data-bind]` elements (e.g. the series label, x value, y value the old `tooltipHtml(d)` produced).
2. In the mousemove handler where `setHtml` was called (line ~223), compute the record and call `tooltip.setData({ ... })` instead.
3. Preserve the existing formatting logic (whatever `tooltipHtml(d)` rendered — keep the same visible text). Keep the `TooltipData` cast surface minimal.
4. If the template includes any user-derived string (series labels are user data), pass it through tipviz's sanitizer: `tooltip.setSanitizerConfig(...)` per tipviz's API rather than concatenating raw HTML.

**Verify**: `pnpm type-check` → exit 0, no `setHtml` anywhere: `grep -rn "setHtml" src/` → no matches.

### Step 2: Fix the dependency declarations

In `package.json`: REMOVE `tipviz` from `peerDependencies` entirely (it is bundled; consumers must not need it), keep `"dependencies": { "tipviz": "^3.0.1" }`. Update README.md and AGENTS.md peer-dependency mentions to state: tipviz ^3.0.1 is bundled into dist; d3 ^7.9.0 is the only peer dependency.

**Verify**: `node -e "const p=require('./package.json'); console.log(Object.keys(p.peerDependencies))"` → `[ 'd3' ]`.

### Step 3: Update tooltip tests to the v3 DOM contract

In `src/interactivity/__tests__/tooltip.test.mts`: dispatch mousemove events (jsdom) as the existing suite does; assert the tooltip element's `[data-bind]` slots receive the expected values after show, and that `hide()` clears visibility. Add one regression case: "mousemove with a series label containing `<script>` does not inject markup" (sanitizer path).

**Verify**: `pnpm test -- tooltip` → all pass including the new cases.

### Step 4: Build and bundle probe

**Verify**: `pnpm build` → exit 0; `grep -c "tip-viz-tooltip" dist/index.umd.js` → ≥ 1.

### Step 5: Full check

**Verify**: `pnpm check` → exit 0.

## Test plan

- `src/interactivity/__tests__/tooltip.test.mts`: v3 template/data assertions, show/hide lifecycle, sanitizer regression, existing anchoring tests kept green.
- Pattern: extend the existing 220-line suite; do not rewrite it.

## Done criteria

- [ ] `grep -rn "setHtml" src/` returns nothing
- [ ] `pnpm check` exits 0
- [ ] `package.json` peerDependencies contains only `d3`
- [ ] `grep -c "tip-viz-tooltip" dist/index.umd.js` ≥ 1
- [ ] README.md + AGENTS.md state the bundled-tipviz policy consistently
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- Step 0 shows type-check AND tooltip tests passing against v3 without migration (compat shim exists) — report; the plan's premise is false.
- tipviz v3 `setSanitizerConfig` semantics do not cover the label-injection case after reading its source — report with what you found; do not ship an unsanitized template.
- The existing tooltip suite fails on Step 0 for reasons unrelated to `setHtml` — report; do not fix unrelated failures here.

## Maintenance notes

- Plan 005 (listener leak) edits the same file immediately after this one — its line references will have drifted; it instructs re-locating by symbol.
- If tipviz later ships a breaking v4, the migration source of truth is the sibling repo's AGENTS.md "API migration" section, not this plan.
