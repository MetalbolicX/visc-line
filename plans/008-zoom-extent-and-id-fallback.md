# Plan 008: Fix zoom extent to respect margins and replace crypto.randomUUID with a safe fallback

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- src/interactivity/zoomPan.mts src/chart/createChart.mts src/chart/chartRender.mts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/002-characterization-suite.md
- **Category**: bug
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

Two independent small defects:

1. **Zoom extent ignores margins.** `zoomPan.mts` hardcodes the d3-zoom `extent` to `[[0,0],[innerWidth,innerHeight]]` in SVG coordinates, but chart content lives at `[margins.left, margins.top]` … `[margins.left+innerWidth, margins.top+innerHeight]` (the bounds group is translated by margins, and zoom is attached to the `svg`). Users can pan content into the margin band — the chart "feels wrong" at the edges.
2. **`crypto.randomUUID()` crashes on non-secure origins.** `createChart.mts:102` uses it for the clip-path id. On plain `http://` (intranet dashboards, LAN-IP dev), `crypto.randomUUID` is `undefined` and every `createChart` call throws before the first render.

## Current state

- `src/interactivity/zoomPan.mts:43-46` — `extent` hardcoded `[[0, 0], [innerWidth, innerHeight]]`. The function receives dimensions; margins availability depends on its current signature — READ the file first and trace where margins live (`Dimensions` type includes margins; check `src/types/layoutTypes.mts` and how `chartRender.mts` calls `addZoomPan`).
- `src/chart/createChart.mts:102` — `crypto.randomUUID().slice(0, 8)` (clip-path id). `src/chart/chartRender.mts` may also reference the id or the `clipPathId` state field — grep `clipPathId` before editing.
- `createChart.mts:105` — `renderBoundsGroup(svg, margins)` (the translate that makes the margin offset real).
- Test exemplars: `src/interactivity/__tests__/zoomPan.test.mts` (96 lines), `src/chart/__tests__/createChart.test.mts`.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Red run   | `pnpm test -- zoomPan createChart` | new tests FAIL before fix |
| Green run | `pnpm test` | all pass |
| Typecheck | `pnpm type-check` | exit 0 |

## Suggested executor toolkit

- Strict TDD: Step 1 red, Step 2 green.

## Scope

**In scope**:
- `src/interactivity/zoomPan.mts`
- `src/interactivity/__tests__/zoomPan.test.mts`
- `src/chart/createChart.mts` (the randomUUID line + id-generation helper if extracted)
- `src/chart/chartRender.mts` ONLY IF the `addZoomPan` call site must pass margins through
- `src/chart/__tests__/createChart.test.mts` (crypto fallback case)

**Out of scope**:
- Zoom redraw pipeline changes (plan 012 design).
- `responsiveness.mts`, tooltip, other id generation.

## Git workflow

- Branch: `advisor/008-zoom-extent-and-id-fallback`
- Commit 1: `fix: constrain zoom extent to the margins-adjusted plot area`. Commit 2: `fix: fall back to Math.random id when crypto.randomUUID unavailable`.
- Do NOT push unless instructed.

## Steps

### Step 1: Write failing tests (RED)

1. `zoomPan.test.mts`: construct the zoom behavior through the public path with non-zero margins; assert the configured `extent` equals `[[margins.left, margins.top], [margins.left + innerWidth, margins.top + innerHeight]]` (observe via the d3 zoom behavior's stored extent or a programmatic transform constraint — match how the existing 96-line suite observes zoom config).
2. `createChart.test.mts`: stub `globalThis.crypto` so `randomUUID` is `undefined` (save/restore the original in `beforeEach`/`afterEach`); `createChart` must not throw and must produce a valid clip-path id (string, non-empty, unique across two charts in the same document).

**Verify**: `pnpm test -- zoomPan createChart` → the 2 new cases fail.

### Step 2: Implement (GREEN)

1. `zoomPan.mts`: derive the extent from margins — either use the margins already present in its inputs (if the signature carries `Dimensions` with margins) or extend the `addZoomPan` inputs and update the call site in `chartRender.mts` accordingly. Keep the zero-margins case identical to today's behavior.
2. `createChart.mts:102`: `const clipPathId = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)).slice(0, 8)` — or extract a tiny `generateChartId()` helper if cleaner; keep uniqueness within one document.

**Verify**: `pnpm test` → all pass.

### Step 3: Full check

**Verify**: `pnpm check` → exit 0.

## Test plan

Two regression tests per Step 1. Manual sanity (optional, for the reviewer): in `examples/main.mts` dev page, pan hard left — content must stop at the plot-area edge, not the SVG edge.

## Done criteria

- [ ] `pnpm check` exits 0
- [ ] `grep -n "0, 0" src/interactivity/zoomPan.mts` shows no hardcoded origin (extent derives from margins)
- [ ] `grep -n "randomUUID" src/chart/createChart.mts` shows the optional-chained fallback
- [ ] Both regression tests pass
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `addZoomPan` signature change ripples beyond `chartRender.mts` into public types (`WithZoomPanOptions`) — stop and report; options-shape changes need a design decision, not improvisation.
- Existing zoom tests pin the extent as `[[0,0],...]` explicitly (i.e. current behavior is asserted as desired) — report the test.

## Maintenance notes

- If zoom is ever attached to the bounds `<g>` instead of the `svg` (an alternative fix shape deliberately not taken here), the extent becomes content-relative — revisit this constraint then.
- The id fallback exists for non-secure contexts; do not "clean it up" back to bare `crypto.randomUUID()`.
