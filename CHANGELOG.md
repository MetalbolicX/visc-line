# Changelog

## [1.1.0] — 2026-09-05

### Added
- `gapPolicy` option (`"break"` | `"bridge"`) for honest missing-data rendering via `line.defined` (plan 025)
- `ariaLabel` and `xLabel` public options on `ChartOptions` — sets SVG `aria-label` and renders an x-axis label text element (plan 028)
- `withFocus` series emphasis API — dims all series except the focused one (plan 029)
- End-of-line direct labels (`endLabels`) with collision policies: `"nudge"` | `"hide"` | `"legend"` degradation (plan 030)
- Reference lines and annotations features — data-anchored, follow zoom/pan, registered via `FeatureDefinition` (plans 022/027)
- Time-series data contract: series sorted by x on ingest, duplicate and backtracking behaviour documented (plan 026)
- E2e scenario G validating endLabels collision policies (plan 027)

### Fixed
- `ensureFiniteDomain` now accepts `Date` domains — previously rejected valid `[Date, Date]` domains and silently substituted `[now, now+24h]` (plan 024)

### Changed
- `pnpm test` now runs in `--run` mode (no watch hang); `check` script order: `type-check → test → build → lint`

---

## [1.0.0] — 2026-04-27

### Added
- Fluent builder API: `createChart().withAxes().withTooltip().withGrid()...`
- Public/internal API split (`visc-line` / `visc-line/internal`)
- Theme system with CSS custom properties (`--vl-*`)
- Per-series style overrides (`SeriesStyle`)
- Configurable zoom scale extent via `WithZoomPanOptions.scaleExtent`
- Dynamic axis label spacing computed from CSS variables
- Y-axis test expansion (positioning, time scales, formatting, CSS vars)
- Grid idempotency tests fixed (stored count comparison)
- `withZoomPan` builder integration test
- CHANGELOG.md, package.json keywords

### Fixed
- Clip path ID collision when multiple charts on the same page
- All series rendered with `--vl-palette-0` instead of cycling palette colors
- ESLint config broken by invalid `languageOptions` key placement
- `NaN` guard in CSS variable numeric fallbacks (kept `||` semantics)
- Axis label positioning now correctly reads `--vl-axis-font-size`, `--vl-axis-tick-size`, `--vl-axis-tick-padding`
- `SeriesStyle.pointFill`, `.pointRadius`, `.pointStroke` now applied to point markers
- Tooltip type duplication removed (`TooltipTemplateData` → `TooltipData`)
- README stale imports updated to `visc-line/internal` for advanced use
- Getting started docs Node version match `package.json` engines (>20)

### Changed
- `Theme.legend.position` deprecated (not consumed by renderer)
