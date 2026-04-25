# Spec Draft — F013: Zoom/Pan

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F013-001: Add Zoom/Pan Behavior

**Type**: Functional Requirement

**Description**: Zoom/pan must enable mouse-based chart interaction.

**Source**: B027 (`addZoomPan`)

**Acceptance Criteria**:
- SC-F013-001: Given SVG, bounds, and options, `addZoomPan` applies D3 zoom behavior
- SC-F013-002: Mouse wheel zooms chart content (scales adjust)
- SC-F013-003: Click and drag pans chart content
- SC-F013-004: Optional callback onZoom receives new scales
- SC-F013-005: Scale extent limits prevent over-zoom

### FR-F013-002: Cleanup Zoom Behavior

**Type**: Functional Requirement

**Description**: Zoom behavior must be cleaned up when chart is disposed.

**Source**: B028 (`cleanupAllEnhancements`)

**Acceptance Criteria**:
- SC-F013-006: `cleanupAllEnhancements` removes zoom behavior and event listeners
- SC-F013-007: Called during chart dispose lifecycle

## Draft SCs (Edge Cases)

### SC-E-F013-001: Zoom Extent Limits

**Description**: Zoom should have min/max limits to prevent too much zoom in/out.

**Given**: Chart with zoom enabled
**When**: User zooms to extreme level
**Then**: Zoom stops at scale extent limits (prevent infinite zoom)

### SC-E-F013-002: Zoom Triggers Re-render

**Description**: Zoom/pan changes require content to re-render.

**Given**: Chart with zoom and points enabled
**When**: User zooms in
**Then**: Content re-renders at new scale (points and line update positions)

### SC-E-F013-003: Axes Not Affected by Zoom

**Description**: Axes render outside content clip-path and are not zoomed.

**Given**: Chart with zoom enabled
**When**: User zooms
**Then**: Axes remain at original position/scale (only content inside clip-path zooms)

## Draft Cross-Feature SCs

### SC-X-F013-001: Zoom Modifies Scales

**Description**: Zoom behavior modifies the scales and triggers re-render.

**Given**: Original xScale, yScale
**When**: User zooms
**Then**: Zoom behavior creates new scales with adjusted domain, calls onZoom callback, content re-renders
