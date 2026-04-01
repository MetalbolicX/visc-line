# Customization & Styling Implementation Guide for visc-line

Purpose: provide a concrete, actionable plan and code patterns to remove hardcoded styling and numeric parameters, introduce a centralized theme/token system, and make each chart component highly customizable.

---

**Goals**

- Eliminate scattered hardcoded values (colors, sizes, margins, fonts, stroke widths).
- Introduce a central `Theme` / design tokens module.
- Give each component a clear, typed style API and sane defaults.
- Support per-series overrides and runtime theme updates.
- Keep accessibility and responsive behavior configurable.

---

**High-level approach**

1. Audit the repo for hardcoded values and produce a short list of hotspots.
2. Add a centralized theme file (`src/theme.mts`) and theme types (`src/types/themeTypes.mts`).
3. Add a small `mergeTheme` utility to deep-merge user theme overrides with defaults.
4. Refactor components so they _read_ styling from props -> series overrides -> theme -> defaults.
5. Expose a lightweight API to set/update the theme at runtime and emit CSS variables for optional CSS-based theming.
6. Add tests and examples demonstrating customization (Storybook or `examples/`).

---

**Audit checklist (commands you can run locally)**

Run these from repository root to find hardcoded styling tokens and numbers:

```bash
# common keywords
grep -R --line-number -E "(stroke|fill|font-size|fontFamily|width|height|margin|padding|radius|tickSize|tickPadding|strokeWidth|stroke-width|dashArray|opacity|color|palette|background)" src || true

# numeric literals (simple scan for obvious numbers)
grep -R --line-number -E "[^a-zA-Z0-9_]([0-9]{1,3})(px|em|rem)?" src || true
```

Make a prioritized list from the results: UI-critical (axes, grid, line/point styles) first.

---

**Design tokens / Theme shape (recommended)**

Create `src/themes/theme.mts` and export `defaultTheme` and `Theme` type. Keep tokens simple and composable.

Example shape (TypeScript):

```ts
// src/themes/theme.mts (example)
export type Theme = {
  colors: {
    background: string;
    text: string;
    axis: string;
    grid: string;
    palette: string[]; // series colors
  };
  axis: {
    fontSize: number;
    tickSize: number;
    tickPadding: number;
    color?: string;
  };
  grid: { stroke: string; strokeWidth: number; dashArray?: string | null };
  line: { strokeWidth: number; opacity: number; curve: string };
  points: { radius: number; fill: string; strokeWidth: number };
  legend: {
    fontSize: number;
    position: "right" | "top" | "bottom" | "left";
    itemSpacing: number;
  };
  title: { fontSize: number; fontWeight: number; padding: number };
  spacing: { small: number; medium: number; large: number };
  breakpoints?: { sm: number; md: number; lg: number };
  accessibility?: { reducedMotion?: boolean; highContrast?: boolean };
};

export const defaultTheme: Theme = {
  colors: {
    background: "#ffffff",
    text: "#222222",
    axis: "#333333",
    grid: "#e6e6e6",
    palette: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"],
  },
  axis: { fontSize: 12, tickSize: 6, tickPadding: 8, color: "#333333" },
  grid: { stroke: "#e6e6e6", strokeWidth: 1, dashArray: null },
  line: { strokeWidth: 2, opacity: 1, curve: "linear" },
  points: { radius: 3, fill: "#ffffff", strokeWidth: 1 },
  legend: { fontSize: 12, position: "right", itemSpacing: 8 },
  title: { fontSize: 16, fontWeight: 600, padding: 8 },
  spacing: { small: 4, medium: 8, large: 16 },
  breakpoints: { sm: 480, md: 768, lg: 1024 },
  accessibility: { reducedMotion: true, highContrast: false },
};
```

Notes:

- Keep the theme minimal but expressive. Add fields only as you identify repeated magic values.
- Export both the `Theme` type and `defaultTheme` so components can import tokens and types.

---

**Merge utility (merge user theme into default)**

Add a small helper `src/services/mergeTheme.mts` (or `src/services/theme.mts`) with a deterministic deep merge. Avoid depending on heavy libs for this small piece; a tiny recursive merge function is fine.

Example:

```ts
// src/services/mergeTheme.mts
export const mergeTheme = <T>(base: T, override?: Partial<T>): T => {
  if (!override) return base;
  const out: any = Array.isArray(base)
    ? [...(base as any)]
    : { ...(base as any) };
  for (const k of Object.keys(override as any)) {
    const v = (override as any)[k];
    const b = (base as any)[k];
    if (v === undefined) continue;
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      b &&
      typeof b === "object"
    ) {
      out[k] = mergeTheme(b, v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
};
```

Write unit tests for `mergeTheme` focusing on nested overrides and arrays (palette replacement vs concat is a design decision—prefer replacement unless you implement special handling).

---

**Expose CSS variables (optional)**

To make theming easy for consumers via plain CSS, export a helper that writes CSS variables to the chart root element. Example mapping:

```ts
const applyThemeCssVars = (root: HTMLElement, theme: Theme) => {
  root.style.setProperty("--vl-background", theme.colors.background);
  root.style.setProperty("--vl-axis-color", theme.colors.axis);
  root.style.setProperty("--vl-grid-stroke", theme.grid.stroke);
  root.style.setProperty(
    "--vl-line-stroke-width",
    String(theme.line.strokeWidth),
  );
  // also export palette items
  theme.colors.palette.forEach((c, i) =>
    root.style.setProperty(`--vl-palette-${i}`, c),
  );
};
```

Components can then read inline styles using `getComputedStyle(root).getPropertyValue('--vl-axis-color')` or rely on CSS rules referencing those variables while still honoring programmatic props.

---

**Component API & patterns**

Refactor each component to accept a small `style` or `appearance` object and non-visual concerns separated into `options`.

Key rule: resolve styles with this precedence (highest → lowest):

1. Series-specific inline style (`series.style`)
2. Component `props.style` (passed at render time)
3. Chart-level `theme` tokens
4. `defaultTheme` values

Pattern for reading a value:

```ts
const stroke =
  series.style?.stroke ??
  props.style?.stroke ??
  theme.line.stroke ??
  defaultTheme.line.stroke;
```

Suggested per-component props (add to each respective file under `src/components/`):

- `src/components/line.mts` — props: `series`, `xScale`, `yScale`, `style?: { stroke?: string; strokeWidth?: number; curve?: string; opacity?: number }`, `renderLine?`
- `src/components/points.mts` — props: `series`, `style?: { radius?: number; fill?: string; stroke?: string }`, `pointRenderer?`
- `src/components/xAxis.mts` / `yAxis.mts` — props: `scale`, `ticks?`, `format?`, `style?: { tickSize?: number; tickPadding?: number; fontSize?: number; color?: string }`
- `src/components/grid.mts` — props: `xScale`, `yScale`, `style?: { stroke?: string; strokeWidth?: number; dashArray?: string }`
- `src/components/legend.mts` — props: `items`, `style?: { fontSize?: number; position?: 'right'|'top'|... }`, `formatter?`
- `src/components/title.mts` — props: `text`, `style?: { fontSize?: number; fontWeight?: number; color?: string }`
- `src/components/SVG.mts` — props: `width`, `height`, `margin`, `style?: { background?: string }` — compute `innerWidth/innerHeight` from `margin` tokens, not raw numbers.

Also add small `types` for `SeriesStyle`, `ComponentStyle` in `src/types/processedSeriesTypes.mts` or in a new `src/types/themeTypes.mts`.

---

**Service & layout changes**

- Move any magic spacing/label offsets into `src/services/layout.mts` and compute them using theme spacing and font sizes.
- Example: `labelOffset = theme.spacing.medium + Math.round(theme.axis.fontSize * 0.6)` instead of `14`.
- Ensure `scales.mts` exposes tick count and tick padding from options instead of hardcoded values.

---

**Interactivity**

- `interactivity/tooltip.mts`: expose `tooltipStyle` tokens (background, borderRadius, padding, fontSize) and allow consumer override.
- `interactivity/zoomPan.mts`: add options for box stroke, handle sizes, and animation durations (respect `reducedMotion`).

---

**Series-level overrides**

Allow each series in the data model to include a `style?: Partial<SeriesStyle>` object. Example usage:

```ts
const series = [{ id: 's1', data: [...], style: { stroke: '#d62728', strokeWidth: 3 } }];
```

Merge this into the render path with the precedence rules above.

---

**API surface: initialization and runtime updates**

Expose a small chart factory pattern that accepts `options` and `theme` and allows updates:

```ts
// createLineChart(container, data, { options?, theme? })
// returns { update({ data?, options?, theme? }), destroy() }
```

When `update` receives a `theme`, call `mergeTheme(defaultTheme, theme)`, apply CSS variables, then re-render.

---

**Testing & examples**

- Unit test `mergeTheme` with nested overrides.
- Unit test `layout` calculations with a few theme variants.
- Render snapshots for `line` and `points` components with default theme and with overrides.
- Add an `examples/` page or Storybook stories demonstrating:
  - global theme override
  - per-series style override
  - CSS-variable theming
  - accessibility theme (high contrast, reduced motion)

---

**Migration plan (minimal, incremental)**

1. Add `src/theme.mts`, `src/types/themeTypes.mts`, and `src/utils/mergeTheme.mts`.
2. Wire theme into chart entry point `src/index.mts` so that `createLineChart(..., { theme })` merges with defaults and applies CSS variables.
3. Refactor `src/components/line.mts` to consume theme tokens and accept `style` prop — this is a proof-of-concept.
4. Refactor `points.mts`, `xAxis.mts`, `yAxis.mts`, `grid.mts` and `legend.mts` one-by-one to the new pattern.
5. Replace one-by-one hardcoded numbers in `services/layout.mts` and `services/scales.mts` with token-driven computations.
6. Add tests and examples.

Tip: keep each change small and self-contained so code review can validate visual parity.

---

**PR checklist (when implementing)**

- [ ] Add `src/theme.mts` + `src/types/themeTypes.mts` + `src/utils/mergeTheme.mts`
- [ ] Unit tests for `mergeTheme` and layout computations
- [ ] Refactor `src/components/line.mts` with theme-backed styles (PoC)
- [ ] Refactor remaining components
- [ ] Add example(s) showing theme overrides and per-series styling
- [ ] Document public theme tokens in README or `docs/` and add migration notes

---

If you'd like, I can implement the first three tasks now: add `src/theme.mts`, `src/types/themeTypes.mts`, and `src/utils/mergeTheme.mts`, then refactor `src/components/line.mts` as a proof-of-concept. Tell me to proceed and I will make the changes and run a quick test render (where possible).

---

References

- Files to inspect first: [src/index.mts](src/index.mts), [src/components/line.mts](src/components/line.mts), [src/components/points.mts](src/components/points.mts), [src/components/xAxis.mts](src/components/xAxis.mts), [src/components/yAxis.mts](src/components/yAxis.mts), [src/components/grid.mts](src/components/grid.mts), [src/services/layout.mts](src/services/layout.mts), [src/services/scales.mts](src/services/scales.mts)
