# Plan 028: Public accessibility surface — ariaLabel and xLabel on ChartOptions

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ca94562..HEAD -- src/chart/chartTypes.mts src/chart/createChart.mts src/chart/featureContext.mts src/chart/featureDefs/axes.mts src/components/SVG.mts docs/api-reference.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: feature (public API surface), accessibility
- **Planned at**: commit `ca94562`, 2026-09-04
- **Methodology**: simple edits + tests — the plumbing already exists; this is
  exposure, not new machinery.

## Why this matters

A chart builder that "automates" chart creation cannot require consumers to
drop to internal APIs for a labeled, screen-reader-friendly chart. Today the
low-level renderer accepts an ARIA label (`renderSVG(container, ariaLabel)`
at `src/components/SVG.mts:17-36`) but `createChart` hardcodes
`"Interactive line chart"` (`src/chart/createChart.mts:101`) and
`ChartOptions` has no `ariaLabel`. Worse, `yLabel` is public
(`chartTypes.mts:46`) while `xLabel` exists only as an internal renderer
(`renderXAxisLabel`, used manually in `examples/main.mts:117`) — an
asymmetry with no justification. This plan exposes both through
`ChartOptions` with one-word plumbing.

## Current state

Facts verified verbatim at `ca94562`.

### The hardcoded label — `src/chart/createChart.mts:59-101`

```ts
export const createChart = <T,>(
  container: HTMLElement,
  config: ChartConfig<T>,
  {
    curve,
    margins = DEFAULT_MARGINS,
    theme,
    xType = "time",
    yLabel,
  }: ChartOptions = {},
): ChartInstance<T> => {
  ...
  const svg = renderSVG(container, "Interactive line chart");
```

### The renderer that already supports it — `src/components/SVG.mts:17-36`

```ts
export const renderSVG = (
  container: HTMLElement,
  ariaLabel?: string,
): SVGSelection => {
  const selection = select(container)
    .selectAll<SVGSVGElement, null>("svg")
    .data([null])
    .join("svg")
    ...
    .attr("role", "img");
  if (ariaLabel) {
    selection.attr("aria-label", ariaLabel).attr("aria-hidden", null);
  } else {
    selection.attr("aria-hidden", "true");
  }
  return selection;
};
```

Note the semantics: a provided label makes the SVG an exposed `role="img"`
with `aria-label`; no label marks it `aria-hidden`. Preserving this exact
behavior is part of the contract — the default `"Interactive line chart"`
string is what currently keeps charts out of `aria-hidden`.

### ChartOptions today — `src/chart/chartTypes.mts:41-47`

```ts
export interface ChartOptions {
  readonly curve?: CurveFactory | CurvePreset;
  readonly margins?: Margins;
  readonly theme?: Partial<Theme>;
  readonly xType?: ScaleType;
  readonly yLabel?: string;
}
```

### How yLabel flows (the precedent to mirror)

`createChart` destructures `yLabel` → threads it into the render context →
`FeatureRenderContext.yLabel` (`src/chart/featureContext.mts:100`) → the
axes def reads `ctx.yLabel` and calls `renderYAxisLabel`. `xLabel` must
follow the identical path: `ChartOptions.xLabel` → context field →
`renderXAxisLabel` in the axes def (`src/chart/featureDefs/axes.mts` — read
it after the drift check; it is the file that already calls
`renderYAxisLabel`).

`renderXAxisLabel` and `renderYAxisLabel` already exist and are exported via
`src/internal.mts` (both imported in `examples/main.mts:21,24`), so no new
component is needed.

### Docs home

`docs/api-reference.md`, section "### `createChart`" (line ~9) documents the
options object — add both fields there. "Public Types Reference" (line ~401)
lists `ChartOptions` — regenerate/update its field list.

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

- `src/chart/chartTypes.mts` — add `ariaLabel?: string` and `xLabel?: string`
  to `ChartOptions`
- `src/chart/createChart.mts` — destructure both; pass `ariaLabel` into
  `renderSVG` (keeping `"Interactive line chart"` as the default); thread
  `xLabel` into the render context
- `src/chart/featureContext.mts` — add `readonly xLabel?: string` to
  `FeatureRenderContext` (mirror `yLabel` at `:100`)
- `src/chart/chartRender.mts` and/or wherever the context object is
  assembled — include `xLabel` (follow exactly how `yLabel` is assembled)
- `src/chart/featureDefs/axes.mts` — call `renderXAxisLabel` when
  `ctx.xLabel` is set (mirror the existing yLabel call)
- `src/chart/__tests__/` — new tests
- `docs/api-reference.md` — document both options

**Out of scope**:

- Changing the `renderSVG` aria-hidden/label semantics.
- Axis label theming/styling beyond what `renderXAxisLabel` already does.
- `title`-as-aria fallback logic or any heuristic label generation — the
  consumer provides the string or gets the existing default.
- Auto-generating an `aria-label` from title/series (a genuinely good future
  idea — deferred; keep this plan to pure plumbing).

## Git workflow

- Branch: `advisor/028-a11y-xlabel-surface`
- Commits: conventional, e.g. `feat(chart): expose ariaLabel and xLabel on ChartOptions`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Failing tests (red)

In `src/chart/__tests__/` (new file `a11yOptions.test.mts` or the existing
createChart test file — follow the local pattern):

1. `createChart(container, config, { ariaLabel: "Monthly revenue, 2020–2024" })`
   → the rendered `<svg>` has `aria-label="Monthly revenue, 2020–2024"` and
   no `aria-hidden="true"`.
2. Default options → `<svg aria-label="Interactive line chart">` (pin the
   current default so the fallback is contractual).
3. `createChart(..., { xLabel: "Month" }).withAxes()` → an x-axis label text
   node containing "Month" exists (use the same selector strategy the
   existing yLabel test uses — find it with
   `grep -rn "yLabel" src/chart/__tests__/`).
4. No `xLabel` → no x-axis label node (negative check).

**Verify**: `pnpm exec vitest run src/chart/__tests__` → tests 1 and 3 FAIL,
2 and 4 pass.

### Step 2: Implement the plumbing (green)

Follow the `yLabel` path exactly for `xLabel`; pass
`ariaLabel ?? "Interactive line chart"` to `renderSVG` at
`createChart.mts:101`. Add JSDoc on both new `ChartOptions` fields:
`ariaLabel` — "Accessible name for the chart SVG (role=img). Defaults to
'Interactive line chart'."; `xLabel` — "X-axis label text; rendered only
when axes are enabled."

**Verify**: `pnpm exec vitest run src/chart/__tests__` → all pass.
`pnpm type-check` → exit 0.

### Step 3: Docs

Add both options to `docs/api-reference.md` in the `createChart` section and
the Public Types Reference listing.

**Verify**: `pnpm exec vitest run && pnpm lint && pnpm build` → all exit 0.

## Test plan

- The 4 tests in Step 1 cover: explicit label, default label, xLabel
  rendering, xLabel absence.
- Existing aria/title tests must pass unmodified.
- Verification: `pnpm exec vitest run` → all pass, 4 new tests.

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm exec vitest run` exits 0; the 4 new tests exist and pass
- [ ] `ChartOptions` has `ariaLabel` and `xLabel`, both optional
- [ ] Default chart still gets `aria-label="Interactive line chart"`
- [ ] `docs/api-reference.md` documents both options
- [ ] `pnpm lint` and `pnpm build` exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" don't match the live code (drift).
- `yLabel` turns out NOT to flow through `FeatureRenderContext` (the plan's
  core precedent is wrong — re-read and report the actual mechanism).
- `renderXAxisLabel` requires context the axes def doesn't have (e.g. it
  needs dimensions the def can't access).
- Test 2 (default label) fails BEFORE any changes — meaning the default
  string changed; report the new default.

## Maintenance notes

- Future idea (explicitly deferred): derive a default `aria-label` from
  `withTitle` text + series labels when the consumer doesn't provide one.
  That is a heuristic design decision for the owner, not plumbing.
- A reviewer should scrutinize: the default-label fallback is preserved,
  `aria-hidden` semantics untouched, and `xLabel` renders only with axes on
  (matching `yLabel` behavior).
- Plan 022's merge (plan 027) adds features but does not touch this path; no
  interaction expected.
