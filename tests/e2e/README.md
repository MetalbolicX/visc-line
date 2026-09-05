# e2e Browser Harness

Manual browser verification for three invariants that cannot be tested in jsdom:

- Real CSS custom-property resolution (`getComputedStyle` on `var(--vl-*)`)
- Real tick layout and SVG attribute physics
- `<tip-viz-tooltip>` custom element registration and zoom re-render

## Prerequisites (Alpine Linux / musl)

This harness uses the **system Chromium** (Alpine's `chromium` package), **not**
Playwright's own Chromium build (which is glibc-only and cannot reach the CDN on
this host). The system browser is launched with a CDP debugging port and
`playwright-cli` attaches via CDP.

```bash
# Verify prerequisites
command -v playwright-cli   # → prints a path
/usr/bin/chromium --version # → Chromium 152.0.7977.64 Alpine Linux

# Launch system Chromium with CDP port 9222 (Alpine-friendly flags)
setsid env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp \
  /usr/bin/chromium --headless=new --no-sandbox --disable-gpu \
  --disable-dev-shm-usage --remote-debugging-port=9222 \
  --remote-debugging-address=127.0.0.1 --incognito about:blank \
  </dev/null > /tmp/chromium.log 2>&1 &

sleep 3

# Verify CDP endpoint is live
curl -s http://127.0.0.1:9222/json/version | head -1
# → {"Browser":"Chrome/152.0.7977.64",...}

# Attach playwright-cli to the running browser
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp \
  playwright-cli -s=cdp attach --cdp=http://127.0.0.1:9222
# → "### Session `cdp` created, attached to `http://127.0.0.1:9222`."
```

**Env vars required on every `playwright-cli` call** (Alpine/wayland environment):

```bash
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp <cmd>
```

## Build + Serve

```bash
# Build the UMD bundle (required before serving)
pnpm build

# Serve the project root (dedicated terminal)
python3 -m http.server 8742
# Keep this server running while running verifications below.
```

## Verification Commands

After starting the server, all commands use the single attached CDP session.
The `-s=cdp` session name is reused throughout; no named-session isolation is
needed for this sequential suite.

### Scenario A — Full render (all features)

```bash
playwright-cli -s=cdp goto http://127.0.0.1:8742/tests/e2e/harness.html
```

Then:

```bash
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp eval '() => {
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

**Expected output**:

```json
{
  "svg": 1,
  "lineD": "M-334693.333",
  "lineDLength": 90,
  "xTicks": 5,
  "yTicks": 5,
  "gridX": 9,
  "gridY": 10,
  "points": 6,
  "title": "Monthly Revenue",
  "legendEntries": 1,
  "strokeResolved": "rgb(31, 119, 180)",
  "err": null
}
```

All values pass: SVG present, line `d` is a real SVG path string > 20 chars,
axes/ticks/grid/points all rendered, title and legend correct,
`strokeResolved` is a **resolved color** (not the literal `var(--vl-line-color)`),
`err` is `null`.

---

### Scenario B — Minimal render (line only, negative checks)

```bash
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp eval '() => {
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

**Expected output**:

```json
{ "line": 1, "xAxis": 0, "yAxis": 0, "title": 0, "legend": 0 }
```

Line only — no axes, no title, no legend. Negative assertions confirmed.

---

### Scenario C — Empty-data guard (plan 004)

```bash
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp eval '() => ({
  svg: document.querySelectorAll("#chart-empty svg").length,
  hasNaN: document.getElementById("chart-empty").innerHTML.includes("NaN")
})'
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp console warning
```

**Expected output**:

```json
{ "svg": 1, "hasNaN": false }
```

Console warnings include:

```
[WARNING] [visc-line] empty or invalid domain for time scale; using default domain.
```

The guard fires (proving plan 004's guard is live in the UMD bundle) but
produces no `NaN` in the DOM.

---

### Scenario D — Tooltip hover

```bash
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp eval '() => JSON.stringify(document.getElementById("chart-full").getBoundingClientRect())'
# → {"x":57,"y":57,"width":500,"height":320,"top":57,"right":557,"bottom":377,"left":57}

# Center: (57+250, 57+160) = (307, 217)
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp mousemove 307 217
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp eval '() => ({
  cursorLine: !!document.querySelector("#chart-full .cursor-line"),
  tooltipEl: !!document.querySelector("tip-viz-tooltip"),
  err: window.__chartError
})'
```

**Expected output**:

```json
{ "cursorLine": true, "tooltipEl": true, "err": null }
```

Mousemove wakes the cursor layer (`.cursor-line` appears) and the
`<tip-viz-tooltip>` custom element is registered and rendered.

---

### Scenario E — Zoom re-render (mousewheel)

```bash
# Record BEFORE state
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp eval '() => ({
  d: document.querySelector("#chart-full path.chart-line").getAttribute("d"),
  cx: [...document.querySelectorAll("#chart-full circle.point")].map(p => p.getAttribute("cx"))
})'

# Apply wheel at chart center
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp mousemove 307 217
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp mousewheel 0 -120

# Record AFTER state
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp eval '() => ({
  d: document.querySelector("#chart-full path.chart-line").getAttribute("d"),
  cx: [...document.querySelectorAll("#chart-full circle.point")].map(p => p.getAttribute("cx")),
  err: window.__chartError
})'
```

**Expected output**: BOTH `d` AND point `cx` arrays must differ from BEFORE.

```
BEFORE d:  M-334693.333,200L-324084.444,125L-314160,175L-303551.111,50L-293284.444,87.5L-282675.556,0
AFTER  d:  M-395315.62,207.24L-382786.6,118.665L-371065.904,177.715L-358536.884,30.091L-346412.026,74.378L-333883.006,-28.959
BEFORE cx: ["-334693.3333333334","-324084.44444444444","-314160","-303551.1111111111","-293284.44444444444","-282675.55555555556"]
AFTER  cx: ["-395315.6203974395","-382786.6004186886","-371065.9043095346","-358536.8843307837","-346412.02628683124","-333883.0063080804"]
```

`dChanged: true`, `cxChanged: true`, `err: null`. The zoom dispatch re-renders
both the line path and the point circles.

---

### Scenario F — update() and dispose() (LAST — mutates state)

```bash
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp eval '() => {
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

**Expected output**:

```json
{ "dChanged": true, "minimalSvgAfterDispose": 1 }
```

`dChanged: true` confirms `update()` re-renders the line with new data.
`minimalSvgAfterDispose` reflects the library's disposal behavior (the SVG node
remains in the DOM; only chart-instance internal state is cleaned up).

> **Important**: `ChartInstance.dispose()` deliberately does **not** remove the SVG
> from the DOM. It releases lifecycle resources (zoom behavior, resize observers,
> tooltip state) and cleans up optional feature enhancements, but the SVG element
> stays in the container. If the application needs DOM removal, it must clear the
> container element itself.

---

### Scenario G — endLabels with collision policies

```bash
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp eval '() => {
  var endlabelsCount = document.getElementById("chart-endlabels").querySelectorAll("text.end-label").length;
  var endlabelsLegendCount = document.getElementById("chart-endlabels-legend").querySelectorAll("text.end-label").length;
  var texts = document.querySelectorAll("#chart-endlabels text.end-label");
  var noOverlap = true;
  if (texts.length >= 2) {
    var sorted = Array.from(texts).sort(function(a, b) {
      return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
    });
    for (var i = 1; i < sorted.length; i++) {
      if (sorted[i].getBoundingClientRect().top < sorted[i-1].getBoundingClientRect().bottom) {
        noOverlap = false;
        break;
      }
    }
  }
  return { endlabels_count: endlabelsCount, endlabels_bboxes_no_overlap: noOverlap, endlabelsLegend_count: endlabelsLegendCount };
}'
```

**Expected output**:

```json
{ "endlabels_count": 2, "endlabels_bboxes_no_overlap": true, "endlabelsLegend_count": 0 }
```

- `endlabels_count: 2`: two series, each gets a direct label at end-of-line (collision="nudge" default)
- `endlabels_bboxes_no_overlap: true`: nudge policy resolved the ~9px gap correctly
- `endlabelsLegend_count: 0`: collision="legend" policy detected overlap and rendered no labels

---

> **Alpine/musl limitation**: Playwright's downloaded Chromium is glibc-only and does
> not run on this Alpine/musl host; its CDN download also times out on this
> network. The system Chromium route (documented in Prerequisites) is the
> verified, supported path for this environment.

## Cleanup

After all verifications:

```bash
# Close the playwright-cli session
env DBUS_SESSION_BUS_ADDRESS=disabled: XDG_RUNTIME_DIR=/tmp playwright-cli -s=cdp close

# Kill the HTTP server
pkill -f "http.server 8742"

# Kill the system Chromium
pkill -9 -f "remote-debugging-port=9222"
```

## Live-Verified Outputs

All six scenarios executed against the live UMD bundle via a single
`playwright-cli` CDP-attach session (system Chromium 152.0.7977.64 Alpine,
playwright-cli 1.63.0-alpha, CDP port 9222, no browser install needed).

| Scenario | Key result | Verdict |
|----------|------------|---------|
| A — Full render | `svg:1`, `lineDLength:90`, `xTicks:5`, `yTicks:5`, `gridX:9`, `gridY:10`, `points:6`, `title:"Monthly Revenue"`, `legendEntries:1`, `strokeResolved:"rgb(31, 119, 180)"` (not `var(--vl-line-color)`), `err:null` | PASS |
| B — Minimal render | `line:1`, `xAxis:0`, `yAxis:0`, `title:0`, `legend:0` | PASS |
| C — Empty-data guard | `svg:1`, `hasNaN:false`, console warning contains `[visc-line] empty or invalid domain` | PASS |
| D — Tooltip hover | `cursorLine:true`, `tooltipEl:true` (custom element registered), `err:null` | PASS |
| E — Zoom re-render | `dChanged:true` (line path transformed), `cxChanged:true` (all 6 point cx values transformed), `err:null` | PASS |
| F — update() + dispose() | `dChanged:true` (update mutated the line), `minimalSvgAfterDispose:1` (SVG node persists after dispose) | PASS |
| G — endLabels collision | `endlabels_count:2`, `endlabels_bboxes_no_overlap:true`, `endlabelsLegend_count:0` | PASS |

**Recording environment**: Chromium 152.0.7977.64 Alpine Linux, playwright-cli 1.63.0-alpha via CDP attach (port 9222), commit `42b5d56`.

## Not Wired Into CI / pnpm test

These are manual browser-only verifications. They are **not** run by `pnpm test`
and are not part of the CI pipeline. They exist because:

- jsdom does not implement `getComputedStyle` for CSS custom properties
- jsdom does not support real SVG attribute physics for zoom events
- `<tip-viz-tooltip>` is a custom element registered by the bundled `tipviz`
- D3 zoom state lives in `__zoom` property (not an SVG attribute) — only
  observable via real browser DOM mutations

The automated-driver decision was explicitly reverted when `@playwright/test` was
dropped at merge `107bc0d`; wiring an automated CDP driver is a separate,
deferred decision (see Maintenance notes).

Run `pnpm test --run` for the automated unit test suite (~429 passing).

## Add a New Chart Case

1. Add a `<div id="chart-mycase">` container in `harness.html` inside the
   `<body>`, alongside the existing three containers.
2. Add the mount script block in the inline `<script>` section, assigning the
   chart instance to `window.__charts.mycase = ViscLine.createChart(...)`.
3. Reload the harness page.
4. Add a scenario block to this README (copy the eval pattern from an existing
   scenario, swap the selector `#chart-mycase`).

## Maintenance Notes

- **Plan 022 (reference lines/annotations)**: when branch
  `feature/022-reference-lines-annotations` merges to `main`, add a fourth
  harness chart exercising `withReferenceLines`/`withAnnotations` plus a
  scenario G asserting the rendered line/annotation groups and their behavior
  under zoom.
- **CI driver decision (deferred)**: if the suite grows past ~10 scenarios,
  reconsider an automated CDP runner as a new plan.
- **Port 8742** is chosen to not collide with tipviz's port 8741 when both
  repos are served simultaneously.
- **`.playwright-cli/` snapshots** are gitignored (`.gitignore:163`); if a
  scenario's snapshot output needs archiving, store it under
  `tests/e2e/snapshots/` deliberately.
