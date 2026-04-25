# Spec Draft — F001: Theme System

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F001-001: Apply Theme CSS Variables to Container

**Type**: Functional Requirement

**Description**: Theme system must apply CSS custom properties (variables) to the chart container element before the SVG is rendered.

**Source**: B002 (`applyThemeCssVars`)

**Acceptance Criteria**:
- SC-F001-001: Given a container element and resolved theme, when `applyThemeCssVars(container, theme)` is called, then CSS variables with `--vl-` prefix are set on the container's style
- SC-F001-002: CSS variables include: `--vl-background`, `--vl-axis-color`, `--vl-grid-stroke`, `--vl-text-color`, `--vl-line-stroke`, `--vl-point-fill` with values from theme
- SC-F001-003: CSS variables are applied BEFORE SVG element exists in the DOM

### FR-F001-002: Merge Theme Overrides with Default Theme

**Type**: Functional Requirement

**Description**: User-provided partial theme must be deeply merged with default theme, preserving unspecified values.

**Source**: B001 (`mergeTheme`)

**Acceptance Criteria**:
- SC-F001-003: Given default theme and partial override, `mergeTheme(default, override)` returns a Theme where all unspecified properties use default values
- SC-F001-004: Nested objects (e.g., `theme.axis.fontSize`) are deeply merged
- SC-F001-005: Arrays (e.g., `theme.colors.palette`) are replaced, not merged

### FR-F001-003: Resolve Curve Preset to D3 CurveFactory

**Type**: Functional Requirement

**Description**: Curve preset string identifiers must be resolved to actual D3 curve factory functions.

**Source**: B003 (`resolveCurve`), B004 (`CURVE_PRESETS`)

**Acceptance Criteria**:
- SC-F001-006: Given valid preset string ("linear", "monotoneX", "basis", etc.), `resolveCurve(preset)` returns corresponding D3 CurveFactory
- SC-F001-007: Given a CurveFactory directly, `resolveCurve` returns it unchanged
- SC-F001-008: Given invalid preset string, `resolveCurve` throws Error with descriptive message listing valid options

## Draft SCs (Edge Cases)

### SC-E-F001-001: Invalid Curve Preset

**Description**: Invalid curve preset string throws descriptive error.

**Given**: A chart is being created with `curve: "invalid-preset"`
**When**: `resolveCurve("invalid-preset")` is called
**Then**: An Error is thrown with message containing "Unknown curve preset" and list of valid presets

### SC-E-F001-002: Partial Theme Override

**Description**: Partial theme override preserves default values for unspecified properties.

**Given**: Default theme with `axis.fontSize = 12`
**When**: `mergeTheme(defaultTheme, { axis: { fontSize: 14 } })` is called
**Then**: Result has `axis.fontSize = 14` and `axis.tickSize = default.axis.tickSize`

## Draft Cross-Feature SCs

None — Theme System is a foundational service with no cross-Feature dependencies.
