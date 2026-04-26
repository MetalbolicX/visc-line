# Feature Specification: Theme System

**Feature Branch**: `001-theme-system`  
**Created**: 2026-04-25  
**Status**: Draft  
**Input**: Reverse-spec analysis: Theme management, CSS variables, and curve presets for the visc-line D3.js line chart library

## Scope

✅ **In-Scope**:
- Apply theme CSS custom properties to chart container
- Merge user theme overrides with default theme (deep merge)
- Resolve curve preset strings to D3 CurveFactory functions
- Provide default theme constant with all visual styling tokens
- Define Theme, ThemeOverride, and CurvePreset types

❌ **Out-of-Scope**:
- Dynamic theme switching at runtime (static configuration only)
- Theme persistence/storage
- CSS-in-JS or other styling approaches
- Curve rendering (handled by F006 Line Rendering)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apply Theme to Chart Container (Priority: P1)

A developer creates a chart and provides a partial theme override. The library applies all CSS variables to the container element so D3 components can reference them.

**Why this priority**: CSS variables are the foundation for all chart styling — every component depends on them being set before rendering.

**Independent Test**: Call `applyThemeCssVars(container, theme)` and verify CSS custom properties are set on the container's style attribute.

**Acceptance Scenarios**:

1. **Given** a container element and a resolved Theme object, **When** `applyThemeCssVars(container, theme)` is called, **Then** `container.style` contains `--vl-background`, `--vl-axis-color`, `--vl-grid-stroke`, `--vl-text-color`, `--vl-line-stroke`, `--vl-point-fill` and other theme-derived CSS variables
2. **Given** a container with existing CSS vars, **When** `applyThemeCssVars` is called again with a different theme, **Then** all CSS variables are updated to new values
3. **Given** a chart being created, **When** `applyThemeCssVars` is called, **Then** it executes BEFORE `renderSVG` is called

---

### User Story 2 - Merge Theme Overrides (Priority: P1)

A developer provides a partial theme configuration. The library deeply merges it with the default theme, preserving all unspecified values.

**Why this priority**: Without deep merging, every user must specify the full theme — making simple color changes require duplicating 50+ values.

**Independent Test**: Call `mergeTheme(defaultTheme, partialOverride)` and verify the result has both overridden values and preserved defaults.

**Acceptance Scenarios**:

1. **Given** the default theme with `axis.fontSize = 12` and `axis.tickSize = 6`, **When** `mergeTheme(defaultTheme, { axis: { fontSize: 14 } })` is called, **Then** result is `{ axis: { fontSize: 14, tickSize: 6 } }`
2. **Given** the default theme with `colors.palette = ["#1f77b4", "#ff7f0e", ...]`, **When** `mergeTheme(defaultTheme, { colors: { palette: ["#ff0000"] } })` is called, **Then** `result.colors.palette` is `["#ff0000"]` (replaced, not merged)
3. **Given** the default theme and `undefined` override, **When** `mergeTheme(defaultTheme, undefined)` is called, **Then** the default theme is returned unchanged

---

### User Story 3 - Resolve Curve Presets (Priority: P2)

A developer specifies a curve interpolation style by name (e.g., "monotoneX"). The library resolves it to the corresponding D3 curve factory.

**Why this priority**: Curve presets simplify the API — users don't need to import and understand D3 curve factories directly.

**Independent Test**: Call `resolveCurve("linear")` and verify it returns the D3 `curveLinear` factory.

**Acceptance Scenarios**:

1. **Given** a valid preset name "monotoneX", **When** `resolveCurve("monotoneX")` is called, **Then** D3 `curveMonotoneX` factory is returned
2. **Given** a D3 CurveFactory directly (e.g., `curveLinear`), **When** `resolveCurve(curveLinear)` is called, **Then** it is returned unchanged
3. **Given** an invalid preset name "invalid-curve", **When** `resolveCurve("invalid-curve")` is called, **Then** an Error is thrown with message listing all 18 valid presets
4. **Given** all 18 presets (basis, bumpX, cardinal, catmullRom, linear, monotoneX, monotoneY, natural, step, stepAfter, stepBefore, etc.), **When** each is passed to `resolveCurve`, **Then** each returns the correct D3 CurveFactory [source: B004]

---

### Edge Cases

- Invalid curve preset string → throws Error with descriptive message and list of valid presets
- Empty string curve preset → throws Error (not a valid preset)
- Theme override with `null` values → `null` replaces the default value (not ignored)
- CSS variable prefix collision → uses `--vl-` prefix to avoid conflicts with other libraries
- Container with existing inline styles → CSS variables are set alongside (not overwriting) existing styles
- Deep nested theme objects → deeply merged (not shallow)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST apply CSS custom properties with `--vl-` prefix to the chart container element [source: B002]
- **FR-002**: System MUST deeply merge a user-provided ThemeOverride object with the default theme, preserving unspecified values [source: B001]
- **FR-003**: System MUST replace (not merge) array-valued theme properties (e.g., colors.palette) during merge
- **FR-004**: System MUST resolve 18 curve preset string identifiers to corresponding D3 CurveFactory functions [source: B003, B004]
- **FR-005**: System MUST provide a default theme constant containing all visual styling tokens (axis, colors, grid, legend, line, points, title, tooltip) [source: B005]
- **FR-006**: System MUST NOT apply CSS variables after the SVG element exists (must apply before renderSVG)
- **FR-007**: System MUST export TypeScript types for Theme, ThemeOverride, CurvePreset, and DeepPartial

### Key Entities

- **Theme**: Complete visual styling configuration with sections for accessibility, axis, colors, grid, legend, line, points, title, tooltip
- **ThemeOverride (DeepPartial<Theme>)**: Partial theme where every property is optional, allowing sparse overrides
- **CurvePreset**: Union type of 18 string literals naming supported D3 curve interpolation methods
- **CURVE_PRESETS**: Readonly map of CurvePreset → D3 CurveFactory

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `applyThemeCssVars(container, theme)` sets `--vl-background`, `--vl-axis-color`, `--vl-grid-stroke`, `--vl-text-color`, `--vl-line-stroke`, `--vl-point-fill` on the container's style
- **SC-002**: `mergeTheme(defaultTheme, { axis: { fontSize: 14 } })` produces a Theme where `axis.fontSize = 14` and all other properties equal the default
- **SC-003**: `mergeTheme(defaultTheme, { colors: { palette: ["red"] } })` replaces the palette array (not appends)
- **SC-004**: `resolveCurve("linear")` returns D3 `curveLinear` factory
- **SC-005**: `resolveCurve(d3.curveLinear)` returns `d3.curveLinear` unchanged
- **SC-006**: `resolveCurve("invalid")` throws Error containing "Unknown curve preset" and a list of valid presets
- **SC-007**: All 18 curve presets (`CURVE_PRESETS`) resolve to valid D3 CurveFactory functions
- **SC-008**: `defaultTheme` contains all required sections: accessibility, axis, colors, grid, legend, line, points, title, tooltip
- **SC-009**: All CSS variables use `--vl-` prefix (no collision with other libraries or browser built-ins)

## Assumptions

- D3.js v7.9.0 is available as a peer dependency
- Browser environment supports CSS custom properties (all modern browsers)
- Theme is applied once at chart creation time (no runtime theme switching)
- Default theme values are sensible for typical chart usage
- Consumers use the library in a browser DOM environment (not server-side)
