# Spec Draft — F012: Tooltip

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F012-001: Add Tooltip Interactivity

**Type**: Functional Requirement

**Description**: Tooltip must show formatted data values on hover.

**Source**: B025 (`addTooltip`)

**Acceptance Criteria**:
- SC-F012-001: Given bounds selection, scales, and options, `addTooltip` sets up mouse event listeners
- SC-F012-002: On mouse enter over data area, tooltip element becomes visible
- SC-F012-003: Tooltip displays x and y values formatted via options.formatX/formatY or default formatter
- SC-F012-004: Tooltip follows mouse position (or stays fixed near data point)
- SC-F012-005: On mouse leave, tooltip hides

### FR-F012-002: Remove Tooltip

**Type**: Functional Requirement

**Description**: Tooltip must be properly cleaned up on chart dispose.

**Source**: B026 (`disposeTooltip`)

**Acceptance Criteria**:
- SC-F012-006: `disposeTooltip(bounds)` removes tooltip element and event listeners
- SC-F012-007: Called during chart dispose lifecycle

## Draft SCs (Edge Cases)

### SC-E-F012-001: Mouse Outside Data Area

**Description**: Tooltip should not show when mouse is outside chart data area.

**Given**: Mouse moved to area outside line/points
**When**: Mouse move event fires
**Then**: Tooltip remains hidden

### SC-E-F012-002: Tooltip Styled from Theme

**Description**: Tooltip appearance comes from theme.tooltip.

**Given**: Theme with tooltip configuration (background, border, color, fontSize, padding, borderRadius)
**When**: Tooltip is shown
**Then**: Tooltip styling uses theme.tooltip values via CSS variables

## Draft Cross-Feature SCs

### SC-X-F012-001: Tooltip Uses Scales to Convert Position to Values

**Description**: Tooltip converts mouse pixel position to data values using scales.

**Given**: Mouse at pixel position (px, py)
**When**: Tooltip shows
**Then**: x value = xScale.invert(px), y value = yScale.invert(py)
