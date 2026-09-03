# Plan 010: Browser-level smoke tests with Playwright (real rendering, not jsdom)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- package.json vite.config.* examples/`
> If the dev/build setup changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (new test infrastructure; no source changes)
- **Depends on**: plans/001-verification-baseline.md, plans/004-empty-data-guard.md
- **Category**: tests
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

The entire suite runs in jsdom: no real layout, no real `getComputedStyle`
resolution of `var(--vl-*)`, no real custom-element registration for
`<tip-viz-tooltip>`, no real zoom event physics. The library's core
promises — CSS-var-driven styling and a UMD build that works with a global
`d3` — are exactly the things jsdom cannot verify. The sibling project
tipviz solved this with a `tests/e2e/harness.html` page served locally and
driven headlessly. This plan ports that pattern: a static harness page +
Playwright smoke script asserting real Chromium rendering of the built
UMD bundle. (The operator's environment currently has NO `playwright-cli`
binary — verified `command -v playwright` fails — so this plan uses the
`playwright` npm package with its own Chromium download, which also runs
in CI. If a `playwright-cli` daemon becomes available later, tipviz's
`tests/e2e/README.md` session flow is an alternative driver for the same
harness.)

## Current state

- Build outputs `dist/` (cjs + es + umd, UMD global `ViscLine`, d3 external via `globals: { d3: "d3" }` in `tsdown.config.mjs:24-26`).
- `examples/main.mts` — runnable Vite demo (uses the imperative renderer API, not the builder).
- No `tests/` directory exists today.
- tipviz reference (READ these, borrow structure): `/home/metalbolicx/Documents/tipviz/tests/e2e/harness.html` and `/home/metalbolicx/Documents/tipviz/tests/e2e/README.md` (static server + headless driver + eval-scenario pattern; their README:171-173 documents the playwright-core fallback rationale).
- vitest includes only `src/**/*.test.mts` — a Playwright script under `tests/` will NOT be picked up by `pnpm test` (intended: e2e is a separate `test:e2e` script).

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `pnpm install` | exit 0 |
| Browser   | `pnpm exec playwright install chromium` | downloads Chromium |
| Build     | `pnpm build` | dist/ produced |
| E2E       | `pnpm test:e2e` | smoke assertions pass |
| Unit      | `pnpm test` | unaffected, all pass |

## Scope

**In scope**:
- `package.json` (devDeps: `playwright`; scripts: `test:e2e`)
- `tests/e2e/harness.html` (create)
- `tests/e2e/smoke.mts` (create — the Playwright script)
- `tests/e2e/README.md` (create — how to run/extend, pointer to tipviz's README pattern)
- `.gitignore` (ignore Playwright artifacts if any land in-repo)

**Out of scope**:
- Any file under `src/` — zero source changes.
- Adding e2e to CI (decision deferred; see Maintenance notes).
- Visual regression screenshots — smoke assertions only (DOM/geometry/no-console-errors).

## Git workflow

- Branch: `advisor/010-playwright-smoke`
- Commit 1: `test: add Playwright browser smoke harness`. Commit 2 (if needed): `test: extend harness cases`.
- Do NOT push unless instructed.

## Steps

### Step 1: Add the dev dependency and scripts

`pnpm add -D playwright` then add scripts:

```json
"test:e2e": "pnpm build && node tests/e2e/serve-and-run.mjs"
```

(If you choose a different runner entry, keep the invariant: `test:e2e` builds first, then serves `dist/` + harness, then runs Playwright.)

**Verify**: `pnpm exec playwright --version` prints a version.

### Step 2: Create the harness page

`tests/e2e/harness.html` — a static page modeled on tipviz's harness:

1. Loads `d3` from a pinned CDN (`https://cdn.jsdelivr.net/npm/d3@7.9.0`, matching the peer range) BEFORE the UMD bundle.
2. Loads `./index.umd.js` (the built bundle — the page must be served from `dist/`; the runner script copies `tests/e2e/harness.html` into `dist/` after build).
3. Mounts three charts into `div#chart-full` (builder API, all features: axes, grid, points, title, legend, tooltip, zoom), `div#chart-minimal` (line only), `div#chart-empty` (`data: []`).
4. Uses numeric x/y data for one series and `xType: "time"` with `Date` data for another (the library's two headline modes).
5. Exposes `window.__chartError = (msg) => {...}` wired to `window.onerror` so the driver can assert zero runtime errors.

Match the actual option names by reading `src/chart/chartTypes.mts` and `examples/main.mts` before writing the page — do not guess the API.

**Verify**: after `pnpm build && cp tests/e2e/harness.html dist/`, opening the page via a local server in a real browser shows three charts (manual check acceptable at this step; the next step automates it).

### Step 3: Write the Playwright smoke script

`tests/e2e/smoke.mts` (run with plain `node` — compile-free via `node --experimental-strip-types` if the Node version supports `.mts`, otherwise write it as `smoke.mjs`):

1. Serve `dist/` on a free localhost port (a ~15-line `node:http` static server inside the script, or `vite preview` — pick the dependency-free `node:http` route; tipviz's README documents the same approach).
2. Launch chromium headless; collect `console` errors and `pageerror` events for ALL assertions.
3. Assert per chart:
   - `#chart-full svg` exists; contains a `path` whose `d` attribute starts with `M` and has length > 20 (a real line); `.x-axis` and `.y-axis` groups contain `text` elements (real ticks rendered — impossible in jsdom); `line.grid-x` count > 0; legend present.
   - `#chart-minimal svg path[d^="M"]` exists; NO `.x-axis`/title/legend nodes (negative check).
   - `#chart-empty`: svg exists, NO `NaN` anywhere in the serialized SVG (`outerHTML.includes("NaN")` is false — the plan-004 guard's real-browser proof), a console warning mentioning the empty domain was logged.
   - Global: `window.__chartError` never fired; zero `pageerror`s.
   - CSS vars actually applied: computed `stroke` of the line `path` is a resolved color, not the literal string `var(--vl-line-color)` (real `getComputedStyle` proof — the core jsdom blind spot).
4. Mouse interaction smoke: `page.mouse.move()` across `#chart-full` → no errors (tooltip custom element path, post plan-003); `mouse.wheel()` once over it → no errors (zoom path) and the line `d` attribute changes or transform updates (zoom actually re-rendered).

**Verify**: `pnpm test:e2e` → exit 0 with all assertions passing.

### Step 4: Document and wire into check (decision)

Write `tests/e2e/README.md` (how to run, what's covered, how to add cases, pointer to tipviz's e2e README for the playwright-cli session alternative). Do NOT add `test:e2e` to `pnpm check` — the Chromium download makes CI/local `check` heavier; leave it standalone (Maintenance notes record the CI decision).

**Verify**: `pnpm check` → still exit 0 (unchanged); `pnpm test` → unit tests unaffected.

## Test plan

This plan IS the test. Coverage: full-feature render, minimal render, empty-data guard, time + numeric series, CSS-var resolution, tooltip hover, zoom interaction, zero console errors — all in real Chromium against the built UMD artifact.

## Done criteria

- [ ] `pnpm test:e2e` exits 0 end-to-end (build → serve → headless assertions)
- [ ] `pnpm test` and `pnpm check` still exit 0
- [ ] `tests/e2e/README.md` exists with run/extend instructions
- [ ] No file under `src/` modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The Chromium download fails in this environment (offline/proxy) — report; do not switch drivers silently (a `channel: "chrome"` system-browser fallback is acceptable ONLY if Chrome is already installed; note the choice in the README).
- The harness page renders nothing in a manual browser check — STOP before automating; the UMD/d3-global wiring is wrong and must be debugged first (report what the console shows).
- Assertion selectors cannot be made stable because actual DOM class names differ from the components' — re-read `src/components/*.mts` for real class names and adapt the harness, not the library.

## Maintenance notes

- CI decision: adding `test:e2e` to CI costs a Chromium cache step (~1 min cold); recommended once the suite grows past ~10 cases. Record the decision in this file when made.
- New user-facing features (plans 012/013) should add a harness chart + assertions here — this is the layer where "it renders in a real browser" lives.
- If `examples/main.mts` ever gets a demo page in-repo, the harness can reuse its markup patterns — keep both in sync.
