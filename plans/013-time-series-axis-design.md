# Plan 013: DESIGN — Time-series axis polish (formats, intervals, zoom-aware granularity)

> **Executor instructions**: This is a DESIGN/SPIKE plan. You produce a
> design document with a validated API sketch, not a merged feature.
> Follow the steps; verification is document + prototype assertions. If
> anything in the "STOP conditions" section occurs, stop and report. When
> done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- src/services/scales.mts src/components/xAxis.mts src/components/yAxis.mts src/chart/chartTypes.mts`
> Plan 009 consolidated the axis renderers — re-locate code by symbol. If
> the structural description no longer holds, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M (design)
- **Risk**: LOW (spike only; no production changes land)
- **Depends on**: plans/009-component-consolidation.md (axis renderer must be the consolidated one before extending it)
- **Category**: direction
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

The library positions time series (`xType: "time"`) as a headline mode,
but time axes run on d3's defaults with no user control: no custom tick
format, no tick-interval selection, and locale assumptions baked in.
d3-axis's default multi-scale time formatting is decent — the gap is the
INABILITY to override and control it, plus Zoom/pan changing the domain
without any format-granularity story. This is the highest-grounded
direction finding: the architecture (scale factories + consolidated axis
renderer) makes these options disproportionately cheap to add.

## Current state

- `src/services/scales.mts:23-28` — `scaleFactories` includes `time: () => scaleTime()`. `ScaleType = "linear" | "log" | "pow" | "time"` (`src/types/scalesTypes.mts:11`).
- After plan 009: axis rendering is one parameterized internal factory; the tickFormat branch already exists (it forwards a user format when present — verify during the spike by reading the consolidated renderer).
- `examples/main.mts:85` — demo sets `xType: "time"` and relies on defaults.
- Time data flows: dates parsed/filtered in `dataWrangling.mts` (repo convention: "Parse dates; filter invalid numeric values before rendering").
- Zoom path: `chartRender.mts` zoom dispatch re-renders axes per transform (`rescaleX`-style or manual — READ and document exactly how the zoom path derives new domains during the spike; it determines whether tick-format re-evaluation is automatic or needs a hook).
- Test exemplars: `src/services/__tests__/scales.test.mts`, the axis component tests, `tests/e2e/harness.html` (plan 010 — has a time-series chart already).

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Tests     | `pnpm test` | all pass on spike branch |
| Typecheck | `pnpm type-check` | exit 0 |
| E2E (if harness extended) | `pnpm test:e2e` | pass |

## Scope

**In scope**:
- `docs/design/time-series-axis.md` (create — the deliverable)
- Spike branch `spike/013-time-axis` with a throwaway prototype (options + renderer wiring; NOT merged)

**Out of scope**:
- Merging the feature — a numbered build plan follows from this design.
- Time-on-Y support (audit finding DIR-01 was REJECTED as mis-attributed — the type already permits it; no work needed).
- Calendar/zoom brushing, annotations (separate future directions).

## Git workflow

- Branch: `spike/013-time-axis`
- Commit: `docs: add time-series axis design (plan 013 spike)`.
- Do NOT push unless instructed.

## Steps

### Step 1: Document current time-axis behavior empirically

On the spike branch, write a scratch test (or extend the e2e harness) that
renders a time axis across three domain spans (1 day, 1 month, 5 years)
and records the actual tick values + formats produced today, including
after a simulated zoom transform. This is the baseline the design diffs
against.

**Verify**: findings recorded in the design doc's "Current behavior" section (tick counts, format strings, zoom behavior).

### Step 2: Design the option surface

In the design doc, propose extensions to the axes options (following the
existing `WithAxesOptions` shape in `src/chart/chartTypes.mts`):

- `timeTickFormat?: string | ((date: Date) => string)` — a d3 time-format specifier or custom function, forwarded to `axis.tickFormat`.
- `timeTickInterval?: { every: number; unit: "second"|"minute"|"hour"|"day"|"week"|"month"|"year" }` — maps to `d3.timeInterval`-based `.ticks(interval)`.
- `locale?: string | LocaleSpecification` — only if d3's `timeFormatDefaultLocale` interplay is tractable; otherwise record as out-of-scope with reasoning.
- Zoom-aware granularity: evaluate whether d3's default multi-scale format should remain when NO custom format is given (likely yes — it is zoom-aware by construction when tickFormat is unset); custom formats are then FIXED granularity — document that trade-off explicitly rather than over-engineering auto-format switching.

Answer in the doc: where each option is consumed (scale ticks vs axis
tickFormat vs both), how they interact with the zoom redraw path found in
Step 1, and the exact public type additions.

### Step 3: Prototype the minimal slice

Implement `timeTickFormat` only, end-to-end: type → options plumbing →
consolidated axis renderer → one unit test asserting formatted tick labels
→ one harness chart in `tests/e2e/harness.html` (if plan 010 has landed)
using a custom format.

**Verify**: `pnpm test` green with the new assertion; prototype on the spike branch only.

### Step 4: Write the recommendation

Design doc ends with: build plan skeleton for the full option set (steps
per option), risks (format-string misuse, interval×domain-edge
interactions like month ticks on day-spans), open questions, and a
proceed/refine/reject recommendation.

**Verify**: `test -f docs/design/time-series-axis.md && grep -c "Recommendation" docs/design/time-series-axis.md` → ≥ 1.

## Test plan

Spike-level: the Step 1 empirical baseline + Step 3's one unit test and
harness chart. The real test plan lives in the follow-up build plan.

## Done criteria

- [ ] `docs/design/time-series-axis.md` exists with Current-behavior baseline, option surface, zoom interaction analysis, prototype findings, Recommendation
- [ ] Spike branch has the `timeTickFormat` prototype; `pnpm test` green there
- [ ] Mainline untouched
- [ ] `plans/README.md` status row updated (DONE = design delivered)

## STOP conditions

- Step 1 reveals the zoom path re-derives domains in a way that makes per-tick format hooks architecturally invasive (would require touching the zoom pipeline) — stop and document the wall; the option surface may need to shrink.
- The consolidated axis renderer (plan 009) does not actually exist yet (dependency not run) — stop; this design builds on it.

## Maintenance notes

- The follow-up build plan should ship options one at a time (`timeTickFormat` first — it is pure forwarding) with characterization tests extended per option.
- If area charts (deferred direction) land later, their zoom redraw must reuse whatever tick-granularity story this design settles.
