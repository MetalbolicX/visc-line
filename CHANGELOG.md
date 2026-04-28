# Changelog

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
