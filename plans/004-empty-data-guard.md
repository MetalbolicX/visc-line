# Plan 004: Guard empty and all-invalid data — no more silent NaN charts

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- src/services/scales.mts src/services/dataWrangling.mts src/chart/chartRender.mts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/002-characterization-suite.md
- **Category**: bug
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

Charts fed `data: []` or data where every accessor returns `null`/`NaN`
currently render nothing — silently. The extent pipeline returns
`[undefined, undefined]` domains, `createScales` passes them to
`.domain()` with no guard (verified: `src/services/scales.mts:121` and
`:127` do `.domain(xDomain as readonly number[])` directly), d3 stores
`[NaN, NaN]`, and every downstream coordinate becomes NaN. Users get a
blank canvas with zero diagnostics. For a library whose whole job is
numeric and time-series plotting, "empty data" is a first-class state, not
an error.

## Current state

- `src/services/scales.mts:121,127` — `.domain(...)` called with the domain tuple cast `as readonly number[]`; NO undefined/NaN guard, no warning. (Verified against live code.)
- `src/services/dataWrangling.mts:142-149` — extent computation returns `[undefined, undefined]` for empty arrays (d3 `extent([])` behavior).
- `src/chart/chartRender.mts:142-166` — falls back from current-series extents to all-series extents when the visible domain is undefined; if BOTH are undefined the `[undefined, undefined]` tuple still reaches `createScales`.
- Repo convention (AGENTS.md): "Parse dates; filter invalid numeric values before rendering" — invalid-value filtering already exists for points; this plan adds the empty-domain guard.
- Plan 002 created `it.todo("BUG: empty data → NaN scales (plan 004)")` entries in `src/chart/__tests__/chartRender.test.mts` — this plan turns them into real red→green tests.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Tests (red first) | `pnpm test -- chartRender` | new guard tests FAIL before fix |
| Tests (after fix) | `pnpm test` | all pass |
| Typecheck | `pnpm type-check` | exit 0 |

## Suggested executor toolkit

- Strict TDD: write the failing tests in Step 1, watch them fail (Step 1 verify), then make them pass (Step 2). Do not write the fix first.

## Scope

**In scope**:
- `src/services/scales.mts`
- `src/chart/chartRender.mts` (domain fallback block only, ~lines 142-166)
- `src/chart/__tests__/chartRender.test.mts` (convert the plan-004 `it.todo` entries; add cases)
- `src/services/__tests__/scales.test.mts` (guard-level cases)

**Out of scope**:
- `dataWrangling.mts` extent logic (returns `[undefined, undefined]` by design; the guard belongs at scale creation).
- Error states UI (empty-state message rendering) — this plan warns and renders an empty-but-valid chart; a styled empty-state component is a future direction item.
- Log-scale zero/negative-value handling (a separate defensive concern; recent commits already touched it).

## Git workflow

- Branch: `advisor/004-empty-data-guard`
- Commit 1: `test: pin desired empty-data behavior (red)`. Commit 2: `fix: guard empty domains in createScales and chartRender`.
- Do NOT push unless instructed.

## Steps

### Step 1: Write the failing tests (RED)

1. In `src/services/__tests__/scales.test.mts`: cases where `createScales` receives `[undefined, undefined]` (or `[NaN, NaN]`) for x and/or y — desired behavior: returned scales have a finite default domain (linear: `[0, 1]`; time: `[new Date(), new Date() + 24h]` — any stable finite pair) and `console.warn` is called once with a message containing "empty" (spy via `vi.spyOn(console, "warn")`).
2. In `src/chart/__tests__/chartRender.test.mts`: convert the plan-004 `it.todo` entries into real tests: `createChart` with `data: []` → SVG/axes still render, line `d` attribute is empty or absent (NOT NaN-polluted), warn called; second case: every y accessor returns `NaN` → same contract; third case: single-point data (domain `[v, v]`) → renders without NaN (document current behavior if already fine).

**Verify**: `pnpm test -- chartRender scales` → the NEW tests fail (red), everything else passes.

### Step 2: Implement the guard (GREEN)

1. In `src/services/scales.mts`, at the two `.domain(...)` call sites (~121, 127): if either endpoint is `undefined` or `NaN`, substitute the scale-type-appropriate default domain and `console.warn("[visc-line] empty or invalid domain for <axis> scale; using default <domain>")`. Guard as a small exported helper (e.g. `ensureFiniteDomain(domain, scaleType)`) so both call sites share it and it is unit-testable.
2. In `src/chart/chartRender.mts` (~142-166): keep the existing all-series fallback; it now terminates at a guarded `createScales` — no changes needed unless type narrowing requires it.

**Verify**: `pnpm test` → ALL pass (new guard tests green, characterization suite still green).

### Step 3: Full check

**Verify**: `pnpm check` → exit 0.

## Test plan

Covered in Step 1: empty array, all-NaN y, single point, undefined-domain per scale type (linear + time at minimum), warn-called-once, finite-domain assertion. Model structure on existing `scales.test.mts` cases.

## Done criteria

- [ ] `pnpm check` exits 0
- [ ] New tests exist and pass; no `it.todo` referencing plan 004 remains
- [ ] `grep -n "ensureFiniteDomain" src/services/scales.mts` shows the shared helper used at both domain sites
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- Making the guard tests pass requires touching `dataWrangling.mts` or other out-of-scope files — stop and report.
- The time-scale default domain choice breaks existing time-axis tick tests after 2 attempts — report with the failing output.
- Line references have drifted more than ~10 lines and the fallback block cannot be located confidently — report.

## Maintenance notes

- If a styled empty-state UI is added later (direction item), the `console.warn` in the helper is the hook to trigger it.
- The helper's default domains are public-behavior surface: changing `[0, 1]` later is a breaking change for snapshot-ish tests.
