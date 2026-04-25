# Spec Draft — F007: Axis System

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F007-001: Render X Axis

**Type**: Functional Requirement

**Description**: X axis must be rendered at the bottom of the chart with ticks and labels.

**Source**: B018 (`renderXAxis`)

**Acceptance Criteria**:
- SC-F007-001: Given bounds selection, xScale, and theme, `renderXAxis` creates `<g class="x-axis">`
- SC-F007-002: Axis is positioned at y = innerHeight (bottom of chart area)
- SC-F007-003: Ticks are generated from xScale.ticks() with theme styling
- SC-F007-004: Domain line spans full innerWidth
- SC-F007-005: Second call updates existing axis (idempotent)

### FR-F007-002: Render Y Axis

**Type**: Functional Requirement

**Description**: Y axis must be rendered at the left of the chart with ticks and labels.

**Source**: B019 (`renderYAxis`)

**Acceptance Criteria**:
- SC-F007-006: Given bounds selection, yScale, and theme, `renderYAxis` creates `<g class="y-axis">`
- SC-F007-007: Axis is positioned at x = 0 (left edge of chart area)
- SC-F007-008: Ticks are generated from yScale.ticks() with theme styling
- SC-F007-009: Domain line spans full innerHeight
- SC-F007-010: Second call updates existing axis (idempotent)

### FR-F007-003: Render Axis Labels

**Type**: Functional Requirement

**Description**: Optional axis labels display the series name.

**Source**: B020 (`renderXAxisLabel`, `renderYAxisLabel`)

**Acceptance Criteria**:
- SC-F007-011: X axis label is positioned below the axis at center
- SC-F007-012: Y axis label is positioned to the left of the axis at center, rotated -90°

## Draft SCs (Edge Cases)

### SC-E-F007-001: Time Scale Axis

**Description**: Time scale formats tick labels as dates.

**Given**: xType="time" with Date objects
**When**: `renderXAxis` is called
**Then**: Tick labels are formatted dates (e.g., "Jan 2024")

## Draft Cross-Feature SCs

### SC-X-F007-001: Axis Uses Scales from F005

**Description**: Axis rendering requires scales from Data Services.

**Given**: Valid scale but no extent computation
**When**: `renderXAxis` is called
**Then**: Axis requires xScale with domain set from `getMultiSeriesExtents`
