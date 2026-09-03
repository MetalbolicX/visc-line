# E2E Smoke Tests

Browser-level smoke tests powered by Playwright. These run against the **built
UMD bundle** (`dist/index.umd.js`) in a real Chromium instance — the only layer
that can verify CSS custom-property resolution, custom-element registration, and
zoom event physics that jsdom cannot simulate.

## Run

```sh
pnpm test:e2e
```

This script **first builds** the project (`pnpm build`), then copies
`tests/e2e/harness.html` into `dist/`, starts a `node:http` static server, and
runs the Playwright headless assertions. All assertions must pass (exit 0) before
the suite is considered green.

## What's covered

| Scenario | What is asserted |
|---|---|
| `#chart-full` | SVG exists, `path[d^="M"]` has real data, `.x-axis` / `.y-axis` have tick labels, grid lines exist, legend present, points rendered, chart title present |
| `#chart-minimal` | SVG + path exist, **no** axes/legend/title elements |
| `#chart-empty` | SVG exists, **no NaN** anywhere in the element (plan-004 guard proof) |
| CSS var resolution | `getComputedStyle(stroke)` returns a resolved colour, not the literal `var(--vl-line-color)` string |
| Tooltip hover | `page.mouse.move()` across the chart — zero console errors |
| Zoom wheel | `page.mouse.wheel()` over the chart — zero errors, chart re-renders |
| Runtime errors | `window.__chartError` stays null; zero `pageerror` events |

## Add a new chart case

1. Add a new `div` container in `tests/e2e/harness.html`:

   ```html
   <div id="chart-new" style="width:500px;height:320px"></div>
   ```

2. Mount the chart in the inline `<script>` block, following the existing patterns.

3. In `serve-and-run.mjs`, add `page.locator("#chart-new")` assertions in the
   same style as `#chart-full` and `#chart-minimal` blocks.

4. Run `pnpm test:e2e` to verify.

## Extending the harness

The harness intentionally uses the **builder API** (`ViscLine.createChart(...).with*()`)
for all chart mounts — this is the API external consumers use. The inline script
has no external dependencies and is served as a plain static file.

## Chromium download

On first run, Playwright downloads its own Chromium binary (cached under
`~/.cache/ms-playwright/`). To force a re-download:

```sh
pnpm exec playwright install chromium
```

## Alternative driver (lighter)

If you have `playwright-cli` available and prefer a session-based flow instead of
the `node:http + @playwright/test` script, see the sibling project's e2e README
for the session approach:
`/home/metalbolicx/Documents/tipviz/tests/e2e/README.md`
