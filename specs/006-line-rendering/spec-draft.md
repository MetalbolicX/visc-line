# Spec Draft — F006: Line Rendering

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F006-001: Render Line Path for Each Series

**Type**: Functional Requirement

**Description**: Line renderer must draw SVG path(s) for each processed series using D3 line generator.

**Source**: B017 (`renderLine`)

**Acceptance Criteria**:
- SC-F006-001: Given bounds selection, scales, and processed series array, `renderLine` creates one `<path class="line">` per series
- SC-F006-002: Line path uses xScale to map x values and yScale to map y values
- SC-F006-003: Line curve is determined by resolved CurveFactory from theme or options
- SC-F006-004: Second call reuses existing paths (idempotent, updates instead of duplicating)

## Draft SCs (Edge Cases)

### SC-E-F006-001: Empty Series Data

**Description**: Series with empty data array should not render a line.

**Given**: ProcessedSeries with empty data array
**When**: `renderLine` is called
**Then**: No path element is created for that series (or path has no points)

### SC-E-F006-002: Multiple Series

**Description**: Multiple series render as separate paths with distinct styling.

**Given**: Chart with 3 y series
**When**: `renderLine` is called
**Then**: 3 `<path class="line">` elements are created, one per series

## Draft Cross-Feature SCs

### SC-X-F006-001: Line Depends on Scales from F005

**Description**: Line rendering requires scales created by Data Services.

**Given**: Valid ProcessedSeries but no scales
**When**: `renderLine` is called
**Then**: Function requires xScale and yScale from `createScales` to map data to pixels
