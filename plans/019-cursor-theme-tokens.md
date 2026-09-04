# Plan 019: Theme tokens for the tooltip cursor layer + single-sourced fallbacks

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f884f20..HEAD -- src/interactivity/tooltip.mts src/themes/defaultTheme.mts`
> On any change, compare "Current state" excerpts against live code; STOP on mismatch.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (independent of 016–018; different files)
- **Category**: tech-debt (convention compliance + themability)
- **Methodology**: **STRICT TDD** — new themability is new behavior. Write failing
  theme-override tests first (RED), then extend the theme schema and renderer (GREEN).
  Default values are chosen to preserve today's literal rendering, so existing tests
  (including `createChart.test.mts` asserting `r=5`) must stay green throughout.
- **Planned at**: commit `f884f20`, 2026-09-03

## Why this matters

AGENTS.md mandates "CSS vars (`var(--vl-*)`) for all visual attributes — no hardcoded
inline style values in renderers", and the theme object + `applyThemeCssVars` exist to
make every visual themable. The tooltip's cursor layer violates both: the cursor line
and dots carry hardcoded `#aaa`, `stroke-width: 1`, `"4 3"`, `r: 5`, `white`,
`stroke-width: 2`. A user who themes their chart gets a cursor layer that ignores the
theme. Secondary issue in the same convention family: several components keep each
default value in TWO places (numeric `readCssNumber` fallback and string
`var(..., fallback)` literal), so changing a default silently half-works.

## Current state

- `src/interactivity/tooltip.mts:212-236` — the cursor layer (the tipviz HTML template
  right above it, `:188-194`, already follows the `var(--vl-tooltip-*)` convention —
  the cursor layer is the file's lone deviation):

```ts
const cursorLine = tooltipLayer
  .selectAll<SVGLineElement, null>("line.cursor-line")
  .data([null]).join("line")
  .attr("class", "cursor-line")
  .attr("y1", 0)                        // geometry — stays as-is
  .attr("y2", innerHeight)              // geometry — stays as-is
  .attr("stroke", "#aaa")               // ← hardcode
  .attr("stroke-width", 1)              // ← hardcode
  .attr("stroke-dasharray", "4 3")      // ← hardcode
  .attr("pointer-events", "none")
  .attr("display", "none");
const cursorDots = tooltipLayer
  .selectAll<SVGCircleElement, ProcessedSeries<T>>("circle.cursor-dot")
  .data(series, ({ label }) => label).join("circle")
  .attr("class", ({ label }) => `cursor-dot cursor-dot--${label}`)
  .attr("r", 5)                         // ← hardcode (asserted at createChart.test.mts:456)
  .attr("fill", ({ stroke }) => stroke ?? "steelblue")  // series-driven — stays
  .attr("stroke", "white")              // ← hardcode
  .attr("stroke-width", 2)              // ← hardcode
  .attr("pointer-events", "none")
  .attr("display", "none");
```

- `src/themes/defaultTheme.mts` — nested token object (`Theme` from
  `@/types/index.mjs`); existing `tooltip` block (lines ~71–78):
  `background, border, borderRadius, color, fontSize, padding`. Note
  `grid: { dashArray: "4 7", ... }` — string dashArray is an established pattern.
- CSS vars are DERIVED from this object by `applyThemeCssVars` (locate with
  `rg -n "applyThemeCssVars" src/` — themes/ or utils/; follow ITS existing
  mapping convention when adding new tokens; `--vl-point-radius` etc. already flow
  from `points.radius/stroke/strokeWidth` at defaultTheme.mts:59–65).
- Numeric CSS-var reads use `readCssNumber(node, varName, fallback)` from
  `src/utils/cssVariables.mts:90-98` (mind the `Number.isFinite` gotcha documented at
  :80-83 — read it before using).
- Double-bookkeeping example, `src/components/axisLabel.mts` — numeric side
  (`readCssNumber(node, "--vl-axis-font-size", 12)` at :42) vs string side
  (`.style("font-size", "var(--vl-label-font-size, 12px)")` at :80, :120); same
  pattern in `src/components/legend.mts:67-68` and `src/components/points.mts:50`.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Tests     | `pnpm test -- tooltip theme`     | RED in Step 1, GREEN after Step 3 |
| Typecheck | `pnpm type-check`                | exit 0 (after Step 2) |
| Full gate | `pnpm check`                     | exit 0              |

## Scope

**In scope**:
- `src/types/themeTypes.mts` (+ `src/types/index.mts` if it barrel-exports Theme)
- `src/themes/defaultTheme.mts`
- `applyThemeCssVars` implementation file (wherever `rg` finds it)
- `src/interactivity/tooltip.mts` (cursor-layer attributes only)
- Fallback single-sourcing: `src/components/axisLabel.mts`, `src/components/legend.mts`,
  `src/components/points.mts` (constants only)
- Tests: `src/interactivity/__tests__/tooltip.test.mts`, `src/themes/__tests__/defaultTheme.test.mts`
  (extend), new theme-override test file if cleaner

**Out of scope** (do NOT touch):
- `tooltip.mts` tipviz template (already var-driven) and event logic
- The `steelblue` series-fill fallback and `y1/y2` geometry
- Plan 018's registry refactor; if 018 landed first, apply the same edits to the
  relocated files — the line anchors map by content
- Existing literal-value assertions (`r=5` at `createChart.test.mts:456`) — they must
  keep passing because defaults preserve today's rendering

## Git workflow

- Branch: `advisor/019-cursor-theme-tokens`
- Commits: `test: ...` → `feat: ...` → `refactor: ...` per TDD phase
- Do NOT push. Update `plans/README.md` row when done.

## Steps

### Step 1: RED — failing themability tests

Extend `src/interactivity/__tests__/tooltip.test.mts` (harness patterns are in-file)
and/or `src/themes/__tests__/defaultTheme.test.mts` with:

1. Default rendering: cursor line has `stroke="#aaa"`, `stroke-width="1"`,
   `stroke-dasharray="4 3"`; cursor dot has `r="5"`, `stroke="white"`,
   `stroke-width="2"`. (These may already pass — they pin defaults.)
2. **Themed rendering (the RED tests)**: apply a `ThemeOverride` with the new cursor
   tokens (e.g. `tooltip: { cursor: { color: "#ff0000", dashArray: "1 1", dotRadius: 8,
   dotStroke: "#00ff00", dotStrokeWidth: 3 } }`) via `createChart` (or
   `applyThemeCssVars` + `addTooltip` directly, matching how existing theme tests do
   it — check `src/themes/__tests__/defaultTheme.test.mts` for the established way).
   Assert the rendered attrs reflect the override.

Token shape decision (follow spec conventions in `themeTypes.mts`): extend
`Theme["tooltip"]` with a `cursor` sub-object:

```ts
cursor: {
  color: string;          // default "#aaaaaa" (today's #aaa)
  dashArray: string;      // default "4 3"
  dotRadius: number;      // default 5
  dotStroke: string;      // default "#ffffff" (today's white)
  dotStrokeWidth: number; // default 2
}
```

**Verify**: `pnpm test -- tooltip theme` → override tests FAIL (type error on the new
token or assertion mismatch); default-rendering tests PASS.

### Step 2: Extend the theme schema + defaults + var mapping

1. `src/types/themeTypes.mts`: add the `cursor` sub-type (DeepPartial compatibility
   comes free via existing `ThemeOverride` machinery).
2. `src/themes/defaultTheme.mts`: add defaults preserving TODAY'S literal values
   exactly (`#aaa`→`"#aaaaaa"` if the palette convention uses 6-digit hex — match how
   existing tokens spell colors; visual parity is the requirement).
3. `applyThemeCssVars` file: map to `--vl-tooltip-cursor-color`,
   `--vl-tooltip-cursor-dash-array`, `--vl-tooltip-cursor-dot-radius`,
   `--vl-tooltip-cursor-dot-stroke`, `--vl-tooltip-cursor-dot-stroke-width` —
   following the file's existing naming derivation for nested tokens.

**Verify**: `pnpm type-check` → exit 0.

### Step 3: GREEN — route the cursor layer through vars

In `src/interactivity/tooltip.mts` (cursor layer only):
- String attrs → `.attr("stroke", "var(--vl-tooltip-cursor-color, #aaa)")`,
  `.attr("stroke-dasharray", "var(--vl-tooltip-cursor-dash-array, 4 3)")`.
- Numeric attrs → `readCssNumber(node, "--vl-tooltip-cursor-dot-radius", 5)` etc.
  (get `node` via the existing selection's `.node()`; mirror how `legend.mts`/
  `points.mts` read numeric vars).

**Verify**: `pnpm test -- tooltip theme` → ALL pass (override + default).
`pnpm test` → full suite green (the `r=5` assertions must be untouched and passing).

### Step 4: Single-source the duplicated fallbacks

In `axisLabel.mts`, `legend.mts`, `points.mts`: introduce file-local constants (or a
shared `src/utils/styleDefaults.mts` if ≥3 files share a value — they don't all, so
prefer file-local) so each default exists once. Pattern:

```ts
const LABEL_FONT_SIZE = 12;
// numeric side:  readCssNumber(node, "--vl-label-font-size", LABEL_FONT_SIZE)
// string side:   .style("font-size", `var(--vl-label-font-size, ${String(LABEL_FONT_SIZE)}px)`)
```

Apply to the overlapping pairs found at `axisLabel.mts:39-42/:80-82/:120-122`,
`legend.mts:67-68`, `points.mts:50`. Values must not change.

**Verify**: `pnpm test` → all pass (this step is pure constant extraction).

### Step 5: Full gate + bookkeeping

**Verify**: `pnpm check` → exit 0. Update the 019 row in `plans/README.md` to DONE.

## Test plan

- New cases: themed cursor line (color/dash), themed cursor dot (radius/stroke/width),
  default parity (all six attrs at today's literals).
- Patterns: `src/themes/__tests__/defaultTheme.test.mts` (theme application),
  `src/interactivity/__tests__/tooltip.test.mts` (cursor-layer DOM assertions).
- Regression: `src/chart/__tests__/createChart.test.mts:~456` (`r=5`) must pass
  untouched — it is the default-parity canary.
- Verification: `pnpm test` → all pass, zero assertion edits to existing tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm check` exits 0
- [ ] `rg -n '"#aaa"|stroke-width", 1|"4 3"|"r", 5|"white"|stroke-width", 2' src/interactivity/tooltip.mts` → no hardcoded attr values on the cursor layer (fallback strings inside `var()` calls excepted)
- [ ] `rg -n "tooltip-cursor" src/themes/ src/interactivity/tooltip.mts` → var names present in both mapping and renderer
- [ ] Theme override test exists and passes; `createChart.test.mts` `r=5` assertion untouched and green
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- `applyThemeCssVars` derives var names in a way that can't accommodate nested
  `tooltip.cursor` tokens without restructuring (report the actual mechanism).
- Making the default render pixel-identical proves impossible (e.g. jsdom returns
  empty strings for `var()` in `.attr()` string contexts — if so, report; numeric
  reads via `readCssNumber` and template strings are the fallback strategy).
- An existing test asserts a cursor attr you cannot keep green with default parity.
- The `DeepPartial` override machinery rejects the nested addition (type-level
  surprise in `mergeTheme`).

## Maintenance notes

- If plan 018 relocates tooltip setup, the var reads move with it — the var NAMES are
  the stable contract, not the file layout.
- Docs: `docs/api-reference.md` documents theme tokens — add the `tooltip.cursor`
  block there (or flag for the docs pass) before releasing; the theme is public API.
- Reviewers: confirm default parity by rendering the examples demo (`pnpm dev`) with
  no override — visuals must be indistinguishable from pre-change.
