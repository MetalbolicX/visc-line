# Spec Draft — F008: Grid System

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F008-001: Render Horizontal Grid Lines

**Type**: Functional Requirement

**Description**: Y grid renders horizontal lines at each Y axis tick position.

**Source**: B021 (`renderYGrid`)

**Acceptance Criteria**:
- SC-F008-001: Given bounds selection, yScale, and theme, `renderYGrid` creates `<g class="grid y-grid">`
- SC-F008-002: Grid lines span full innerWidth at each yScale tick
- SC-F008-003: Grid stroke, strokeWidth, dashArray from theme.grid
- SC-F008-004: Second call updates existing grid (idempotent)

### FR-F008-002: Render Vertical Grid Lines

**Type**: Functional Requirement

**Description**: X grid renders vertical lines at each X axis tick position.

**Source**: B021 (`renderXGrid`)

**Acceptance Criteria**:
- SC-F008-005: Given bounds selection, xScale, and theme, `renderXGrid` creates `<g class="grid x-grid">`
- SC-F008-006: Grid lines span full innerHeight at each xScale tick
- SC-F008-007: Grid stroke, strokeWidth, dashArray from theme.grid
- SC-F008-008: Second call updates existing grid (idempotent)

## Draft SCs (Edge Cases)

### SC-E-F008-001: Grid Lines Inside Clip Path

**Description**: Grid lines are inside content group and will be clipped.

**Given**: Chart with grid and zoom enabled
**When**: User zooms in
**Then**: Grid lines outside visible area are clipped (not visible)

## Draft Cross-Feature SCs

### SC-X-F008-001: Grid Uses Scales from F005

**Description**: Grid requires scales from Data Services for tick positions.

**Given**: Valid scale with ticks
**When**: `renderYGrid` is called
**Then**: Grid lines at each yScale.tick() position
