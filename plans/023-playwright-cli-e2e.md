# Plan 023: playwright-cli-driven e2e harness (revive the orphaned browser test layer)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 42b5d56..HEAD -- tests/ package.json src/chart/chartTypes.mts src/services/scales.mts`
> If any of these changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (test-layer only; zero `src/` changes)
- **Depends on**: plans/001-verification-baseline.md, plans/004-empty-data-guard.md (both DONE)
- **Category**: tests
- **Planned at**: commit `42b5d56`, 2026-09-04

## Why this matters

The library ships a browser e2e harness (`tests/e2e/harness.html`, added by
plan 010) that verifies the things jsdom cannot: real CSS custom-property
resolution, real tick layout, real zoom event physics, the `<tip-viz-tooltip>`
custom element. But the driver is dead: merge `107bc0d` ("Merge branch
'advisor/011-lint-restore'") resolved a `package.json` conflict in a way that
silently dropped both the `@playwright/test` devDependency and the `test:e2e`
script (verified: `git show 28e6429:package.json | grep playwright` → 1 match;
`git show 107bc0d:package.json` → 0). Since then `tests/e2e/serve-and-run.mjs`
imports a package that is not installed and no npm script reaches it — the
entire browser-verification layer is orphaned. This plan revives the layer
with a **zero-dependency driver**: the globally installed `playwright-cli`
(session pattern, modeled on the sibling project tipviz), deleting the dead
runner instead of resurrecting the dependency.

## Current state

- `tests/e2e/harness.html` (114 lines, intact) — static page mounting three
  charts through the public builder API. Verified against live code. Key
  detail: line 49 loads the bundle with a **relative-to-dist path**:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>
  <script src="./index.umd.js"></script>
  ```
  The old runner copied this file into `dist/` before serving. The new flow
  serves the **project root**, so this `src` must become `../../dist/index.umd.js`.
  Mounts: `#chart-full` (time x, all features: `withAxes().withGrid().withPoints()
  .withTitle({title}).withLegend({items:[{label,color}]}).withTooltip().withZoomPan()`),
  `#chart-minimal` (`xType: 'linear'`, no fluent calls), `#chart-empty`
  (`data: []`). `window.onerror` feeds `window.__chartError`.
  ⚠ The harness does **not** retain chart instances — scenario F (below)
  requires adding `window.__charts = { full, minimal, empty }`.
- `tests/e2e/serve-and-run.mjs` (11 KB) — dead runner; line 16
  `import { chromium } from "@playwright/test"` fails because the dep no
  longer exists. **Delete it.**
- `tests/e2e/README.md` — documents the dead `pnpm test:e2e` flow.
  **Rewrite it** for the session flow.
- Public API (verified, `src/chart/chartTypes.mts:20-61`,
  `src/chart/createChart.mts:59-87`):
  `createChart(container, { data, xSerie: {accessor,label}, ySeries: [{accessor,label}] }, { xType?, curve?, margins?, theme?, yLabel? })`
  returns a `ChartInstance` with fluent re-rendering methods: `withAxes()`,
  `withGrid({showX?,showY?}?)`, `withPoints()`, `withTitle({title})`,
  `withLegend({interactive?,items?,onToggle?})` (argument required),
  `withTooltip({formatX?,formatY?,stylesheetUrl?,tooltipHtml?}?)`,
  `withZoomPan({onZoom?,scaleExtent?}?)`, `withCustom(cb)`,
  `withVisibleSeries(labels)`, `update(newData)`, `updateVisibleSeries(labels)`,
  `dispose()`. Render happens on construction; there is no `.render()`.
- DOM selectors for assertions (verified literals):
  - line path: `path.chart-line` (`.chart-line--<label>` suffix), `src/components/line.mts:93`
  - axes: `g.x-axis` / `g.y-axis` (`src/components/axisRenderer.mts:35,40`), ticks are `text` inside
  - grid: `line.grid-x` / `line.grid-y` (`src/components/grid.mts:81,117`)
  - points: `circle.point` inside `g.point-series` (`src/components/points.mts:56,62`)
  - title: `.chart-title` (`src/components/title.mts:41`)
  - legend: `.legend-entry` > `.swatch` + `.legend-label` (`src/components/legend.mts:75,82`)
  - tooltip: custom element `tip-viz-tooltip` (`src/interactivity/tooltip.mts:177`), `.cursor-line` (:219), capture rect `.mouse-capture` (:245)
  - zoom: `d3.zoom` attached to the `svg` element (`src/interactivity/zoomPan.mts:56`); re-render goes through `src/chart/zoomDispatch.mts`
- Empty-data guard message (exact literal, `src/services/scales.mts:101-103`):
  ``[visc-line] empty or invalid domain for ${scaleType} scale; using default domain.``
- UMD build: `dist/index.umd.js`, global `ViscLine`, `d3` external via
  `globals: { d3: "d3" }` (`tsdown.config.mjs:24-27`) — d3 CDN script tag
  MUST precede the bundle in the harness (already true).
- `playwright-cli` is installed globally (pnpm) at
  `/home/metalbolicx/.local/share/pnpm/bin/playwright-cli` and is in `$PATH`.
  `.gitignore:163` already ignores `.playwright-cli/` (session snapshots).
- Reference implementation to mirror (read it before writing the README):
  `/home/metalbolicx/Documents/tipviz/tests/e2e/README.md` — the session
  pattern this plan copies: named sessions (`playwright-cli -s=<name> open
  <url>`), `eval` scripts returning plain objects, documented expected
  outputs, a "Live-Verified Outputs" table recording actual values.
- Plan 022 features (reference lines/annotations) live ONLY on branch
  `feature/022-reference-lines-annotations` — not on `main`. Do NOT cover
  them in the harness (see Maintenance notes).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Prereq check | `command -v playwright-cli` | prints a path |
| Browser check | `playwright-cli list --json` | exit 0 (JSON, possibly empty list) |
| Build | `pnpm build` | `dist/index.umd.js` produced |
| Unit suite | `pnpm test` | all pass (unaffected by this plan) |
| Full check | `pnpm check` | exit 0 |
| Serve root | `python3 -m http.server 8742` | serves repo root on :8742 |

## Suggested executor toolkit

- The repo ships a `playwright-cli` skill at `.claude/skills/playwright-cli/SKILL.md` —
  read it first; it documents every command used below (`open`, `-s=` sessions,
  `eval`, `mousemove`, `mousewheel`, `console`, `snapshot`, `close-all`).
- Read `/home/metalbolicx/Documents/tipviz/tests/e2e/README.md` for the exact
  README structure to mirror (prerequisites → serve → per-scenario blocks with
  expected outputs → cleanup → live-verified table).

## Scope

**In scope** (the only files you should modify):
- `tests/e2e/harness.html` (edit: bundle path, `__charts` registry)
- `tests/e2e/README.md` (rewrite for the session flow)
- `tests/e2e/serve-and-run.mjs` (delete)
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch, even though they look related):
- Any file under `src/` — zero source changes. If the API drifted, STOP.
- `package.json` — do NOT re-add `@playwright/test` or a `test:e2e` script.
  This layer is intentionally manual and dependency-free; wiring it into CI
  is a separate, deferred decision (see Maintenance notes).
- `tsdown.config.mjs`, `examples/`, `.gitignore` (already ignores
  `.playwright-cli/` — verify, don't duplicate).

## Git workflow

- Branch: `advisor/023-playwright-cli-e2e`
- Conventional commits (repo style, e.g. `07a27c8 test: add e2e harness page
  and Playwright smoke script`): one commit for the harness + deletion
  (`test: rewire e2e harness for playwright-cli sessions`), one for the README
  (`docs: document playwright-cli e2e session scenarios`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Prereqs and drift verification

1. `command -v playwright-cli` → prints a path. If missing, STOP.
2. `playwright-cli list --json` → exit 0. If it reports no browser available,
   run `playwright-cli open --browser=chromium about:blank` once and close it
   (`playwright-cli close-all`); if the browser cannot launch, STOP (do not
   install anything silently — report).
3. Run the drift check from the header; confirm `tests/e2e/harness.html` still
   matches the excerpt in "Current state".
4. Confirm the public API is unchanged:
   `grep -n "withLegend\|withZoomPan\|update\|dispose" src/chart/chartTypes.mts`
   → shows the methods listed in "Current state". On mismatch, STOP.

**Verify**: all four checks pass before touching any file.

### Step 2: Rewire the harness

In `tests/e2e/harness.html` make exactly two changes:

1. Line 49: `./index.umd.js` → `../../dist/index.umd.js` (page is now served
   from the project root, not copied into `dist/`).
2. Retain instances for the update/dispose scenario: after each
   `ViscLine.createChart(...)` chain, assign to a registry, e.g.
   ```js
   window.__charts = {};
   window.__charts.full = ViscLine.createChart(...).withAxes()...withZoomPan();
   window.__charts.minimal = ViscLine.createChart(...);
   window.__charts.empty = ViscLine.createChart(...);
   ```
   Keep all existing mount options exactly as they are — the chart
   configurations are already correct against the live API.

Do not add new charts, styles, or scenario JS.

**Verify**: `pnpm build` → exit 0. Then `python3 -m http.server 8742 &` and
`playwright-cli -s=setup open http://localhost:8742/tests/e2e/harness.html`
→ page loads; `playwright-cli -s=setup eval '() => ({ err: window.__chartError, charts: Object.keys(window.__charts || {}) })'`
→ `{ err: null, charts: ["full", "minimal", "empty"] }` and three SVGs are
visible in the snapshot. Then `playwright-cli -s=setup close`.

If `err` is non-null or charts are missing: the d3-CDN/UMD wiring broke —
debug the harness (never `src/`), or STOP if the cause is outside the harness
(e.g. no network access to the CDN).

### Step 3: Delete the dead runner

`rm tests/e2e/serve-and-run.mjs`. It imports `@playwright/test`, which has not
been a dependency since merge `107bc0d`; nothing references it
(`grep -rn "serve-and-run" package.json tests/` → only the old README, which
Step 5 rewrites).

**Verify**: `grep -rn "serve-and-run\|@playwright/test" package.json tests/`
→ matches only in `tests/e2e/README.md` (rewritten in Step 5).

### Step 4: Run the six scenarios live and record actual outputs

Serve the root (`python3 -m http.server 8742` in a dedicated terminal) and
execute each scenario in order with named sessions. Record every actual
output — Step 5 embeds them in the README's live-verified table. All `eval`
scripts return plain objects; judge against the expected values.

**Scenario A — full render** (session `full`):
```bash
playwright-cli -s=full open http://localhost:8742/tests/e2e/harness.html
playwright-cli -s=full eval '() => {
  const q = (s) => document.querySelectorAll(s);
  const line = document.querySelector("#chart-full path.chart-line");
  const stroke = line ? getComputedStyle(line).getPropertyValue("stroke") : null;
  return {
    svg: q("#chart-full svg").length,
    lineD: line ? line.getAttribute("d").slice(0, 12) : null,
    lineDLength: line ? line.getAttribute("d").length : 0,
    xTicks: q("#chart-full g.x-axis text").length,
    yTicks: q("#chart-full g.y-axis text").length,
    gridX: q("#chart-full line.grid-x").length,
    gridY: q("#chart-full line.grid-y").length,
    points: q("#chart-full circle.point").length,
    title: (document.querySelector("#chart-full .chart-title") || {}).textContent,
    legendEntries: q("#chart-full .legend-entry").length,
    strokeResolved: stroke,
    err: window.__chartError
  };
}'
```
Expected: `svg:1`, `lineD` starts with `"M"`, `lineDLength` > 20,
`xTicks`/`yTicks`/`gridX`/`gridY`/`points` all > 0, `title:"Monthly Revenue"`,
`legendEntries:1`, `strokeResolved` is a resolved color like `rgb(...)` and
NOT the literal `var(--vl-line-color)`, `err:null`.

**Scenario B — minimal render, negative checks** (same session is fine,
scenario order matters — B and C before F):
```bash
playwright-cli -s=full eval '() => {
  const q = (s) => document.querySelectorAll(s);
  return {
    line: q("#chart-minimal path.chart-line").length,
    xAxis: q("#chart-minimal .x-axis").length,
    yAxis: q("#chart-minimal .y-axis").length,
    title: q("#chart-minimal .chart-title").length,
    legend: q("#chart-minimal .legend-entry").length
  };
}'
```
Expected: `line:1`, all others `0`.

**Scenario C — empty-data guard**:
```bash
playwright-cli -s=full eval '() => ({
  svg: document.querySelectorAll("#chart-empty svg").length,
  hasNaN: document.getElementById("chart-empty").innerHTML.includes("NaN")
})'
playwright-cli -s=full console warning
```
Expected: `svg:1`, `hasNaN:false`; console warning output contains
`[visc-line] empty or invalid domain` (guard at `src/services/scales.mts:101`).

**Scenario D — tooltip hover**:
```bash
playwright-cli -s=full eval '() => JSON.stringify(document.getElementById("chart-full").getBoundingClientRect())'
# then move across the chart's vertical center in 3 steps, e.g. if left=56, top=56, width=500, height=320:
playwright-cli -s=full mousemove 150 216
playwright-cli -s=full mousemove 300 216
playwright-cli -s=full eval '() => ({
  cursorLine: !!document.querySelector("#chart-full .cursor-line"),
  tooltipEl: !!document.querySelector("tip-viz-tooltip"),
  err: window.__chartError
})'
```
Expected: `cursorLine:true`, `tooltipEl:true`, `err:null` (mousemove wakes
the cursor layer; the custom element is registered by the bundled tipviz).

**Scenario E — zoom re-render (wheel)**:
```bash
playwright-cli -s=full eval '() => ({
  d: document.querySelector("#chart-full path.chart-line").getAttribute("d"),
  cx: [...document.querySelectorAll("#chart-full circle.point")].map(p => p.getAttribute("cx"))
})'   # record as BEFORE
playwright-cli -s=full mousemove 300 216
playwright-cli -s=full mousewheel 0 -120
# same eval again → record as AFTER
```
Expected: AFTER `d` differs from BEFORE (zoom dispatch re-rendered the line)
AND point `cx` values changed (plan 016 made points follow zoom — this is its
real-browser proof); `window.__chartError` still null;
`playwright-cli -s=full console` shows no errors. Do NOT assert a `transform`
attribute on `svg` — d3.zoom stores state in the `__zoom` property, not an
attribute; the `d`/`cx` diff is the reliable signal.

**Scenario F — update() and dispose()** (LAST — it mutates state):
```bash
playwright-cli -s=full eval '() => {
  const before = document.querySelector("#chart-full path.chart-line").getAttribute("d");
  window.__charts.full.update([
    { date: new Date("2024-01-01"), revenue: 10 },
    { date: new Date("2024-02-01"), revenue: 400 },
    { date: new Date("2024-03-01"), revenue: 10 }
  ]);
  const after = document.querySelector("#chart-full path.chart-line").getAttribute("d");
  window.__charts.minimal.dispose();
  return { dChanged: before !== after, minimalSvgAfterDispose: document.querySelectorAll("#chart-minimal svg").length };
}'
```
Expected: `dChanged:true`, `minimalSvgAfterDispose:0`.

**Cleanup**: `playwright-cli -s=full close`, stop the server
(`kill $(lsof -ti:8742)`), `playwright-cli close-all`.

**Verify**: every scenario's actual output matches its expected values. If a
selector finds nothing, re-read the component file listed in "Current state"
for the real class literal and adapt the README command — never `src/`.

### Step 5: Rewrite `tests/e2e/README.md`

Replace the current README entirely. Mirror the structure of
`/home/metalbolicx/Documents/tipviz/tests/e2e/README.md`:

1. Intro: what this layer verifies that jsdom cannot (CSS-var resolution,
   real tick layout, zoom physics, custom-element registration).
2. Prerequisites: global `playwright-cli` in `$PATH`.
3. Build + serve: `pnpm build`, then `python3 -m http.server 8742` from the
   repo root (dedicated terminal).
4. The six scenario blocks (A–F) with the exact commands from Step 4 and
   their expected outputs.
5. Cleanup commands.
6. A "Live-Verified Outputs" table with the ACTUAL values recorded in Step 4
   (session name, key result, PASS verdict, commit SHA, browser used) —
   same format as tipviz's table.
7. A "Not wired into CI / pnpm test" note: this is a manual verification
   layer; rationale: zero-dependency driver, and the automated-driver decision
   was reverted when `@playwright/test` was dropped at merge `107bc0d`.
8. "Add a new chart case" section: add a div + mount in the harness inline
   script, register it in `window.__charts`, add a scenario block.

**Verify**: `pnpm check` → exit 0 (nothing under `src/` changed, unit suite
untouched). `git status` → only the in-scope files.

## Test plan

This plan IS the test layer. Coverage: full-feature render, minimal render,
empty-data guard, time + linear scales, CSS-var resolution, tooltip hover,
zoom re-render (line + points), `update()`, `dispose()` — all in a real
browser against the built UMD artifact via `playwright-cli` sessions.

## Done criteria

- [ ] All six scenarios (A–F) pass live via `playwright-cli`; actual outputs
      recorded in the README's Live-Verified Outputs table
- [ ] `tests/e2e/serve-and-run.mjs` deleted; no reference to `@playwright/test`
      or `serve-and-run` remains in `package.json`/`tests/`
- [ ] `pnpm check` exits 0; `pnpm test` unit suite unaffected
- [ ] No file under `src/` modified; `git status` shows only in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

- `playwright-cli` is not in `$PATH` or its browser cannot launch — report;
  do NOT install browsers or fall back to `@playwright-test`/`playwright-core`
  silently (the operator explicitly chose the `playwright-cli` driver; a
  driver switch is their decision).
- The drift check shows changes under `src/chart/chartTypes.mts` or
  `src/services/scales.mts` that invalidate the API/selector/message facts in
  "Current state" — re-verify against live code; if the public API itself
  changed, STOP.
- The harness page renders nothing after Step 2 (blank page / `err` non-null)
  and the cause is not the bundle path (e.g. CDN unreachable) — report what
  the browser console shows.
- Any scenario assertion can only be fixed by editing `src/` — STOP; the
  harness adapts to the library, never the reverse.

## Maintenance notes

- **Plan 022 (reference lines/annotations)**: when branch
  `feature/022-reference-lines-annotations` merges to `main`, add a fourth
  harness chart exercising `withReferenceLines`/`withAnnotations` (check
  `src/chart/chartTypes.mts` post-merge for the real method names) plus a
  scenario G asserting the rendered line/annotation groups and their behavior
  under zoom (022's features are data-anchored — they must follow zoom like
  points do).
- **CI decision (deferred)**: running these sessions in CI would require a
  scripted driver; if the suite grows past ~10 scenarios, reconsider an
  automated runner as a new plan. Record the decision here when made.
- **Port**: 8742 is chosen to not collide with tipviz's 8741 when both repos
  are served simultaneously.
- **`.playwright-cli/` snapshots** are gitignored (`.gitignore:163`); if a
  scenario's snapshot output ever needs archiving, store it under
  `tests/e2e/snapshots/` deliberately.
- Reviewer scrutiny: confirm the README's live-verified table contains REAL
  recorded values (not the expected template), and that the session commands
  are copy-paste runnable as written.
