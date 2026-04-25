# Spec Draft — F009: Points

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F009-001: Render Data Points as Circles

**Type**: Functional Requirement

**Description**: Points renderer must draw circle elements at each data point position.

**Source**: B022 (`renderPoints`)

**Acceptance Criteria**:
- SC-F009-001: Given bounds selection, scales, processed series, and theme, `renderPoints` creates `<circle class="point">` elements
- SC-F009-002: Each circle cx is xScale(xValue), cy is yScale(yValue)
- SC-F009-003: Circle radius from theme.points.radius (default 3)
- SC-F009-004: Circle fill from theme.points.fill or series-specific pointFill
- SC-F009-005: Second call updates existing points (idempotent)

## Draft SCs (Edge Cases)

### SC-E-F009-001: Empty Series Data

**Description**: Series with empty data array renders no points.

**Given**: ProcessedSeries with empty data array
**When**: `renderPoints` is called
**Then**: No circle elements created for that series

### SC-E-F009-002: Points Inside Clip Path

**Description**: Points outside visible area are clipped.

**Given**: Chart with points and zoom enabled
**When**: User zooms to a region
**Then**: Points outside visible area are clipped (not visible)

## Draft Cross-Feature SCs

### SC-X-F009-001: Points Use Scales and ProcessedSeries

**Description**: Points require scales from F005 and processed data from F005.

**Given**: Valid scales and processed series
**When**: `renderPoints` is called
**Then**: Points rendered at correct pixel positions using xScale and yScale
