# Plan 005: Fix the tooltip listener leak — namespaced events that dispose actually removes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- src/interactivity/tooltip.mts src/chart/chartLifecycle.mts`
> NOTE: plan 003 (tipviz v3 migration) also edits `tooltip.mts` — line
> numbers below WILL have drifted. Re-locate code by symbol/content match,
> not line number. If the listener registration or cleanup code no longer
> matches the described shape, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/003-tipviz-v3-migration.md
- **Category**: bug
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

`addTooltip` registers `mousemove`/`mouseleave` handlers with NO d3 event
namespace; `chartLifecycle`'s cleanup removes them WITH a `.tooltip`
namespace. d3-selection only removes a listener when the typename string
matches exactly — so `chart.dispose()` never removes these handlers. The
`<rect class="mouse-capture">` keeps live handlers in the DOM after
dispose, firing into a removed registry. This breaks the documented
"dispose releases resources" guarantee and is a genuine memory leak for
SPAs that mount/unmount charts.

## Current state

- `src/interactivity/tooltip.mts:269` — `.on("mousemove", handler)` (no namespace). ~line 335 — `.on("mouseleave", handler)` (no namespace). The `<rect class="mouse-capture">` overlay is created at ~lines 261-264.
- `src/chart/chartLifecycle.mts:54-58` and `:83-87` — removal calls like `.on("mousemove.tooltip", null)` / `.on("mouseleave.tooltip", null)` (namespaced — never matches the unnamespaced registration). Verified against live code at planning time.
- `disposeTooltip` (~line 360) removes the tooltip from its registry but does not `.remove()` the mouse-capture rect.
- Test exemplar: `src/interactivity/__tests__/tooltip.test.mts` (jsdom, dispatches real events).
- Plan 002 added `it.todo("BUG: tooltip listener leak (plan 005)")` in `chartRender.test.mts`.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Red run   | `pnpm test -- tooltip chartLifecycle` | new leak test FAILS before fix |
| Green run | `pnpm test` | all pass |
| Typecheck | `pnpm type-check` | exit 0 |

## Suggested executor toolkit

- Strict TDD: Step 1 red, Step 2 green. Do not fix first.

## Scope

**In scope**:
- `src/interactivity/tooltip.mts` (listener registration sites + mouse-capture rect cleanup)
- `src/interactivity/__tests__/tooltip.test.mts`
- `src/chart/__tests__/chartLifecycle.test.mts` (leak regression case)
- `src/chart/__tests__/chartRender.test.mts` (convert the plan-005 `it.todo` only)

**Out of scope**:
- `chartLifecycle.mts` cleanup call sites (they are already correct — namespaced removal is the desired end state; the registration side is wrong).
- zoomPan listeners, resize observers.
- Any tooltip content/formatting logic (owned by plan 003).

## Git workflow

- Branch: `advisor/005-tooltip-listener-namespace`
- Commit 1: `test: pin dispose removing tooltip listeners (red)`. Commit 2: `fix: namespace tooltip listeners so dispose removes them`.
- Do NOT push unless instructed.

## Steps

### Step 1: Write the failing leak test (RED)

In `src/interactivity/__tests__/tooltip.test.mts` (or `chartLifecycle.test.mts` if the builder-level dispose is easier there):

1. Build a chart with `.withTooltip()`.
2. Grab the `rect.mouse-capture` element; `chart.dispose()`.
3. Assert: dispatching `mousemove` on that rect produces NO tooltip show side-effect, AND (stronger, preferred) the element itself is removed from the DOM.
4. Use `vi.spyOn` on the tooltip show path or check `document.body.contains(rect)` after dispose.

**Verify**: `pnpm test -- tooltip chartLifecycle` → new test fails (listener still attached / rect still present).

### Step 2: Namespace the registrations and remove the rect (GREEN)

1. In `tooltip.mts`, change registrations to `.on("mousemove.tooltip", handler)` and `.on("mouseleave.tooltip", handler)` so the existing namespaced removals in `chartLifecycle.mts` now match.
2. In the tooltip cleanup path, also `.remove()` the `rect.mouse-capture` element (defense in depth: even if a future registration forgets the namespace, the element goes away).

**Verify**: `pnpm test` → all pass. `grep -n '\.on("mousemove"' src/interactivity/tooltip.mts` → no matches without a namespace suffix (expect `.on("mousemove.tooltip"`).

### Step 3: Full check

**Verify**: `pnpm check` → exit 0.

## Test plan

New regression: dispose removes listeners AND the capture rect; mousemove after dispose is inert. Convert plan-005 `it.todo`. Existing 220-line tooltip suite stays green.

## Done criteria

- [ ] `pnpm check` exits 0
- [ ] `grep -n 'on("mousemove\|on("mouseleave' src/interactivity/tooltip.mts` shows only namespaced registrations
- [ ] Leak regression test exists and passes; no plan-005 `it.todo` remains
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- After plan 003's migration the tooltip structure is unrecognizable vs. the description above — stop and report what it looks like now.
- The leak test cannot be made red because jsdom's d3 event plumbing behaves differently than expected after 2 attempts — report the harness behavior.

## Maintenance notes

- Any future listener added to chart-owned DOM must be namespaced (`.on("event.chartId", ...)`) — worth adding to AGENTS.md "Idempotent Rendering" section when this lands.
- Reviewer should verify the rect removal doesn't race an in-flight tooltip show (hide-then-remove order).
