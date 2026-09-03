# Plan 015: Ship `timeTickFormat` option (plan 013 phase 1)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- src/chart/chartTypes.mts src/chart/chartRender.mts src/components/axisRenderer.mts src/services/scales.mts`
> Plans 009, 011 changed these files; line numbers below have drifted.
> Re-locate by symbol. If the structural description no longer holds, treat
> it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S (prototype exists; port to production)
- **Risk**: LOW (behavior-additive; no existing users affected)
- **Depends on**: plans/009-component-consolidation.md (consolidated axis renderer), plans/013-time-series-axis-design.md (design + prototype)
- **Category**: feature
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

Time series (`xType: "time"`) is positioned as a headline mode, but time
axes run on d3's defaults with no user control. The plan 013 spike
identified `timeTickFormat` as the lowest-risk, highest-value option:
pure forwarding to `axis.tickFormat`, no scale changes, no zoom-pipeline
coupling.

The spike (`spike/013-time-axis`) already has a working prototype. This
plan ports it to production on a clean branch, with the characterization
suite extended and the design doc's "PROCEED (refine)" recommendation
executed.

## Current state

- Plan 013 spike on `spike/013-time-axis`:
  - `docs/design/time-series-axis.md` (202 lines) — the design doc.
    Recommendation: PROCEED (refine) — ship `timeTickFormat` first.
  - `src/chart/chartTypes.mts` — `timeTickFormat?: string | ((date: Date) => string)`
    added to `WithAxesOptions`.
  - `src/chart/chartRender.mts` — plumbing in both initial render AND zoom
    redraw paths. Converts string to `d3.timeFormat()` function when
    `xType === "time"`.
  - `src/chart/__tests__/timeAxisBaseline.test.mts` (171 lines, 6 tests) —
    empirical baseline + custom-format assertions.
- Consolidated axis renderer from plan 009 (`axisRenderer.mts`) — the
  `tickFormat` forwarding branch already exists; `timeTickFormat` is a
  narrow extension of it.
- `src/services/scales.mts:23-28` — `scaleFactories` includes
  `time: () => scaleTime()`. No scale changes needed.
- `src/types/scalesTypes.mts:11` — `ScaleType` already permits `"time"`.
- The option does NOT exist on mainline — this plan adds it.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Tests     | `pnpm test` | all green, including new `timeTickFormat` test |
| Typecheck | `pnpm type-check` | exit 0 |
| Build     | `pnpm build` | exit 0 |
| Check     | `pnpm check` | exit 0 |
| E2E (if on base) | `pnpm test:e2e` | pass; time-series chart uses custom format |

## Scope

**In scope**:
- `src/chart/chartTypes.mts` — add `timeTickFormat` to `WithAxesOptions`
- `src/chart/chartRender.mts` — plumb the option through initial render
  AND zoom redraw paths
- The consolidated axis renderer (`src/components/axisRenderer.mts` or
  wherever plan 009 landed it) — apply the option when `xType === "time"`
- `src/chart/__tests__/` — new unit test asserting formatted tick labels;
  existing characterization suite stays green
- `tests/e2e/harness.html` (IF plan 010 has landed on the base) — extend
  with a time-series chart using `timeTickFormat`
- `docs/design/time-series-axis.md` — keep as-is on spike branch; do NOT
  port to mainline (it's a design artifact, not user docs)
- `plans/README.md` — mark plan 015 DONE

**Out of scope**:
- `timeTickInterval` (phase 2 per the design doc — separate plan)
- `locale` (rejected in design doc — d3 v7.7+ locale scoping issues)
- Time-on-Y support (audit DIR-01 was REJECTED as mis-attributed)
- Calendar/zoom brushing, annotations
- Public API changes beyond the additive `timeTickFormat` option
- `createChart.mts` direct edits if the option can be plumbed through
  `chartState.mts`/`chartRender.mts` alone (verify during execution)

## Git workflow

- Branch: `advisor/015-time-tick-format`, branched from the merge base
  of plans 009 + 011 (or whatever commit has both consolidated renderer
  AND lint baseline — re-derive during execution)
- Commit per step:
  1. `feat: add timeTickFormat option type`
  2. `feat: plumb timeTickFormat through render path`
  3. `feat: apply timeTickFormat in consolidated axis renderer`
  4. `feat: wire timeTickFormat into zoom redraw path`
  5. `test: pin timeTickFormat behavior`
  6. `chore: mark plan 015 done`
- Do NOT push unless instructed.

## Steps

### Step 1: Port the option type

Copy from the spike branch:
```ts
readonly timeTickFormat?: string | ((date: Date) => string);
```
into `WithAxesOptions` in `src/chart/chartTypes.mts`. Verify the type
compiles (`pnpm type-check` exit 0 — no callers yet, so it's a no-op).

**Verify**: `pnpm type-check` → exit 0.

### Step 2: Plumb through the render path

Read the current option flow: `createChart` → `chartState.axesOptions` →
`chartRender.mts` → axis renderer. Add `timeTickFormat` to the plumbing.
The spike's `chartRender.mts` change is the reference — copy the diff.

Key detail (from the spike): the option is read from
`context.state.axesOptions` in the render dispatch. The resolution logic
("if string, convert to d3 timeFormat; if function, pass through") lives
in `chartRender.mts`, NOT in the axis renderer — the renderer receives
an already-resolved `tickFormat` function.

**Verify**: `pnpm type-check` → exit 0.

### Step 3: Apply in the consolidated axis renderer

The consolidated axis renderer (`axisRenderer.mts` or wherever plan 009
landed it) has a `tickFormat` branch. Verify it already accepts a
function. If it does, no renderer change is needed — the option just
flows through the existing forwarding.

If the renderer's `tickFormat` branch only handles the default case
(d3's auto-format), extend it to honor the resolved function.

**Verify**: `pnpm type-check` → exit 0. No behavior change yet (no
callers pass `timeTickFormat`).

### Step 4: Wire into zoom redraw path

The zoom redraw path in `chartRender.mts` re-derives the axis with a
rescaled domain. The `timeTickFormat` option must ALSO be applied here —
otherwise zooming a time-axis chart would revert to d3's default format.

The spike's `chartRender.mts` diff shows both call sites updated. Copy
the zoom-path side too.

**Verify**: `pnpm type-check` → exit 0.

### Step 5: Tests

1. **New unit test** in `src/chart/__tests__/` (suggest `timeTickFormat.test.mts`):
   - With `xType: "time"` and `timeTickFormat: "%Y"`, the rendered x-axis
     tick labels are 4-digit years (e.g., `"2024"`), NOT d3's default
     multi-scale format.
   - With `timeTickFormat` as a custom function (e.g., `(d) => \`Q${Math.ceil((d.getMonth() + 1) / 3)}\``),
     the labels use the custom function.
   - Without `timeTickFormat`, the default d3 behavior is preserved.

2. **Extend the spike's baseline tests** if they're useful (the 4
   empirical-baseline tests from the spike are characterization
   infrastructure — keep them, rename to make intent clear).

3. **Extend the e2e harness** (IF plan 010's harness is on the base):
   add a fourth chart div using `xType: "time"` + `timeTickFormat: "%Y-%m"`.
   Run `pnpm test:e2e` to confirm.

**Verify**: `pnpm test` → exit 0 with new tests passing. `pnpm test:e2e`
(if on base) → exit 0.

### Step 6: Full check

**Verify**: `pnpm check` → exit 0.

## Test plan

- New: `timeTickFormat` unit tests (string form, function form, absence).
- Existing: full characterization suite stays green; e2e harness extends
  with a custom-format chart.

## Done criteria

- [ ] `pnpm check` exits 0
- [ ] `WithAxesOptions.timeTickFormat` exists with `string | ((date: Date) => string)` type
- [ ] Initial render applies the option (unit test asserts)
- [ ] Zoom redraw applies the option (unit test or e2e asserts)
- [ ] String form is converted to `d3.timeFormat` function; function form passed through
- [ ] Default behavior preserved when option is absent (existing characterization tests stay green)
- [ ] No public API changes beyond the additive option
- [ ] No changes to scale factories (option is axis-level, not scale-level)
- [ ] e2e harness extended (if plan 010 on base)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The consolidated axis renderer from plan 009 is NOT present on the base —
  STOP and report. The option depends on the consolidated forwarding.
- The zoom redraw path in `chartRender.mts` does NOT re-derive the axis
  in a way that can consume a custom tick format — STOP and document the
  wall. The design assumed it does; if the architecture doesn't permit
  it, the option surface may need to shrink.
- Adding the option breaks an existing characterization test in a way that
  isn't trivially an assertion update — STOP and report. The option is
  additive; failures suggest a regression.
- The string-to-timeFormat conversion needs d3 version detection (some
  d3 versions have different timeFormat semantics) — STOP and report.
  The prototype assumed d3 v7 semantics.
- The plan 010 e2e harness is not on the base AND its absence blocks
  the zoom-path verification (real-browser proof that zoom preserves the
  custom format) — STOP and report. The e2e proof may need to wait for
  a follow-up plan.

## Maintenance notes

- Per the design doc's phase 2, `timeTickInterval` is the next option.
  Its prototype should be a separate plan (planned AFTER this one merges
  and proves the pattern in production).
- `locale` was rejected in the design doc — do NOT add it without a new
  audit finding that resolves the d3 v7.7+ compatibility concern.
- When the registry migration (plan 014) lands, `timeTickFormat` plumbing
  may need to move into the axes feature's registry entry. Coordinate
  with whoever lands 014 — this plan should land first (or the registry
  entry must reference `timeTickFormat` handling).
- The zoom-aware granularity trade-off (d3's default is zoom-aware; custom
  formats are FIXED granularity) is documented in the design doc. Surface
  it in user-facing docs when this option is documented (separate plan).
