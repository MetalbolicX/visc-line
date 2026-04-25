# Spec Draft — F011: Legend

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F011-001: Render Legend with Swatches

**Type**: Functional Requirement

**Description**: Legend renderer must display color swatches and labels for each series.

**Source**: B024 (`renderLegend`)

**Acceptance Criteria**:
- SC-F011-001: Given bounds selection, legend items, and theme, `renderLegend` creates legend group
- SC-F011-002: Each legend item has: colored rectangle (swatch) + text label
- SC-F011-003: Swatch color matches series.stroke from theme.colors.palette or series-specific stroke
- SC-F011-004: Label text is series.label
- SC-F011-005: Second call updates existing legend (idempotent)

### FR-F011-002: Legend Positioning

**Type**: Functional Requirement

**Description**: Legend position is configurable via theme.

**Source**: B024 (theme.legend.position)

**Acceptance Criteria**:
- SC-F011-006: Position "top" → legend at y = -theme.title.padding, centered
- SC-F011-007: Position "bottom" → legend below chart area
- SC-F011-008: Position "left" → legend on left side
- SC-F011-009: Position "right" → legend on right side

## Draft SCs (Edge Cases)

### SC-E-F011-001: Single Series Legend

**Description**: Single series legend displays one item.

**Given**: Chart with one ySeries
**When**: `renderLegend` is called
**Then**: Legend shows one swatch and one label

## Draft Cross-Feature SCs

None — Legend is a standalone visual component.
