# visc-line Agent Guide

`visc-line` is a collections of helper functions that renders line chart components powered by D3.js. It help the user customize its line chart with title (or not), x and y axis (or not), etc.

## Dev Commands

```sh
pnpm install
pnpm dev          # Vite dev server
pnpm build        # tsdown → dist/ (cjs + es + umd, minified, with d.ts)
pnpm lint         # eslint .
pnpm lint:fix
pnpm type-check   # tsc --noEmit
pnpm test         # vitest (jsdom, v8 coverage, src/**/*.test.mts)
pnpm docs         # docsify serve docs/
pnpm check        # type-check → test → build → lint
```

## Command Order

```txt
type-check → test → build
```

## Architecture

- **Entry**: `src/index.mts` + `src/internal.mts` (package export `./internal`)
- **Source dirs**: `chart/` (entry point, render flow, feature registry, per-feature defs, state/lifecycle, chart types), `components/`, `services/`, `interactivity/`, `types/`, `utils/`, `themes/`, `accessibility/`
- **Examples**: `examples/main.mts` (runnable demo)
- **Peer deps**: `d3@^7.9.0`
- **Bundled dep**: `tipviz@^3.0.1` (forced into bundle by tsdown); `d3` remains external (UMD global)
- **Platform**: browser-only (UMD, tsdown `platform: "browser"`)

## Render Flow (important)

Charts render via a specific sequence — skip or reorder components and dimensions break:

0. `applyThemeCssVars(container, resolvedTheme)` — write CSS vars before SVG exists
1. `renderSVG`
2. `renderBoundsGroup`
3. `renderContentGroup` (clip-path content layer, inside the re-render loop)
4. `renderLine` — via shared `redrawLine` helper (`src/chart/redrawLine.mts`); called by both the render loop and `zoomDispatch`
5. **Registry-driven feature loop**: iterate `FEATURE_REGISTRY` in order, calling `feature.render` for each enabled feature. Registry order (and thus render order): axes → grid → referenceLines → title → legend → tooltip → zoomPan → custom → annotations → points.
6. `clearOptionalNodes` — cleanup DOM for disabled features (registry-driven via `feature.clearSelectors` and `feature.clearEvents`)

**Zoom path**: when zoom/pan triggers, `zoomPanDef.render` sets up the `onZoom` callback in `src/chart/zoomDispatch.mts` which:
1. Iterates `FEATURE_REGISTRY` calling `feature.onZoomRedraw` for features that define it (axes, grid, points; title/legend/tooltip/custom intentionally excluded)
2. Re-renders the line directly

**Registry cleanup**: `clearOptionalNodes` iterates `FEATURE_REGISTRY` for disabled features and:
- Removes DOM nodes via `feature.clearSelectors` (axes, grid, title, legend, tooltip)
- Unbinds event listeners via `feature.clearEvents` (tooltip: mousemove/mouseleave; zoomPan: .zoom)

**Adding a new feature**: add one entry to `FEATURE_REGISTRY` + write a per-feature def file (`src/chart/featureDefs/<name>.mts`) + write a characterization test — no lockstep edits across 6 files.

## Idempotent Rendering

All renderers must be idempotent. They select existing DOM nodes by class/attribute before appending — never duplicate elements on re-render.

## Style & Conventions

- CSS vars (`var(--vl-*)`) are used for all visual attributes — no hardcoded inline style values in renderers
- `getComputedStyle(el).getPropertyValue("--vl-*")` is used when D3 APIs require a number (tickSize, tickPadding, point radius, legend symbol/item-spacing)
- Functional rendering patterns preferred
- Parse dates; filter invalid numeric values before rendering
- `camelCase` functions, `PascalCase` types/components, `UPPER_SNAKE_CASE` constants
- Booleans prefixed `is`/`has`/`can`/`should`
- See [.opencode/opencode.json] for full typescript/javascript style guide

## Curve Utilities

- `CURVE_PRESETS` — `Readonly<Record<CurvePreset, CurveFactory>>` mapping all 18 preset names to their D3 factory
- `resolveCurve(input: CurveFactory | CurvePreset): CurveFactory` — resolves a preset string or passes through a factory; throws on unknown string

## Testing

- Vitest with jsdom environment
- Test files: `src/**/*.test.mts`
- Coverage: v8 provider, text/json/html reporters
