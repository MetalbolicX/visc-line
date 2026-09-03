# Plan 002: Characterize current behavior with a strict test suite (TDD baseline for untested core)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- src/chart/ src/themes/ src/utils/scaleCast.mts src/utils/axisScale.mts vitest.config.mts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW (tests only; no source changes except vitest config thresholds)
- **Depends on**: plans/001-verification-baseline.md
- **Category**: tests
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

The two modules that orchestrate everything — `src/chart/chartRender.mts`
(358 lines, executes the documented render sequence) and
`src/chart/chartState.mts` (105 lines) — have zero direct tests.
`defaultTheme.mts`, `scaleCast.mts`, and `axisScale.mts` are also untested.
Every subsequent plan in `plans/` modifies these areas; without a
characterization suite, a refactor can silently change render output and no
test will notice. This plan pins CURRENT behavior (including its warts)
so later fix-plans (004–009) can be executed strict-TDD style: make the
pinned behavior visible, then flip tests to the desired behavior in the
fix plan.

**Characterization discipline (critical — this is the "strict" part):**
these tests assert what the code does TODAY. If a test you wrote fails,
the TEST is wrong (or you found a divergence worth recording) — you do NOT
change source code in this plan. Known-bug paths get `it.todo` entries
referencing the plan that will fix them, not silently-pinned wrong
behavior.

## Current state

- `src/chart/chartRender.mts` — 358-line orchestrator. Render sequence (from repo AGENTS.md): applyThemeCssVars → renderSVG → renderBoundsGroup → renderContentGroup → renderLine → renderPoints (optional) → renderTitle (optional) → renderXAxis/renderYAxis (optional) → renderXAxisLabel/renderYAxisLabel (optional) → renderXGrid/renderYGrid (optional) → addTooltip/addZoomPan (last). Exercised today only indirectly via `src/chart/__tests__/createChart.test.mts` (585 lines).
- `src/chart/chartState.mts` — defines `FeatureFlags`/`ChartState`/`getFeatureFlags` (~lines 23–71). Pure-ish state mapping.
- `src/themes/defaultTheme.mts` — 80 lines, all numeric CSS-var defaults are > 0 (verified: values like 1, 2, 4, 6, 8, 12, 16; no zeros).
- `src/utils/scaleCast.mts` (36 lines) and `src/utils/axisScale.mts` (12 lines) — small pure helpers, no tests.
- Test conventions: vitest + jsdom, files at `src/**/__tests__/*.test.mts`. Structural exemplars to copy: `src/chart/__tests__/createChart.test.mts` (builder-driven, DOM assertions) and `src/services/__tests__/scales.test.mts` (pure-function assertions). A mock SVG helper exists at `src/__tests__/helpers/createMockSVG.mts`.
- `vitest.config.mts` — 19 lines: jsdom env, v8 coverage (text/json/html), setup file `./vitest.setup.mts`, include `src/**/*.test.mts`. NO coverage thresholds today.
- Sibling project tipviz sets thresholds in `vitest.config.mts` (`coverage.thresholds` with lines/functions/branches) — borrow the mechanism, but derive numbers from THIS repo's actuals (Step 4).

## Commands you will need

| Purpose   | Command                       | Expected on success |
|-----------|-------------------------------|---------------------|
| Install   | `pnpm install`                | exit 0              |
| Tests     | `pnpm test`                   | all pass            |
| One file  | `pnpm test -- chartRender`    | new tests pass      |
| Coverage  | `pnpm test -- --coverage`     | table prints lines/branches/functions per file |
| Typecheck | `pnpm type-check`             | exit 0              |

## Scope

**In scope**:
- `src/chart/__tests__/chartRender.test.mts` (create)
- `src/chart/__tests__/chartState.test.mts` (create)
- `src/themes/__tests__/defaultTheme.test.mts` (create)
- `src/utils/__tests__/scaleCast.test.mts` (create)
- `src/utils/__tests__/axisScale.test.mts` (create)
- `vitest.config.mts` (coverage thresholds only, Step 4)
- `src/services/__tests__/scales.test.mts` (delete empty `/** */` placeholder comment blocks at lines ~7-9, 24-26, 33-39, 47-60, 68-71, 85-88, 97-108, 119-136, 147-150 — comment deletion only)

**Out of scope** (do NOT touch):
- ANY non-test source file. If a test reveals a bug, record it as `it.todo("BUG: ... (fixed by plan NNN)")` — do not fix here.
- Tooltip behavior (plan 003 migrates it; characterizing a moving target wastes effort).

## Git workflow

- Branch: `advisor/002-characterization-suite`
- Commit per logical unit: `test: characterize chartRender render sequence`, `test: add coverage thresholds`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Characterize `chartRender` via the public builder

Create `src/chart/__tests__/chartRender.test.mts`. Model the harness after
`createChart.test.mts` (real jsdom container + `createChart`, no source
mocking). Cover, one `describe` per feature flag combination:

1. Full-feature render (all `.with*()` calls): assert DOM outcomes in the documented order's footprint — `svg` root exists; bounds `<g>` translated by margins; content group has a `clip-path` attribute containing the chart id; `path` for the line has a non-empty `d` starting with `M`; points/title/`.x-axis`/`.y-axis`/axis labels/`line.grid-x`/`line.grid-y` all present.
2. Minimal render (no `.with*()` calls): line renders; NO axis/title/grid/legend/tooltip nodes exist (negative assertions — this pins the "optional" flags).
3. Re-render idempotency: call the same builder configuration twice (or `update()` with identical data); count `svg`, line `path`, axis `g` — counts must not grow. (Repo convention: all renderers are idempotent, select-before-append.)
4. `it.todo` entries for known bugs found by audit: empty-data NaN scales (plan 004), tooltip listener leak (plan 005), zoom extent margins (plan 008).

**Verify**: `pnpm test -- chartRender` → all pass (or todo-skipped).

### Step 2: Unit-characterize `chartState`, `defaultTheme`, `scaleCast`, `axisScale`

- `chartState.test.mts`: `getFeatureFlags` maps each builder flag to the flags object; default state has all features off.
- `defaultTheme.test.mts`: snapshot the theme's shape (keys and value types); assert every numeric `--vl-*` default is a finite number > 0 (this pins the invariant the CSS-var fallback fix in plan 009 relies on).
- `scaleCast.test.mts` / `axisScale.test.mts`: assert current cast/selection behavior for linear/log/pow/time on the happy path, plus what happens with a wrong scale type today (even if it's an ugly cast — pin it, plan 009 revisits).

**Verify**: `pnpm test -- chartState defaultTheme scaleCast axisScale` → all pass.

### Step 3: Clean placeholder comments in `scales.test.mts`

Delete the empty `/** */` blocks listed in Scope (lines may have drifted ±3;
delete empty comment blocks only, never assertions).

**Verify**: `pnpm test -- scales` → all pass; `grep -c '/\*\* \*/' src/services/__tests__/scales.test.mts` → `0`.

### Step 4: Add coverage thresholds derived from actuals

1. Run `pnpm test -- --coverage` and record current global lines/branches/functions percentages.
2. In `vitest.config.mts`, add thresholds 2 points BELOW current actuals (so the suite is green now but guards the floor), e.g. if lines = 87: `coverage: { ..., thresholds: { lines: 85, branches: <actual-2>, functions: <actual-2> } }` (match tipviz's `thresholds` config shape; if the vitest version uses `coverage.thresholds` with `100: false` style, use whatever `vitest.config.mts` typing accepts — type-check must pass).

**Verify**: `pnpm test -- --coverage` → all pass, no threshold failure; `pnpm type-check` → exit 0.

### Step 5: Full baseline

**Verify**: `pnpm check` → exit 0 (type-check + tests + build).

## Test plan

This plan IS tests. New files: 5 test files, ~40–60 cases total per the
step lists above. Verification: `pnpm check` exit 0 with thresholds green.

## Done criteria

- [ ] `pnpm check` exits 0
- [ ] `src/chart/__tests__/chartRender.test.mts` exists and covers full/minimal/idempotent renders + `it.todo` bug markers
- [ ] `src/chart/__tests__/chartState.test.mts`, `src/themes/__tests__/defaultTheme.test.mts`, `src/utils/__tests__/scaleCast.test.mts`, `src/utils/__tests__/axisScale.test.mts` exist and pass
- [ ] `scales.test.mts` has no empty `/** */` blocks
- [ ] `vitest.config.mts` has coverage thresholds, green at current actuals
- [ ] `git status` shows no modifications outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

- A characterization test fails in a way you cannot reconcile with current behavior after 2 attempts — record the divergence and stop (it may be an unfixed bug; report it rather than pinning wrong behavior).
- `chartRender.mts` or `chartState.mts` structure differs wildly from the descriptions above (drift) — stop and report.
- You find yourself editing a non-test source file — stop and report.

## Maintenance notes

- Plans 004–009 flip specific `it.todo`/pinned-wrong assertions to desired behavior; keep the `it.todo` plan references accurate when doing so.
- When new features land (plan 012/013), their characterization cases belong in `chartRender.test.mts`'s per-flag describe blocks.
