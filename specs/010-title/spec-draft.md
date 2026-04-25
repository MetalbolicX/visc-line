# Spec Draft — F010: Title

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F010-001: Render Chart Title

**Type**: Functional Requirement

**Description**: Title renderer must display chart title text above the chart area.

**Source**: B023 (`renderTitle`)

**Acceptance Criteria**:
- SC-F010-001: Given bounds selection, title text, and theme, `renderTitle` creates `<text class="title">`
- SC-F010-002: Title text is centered horizontally at x = innerWidth / 2
- SC-F010-003: Title y position is at -theme.title.padding (above chart area)
- SC-F010-004: Title font size, color, fontWeight from theme.title
- SC-F010-005: Second call updates existing title (idempotent)

## Draft SCs (Edge Cases)

### SC-E-F010-001: Empty Title

**Description**: Empty title string should not render text element.

**Given**: Title text is empty string
**When**: `renderTitle` is called
**Then**: No title element is created (or text is empty)

## Draft Cross-Feature SCs

None — Title is a standalone visual component.
