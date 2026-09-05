# Plan 029: Focus/emphasis API — withFocus to highlight one series, mute the rest

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ca94562..HEAD -- src/chart/chartTypes.mts src/chart/chartState.mts src/chart/createChart.mts src/chart/chartRender.mts src/types/processedSeriesTypes.mts docs/api-reference.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: feature (storytelling primitive)
- **Planned at**: commit `ca94562`, 2026-09-04
- **Methodology**: TDD — failing builder-level tests, then implement.

## Why this matters

Cole Knaflic's core move in *Storytelling with Data* is focus: one series
carries the message in full strength, everything else recedes to gray context
("highlight the important stuff, eliminate distractions"). The library
already has the raw primitives — per-series `stroke`, `strokeWidth`, and
`opacity` overrides on `SeriesDescriptor`
(`src/types/processedSeriesTypes.mts:16-25`) — but a consumer must hand-merge
those onto every descriptor and redo it on every `update()`. For a builder
whose purpose is automating SWD-style charts, "highlight one, mute the rest"
must be one call: `chart.withFocus("Revenue")`. This is the single
highest-leverage storytelling convenience the API lacks.

## Current state

Facts verified verbatim at `ca94562`.

### Per-series style overrides already exist — `src/types/processedSeriesTypes.mts:16-25`

```ts
export interface SeriesDescriptor<T> {
  readonly accessor: (d: T) => number;
  readonly label: string;
  readonly opacity?: number | string;
  readonly pointFill?: string;
  readonly pointRadius?: number;
  readonly pointStroke?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number | string;
}
```

`renderLine` respects them (`src/components/line.mts:97-100`):
`s.stroke ?? var(--vl-palette-N)`, `s.opacity ?? var(--vl-line-opacity, 1)`,
same for stroke-width. So dimming = producing descriptors with overridden
`opacity` — no renderer changes needed.

### Where series flow — `src/chart/createChart.mts`

- `state.allSeries` and `state.currentSeries` are `ProcessedSeries<T>[]`
  (descriptors + filtered data), built by `processAllSeries` at `:123-127`
  and rebuilt in `update()` at `:217-221`.
- `state.currentSeries` is what renderers consume (via the render context in
  `chartRender.mts:132-135` and `redrawLine`).
- Visibility filtering precedent: `filterSeriesByLabels` (`:104-107`) maps
  `allSeries` → `currentSeries`. Focus dimming is the SAME pattern: a pure
  descriptor transform applied when `currentSeries` is (re)computed.

### Where currentSeries is recomputed

Three sites, all in `createChart.mts`: initial (`:138` region, state init),
`update()` (`:232-235`), `updateVisibleSeries()` (`:243`). A single
file-local `applyFocus` helper applied at each site keeps them consistent —
this mirrors how `filterSeriesByLabels` is already applied at the same
sites.

### Validation precedent

`assertValidVisibleLabels` (`:109-121`) throws on unknown labels with a
helpful message listing valid ones. `withFocus` must reuse this exact
pattern (unknown focus label → throw, list valid labels).

### Public surface — `src/chart/chartTypes.mts:20-39`

`ChartInstance<T>` declares every fluent method explicitly; add
`readonly withFocus: (labels: null | string | readonly string[]) => ChartInstance<T>;`.
`null` clears focus (restores full-strength rendering).

## Design decisions (settled — do not reopen)

- **API**: `withFocus(labels: string | readonly string[] | null)`. Single
  label, list of labels, or `null` to clear. Chainable like every `with*`.
- **Mechanism**: descriptor transform, NOT post-hoc DOM styling. Non-focused
  series get `opacity` overridden to the dim value; focused series keep
  their descriptors untouched.
- **Dim amount**: theme-driven. Add `focus: Readonly<{ dimOpacity: number }>`
  to `Theme` (`src/types/themeTypes.mts`) with default `0.25` in
  `src/themes/defaultTheme.mts`, overridable via the existing
  `theme` option / `mergeTheme` path. If adding a theme key proves to ripple
  (tests pinning the theme shape), a module-level `DEFAULT_FOCUS_DIM_OPACITY = 0.25`
  in `createChart.mts` is the acceptable fallback — but TRY the theme token
  first; plan 019 established the theme-token pattern.
- **Data is untouched**: extents, points, tooltip all operate on identical
  data; only the rendered opacity changes. `allSeries` getter returns
  undimmed descriptors (focus is presentation, not data).
- **Interaction with explicit `opacity`**: if a consumer set `opacity` on a
  descriptor explicitly, focus dimming OVERRIDES it for non-focused series
  (documented; the consumer can clear focus with `withFocus(null)`).
- **Zoom/update/visibility**: focus survives `update()` and
  `updateVisibleSeries()` (reapplied at the recompute sites). If
  `updateVisibleSeries` hides a focused series, focus silently narrows to
  the visible intersection — do not throw.

## Commands you will need

| Purpose   | Command                                            | Expected on success         |
|-----------|----------------------------------------------------|-----------------------------|
| Typecheck | `pnpm type-check`                                  | exit 0                      |
| Tests     | `pnpm exec vitest run`                             | all pass                    |
| One file  | `pnpm exec vitest run src/chart/__tests__`         | all pass                    |
| Lint      | `pnpm lint`                                        | exit 0                      |
| Build     | `pnpm build`                                       | exit 0                      |

Do NOT use bare `pnpm test` (watch mode hangs on non-TTY). Full suite ~190s —
pass a shell timeout of at least 300000 ms.

## Scope

**In scope** (the only files you should modify):

- `src/chart/chartTypes.mts` — `withFocus` on `ChartInstance`
- `src/chart/chartState.mts` — `focusLabels: ReadonlySet<string>` on
  `ChartState` (empty set = no focus)
- `src/chart/createChart.mts` — `applyFocus` helper + `withFocus` method +
  application at the three recompute sites
- `src/types/themeTypes.mts` — `focus.dimOpacity` token
- `src/themes/defaultTheme.mts` — default `0.25`
- `src/chart/__tests__/` — new tests (new file `focus.test.mts`)
- `docs/api-reference.md` — document `withFocus` + the theme token
- Theme-shape tests that pin Theme keys, if any exist (discover with
  `grep -rn "defaultTheme" src/**/*.test.mts`) — extend, don't weaken

**Out of scope**:

- Renderer changes (`line.mts`, `points.mts`, `legend.mts`) — opacity
  overrides already flow.
- Legend swatch dimming (nice-to-have; deferred — legend colors stay
  full-strength in v1, document it).
- Focus via interaction (hover-to-focus), focus + zoom interplay beyond
  "focus survives re-renders", animated transitions.
- `ChartOptions.focus` factory option — fluent-only for now (YAGNI; the
  fluent call covers the use case).

## Git workflow

- Branch: `advisor/029-focus-api`
- Commits: conventional, e.g. `feat(chart): add withFocus series emphasis`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Failing tests (red)

New file `src/chart/__tests__/focus.test.mts`:

1. Two-series chart, `withFocus("A")` → the `<path>` for series A has
   `opacity` resolving to full (its descriptor default), series B's path has
   `opacity="0.25"`.
2. `withFocus(null)` after focus → both paths back to full opacity.
3. `withFocus(["A", "B"])` on a three-series chart → C dimmed, A/B full.
4. `withFocus("Nope")` → throws, message lists valid labels (mirror
   `assertValidVisibleLabels` message shape).
5. `withFocus("A")` then `update(newData)` → B still dimmed after re-render.
6. `withFocus("A")` then `updateVisibleSeries(["B"])` → no throw; B visible
   and dimmed; A focused-but-hidden.

Use the existing createChart test fixture pattern (find with
`grep -rln "createChart" src/chart/__tests__/` and model after the smallest
one). Assert opacity via the `opacity` attribute on `path.chart-line--<label>`
(`line.mts:93` sets that class).

**Verify**: `pnpm exec vitest run src/chart/__tests__/focus.test.mts` → all 6
FAIL (method missing), rest of suite untouched.

### Step 2: Implement (green)

1. Theme token + default.
2. `ChartState.focusLabels` (init empty set) + comparator implications:
   focus is NOT a registry feature (it transforms series, not DOM features) —
   it lives purely in `createChart`'s recompute path. Do NOT add a
   FeatureFlags entry.
3. `applyFocus(series, focusLabels, dimOpacity)`: if `focusLabels` is empty,
   return `series` unchanged (identity — keeps the fast path and existing
   behavior byte-identical). Otherwise map: focused → unchanged descriptor;
   non-focused → `{ ...s, opacity: dimOpacity }`.
4. Apply `applyFocus` after `filterSeriesByLabels` at the three recompute
   sites.
5. `withFocus` method: `ensureActive()`, normalize arg to a set, validate
   labels (reuse `assertValidVisibleLabels`-style check against
   `state.allSeries`), set state, recompute `currentSeries`, `render()`,
   return `chart`.

**Verify**: focus tests pass; `pnpm exec vitest run` all pass;
`pnpm type-check` exit 0.

### Step 3: Docs

`docs/api-reference.md`: new subsection near "Series Visibility (Controlled
State)" (line ~114) documenting `withFocus`, the dim-opacity theme token
(`--vl-*` CSS var if plan-019's token pattern generates one, otherwise the
`theme.focus.dimOpacity` override), the explicit-`opacity` override rule, and
the "legend swatches stay full-strength" limitation.

**Verify**: `pnpm lint && pnpm build` → exit 0.

## Test plan

- The 6 tests in Step 1 cover: single focus, clear, multi-focus, invalid
  label, persistence across update, focus∩visibility narrowing.
- The identity fast-path (empty focus) must be covered by the ENTIRE existing
  suite passing unmodified — that is the regression guard.
- Verification: `pnpm exec vitest run` → all pass, 6 new tests.

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm exec vitest run` exits 0; the 6 new tests exist and pass
- [ ] `withFocus` present on `ChartInstance` and documented
- [ ] No registry/FeatureFlags changes (grep `focusLabels`
      `src/chart/featureContext.mts` → no match)
- [ ] `allSeries` getter returns undimmed descriptors
- [ ] `pnpm lint` and `pnpm build` exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" don't match the live code (drift),
  including changes from plans 024/025/026 if they landed first.
- A fourth site that recomputes `currentSeries` exists beyond the three
  listed (report it; likely needs the same one-line application).
- Adding the theme token breaks theme-shape tests in a way that requires
  weakening assertions (use the documented fallback constant instead and
  report).
- Rendering dimmed series requires changes inside `line.mts` (the descriptor
  override should already flow — if it doesn't, the renderer contract drifted).

## Maintenance notes

- Natural follow-up (deferred): `withFocus` + plan 030's end labels pair
  beautifully — focused series gets its end label, dimmed series lose theirs.
  If 030 lands after this, its spec already accounts for it.
- A reviewer should scrutinize: the identity fast-path (no behavior change
  when unfocused), label validation reusing the existing error-message
  pattern, and focus surviving `update()`.
- Explicitly deferred: legend swatch dimming, hover-focus, animated dimming,
  factory option. All YAGNI until requested.
