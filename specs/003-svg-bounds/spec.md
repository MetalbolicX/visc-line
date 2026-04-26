# Feature Specification: SVG/Bounds

**Feature Branch**: `003-svg-bounds` | **Created**: 2026-04-25 | **Status**: Draft
**Input**: Reverse-spec: SVG root element and bounds/content group rendering

## Scope

✅ **In-Scope**: renderSVG, renderBoundsGroup, renderContentGroup
❌ **Out-of-Scope**: Axes/line/points rendering (F006-F011)

## User Stories

### US1 — Render SVG Root (P1)
Creates `<svg>` sized to container with ARIA label and background from CSS var.

### US2 — Render Bounds Group (P1)
Creates `<g class="bounds">` with margin-based transform.

### US3 — Render Content Group (P2)
Creates `<g class="content">` with clip-path for content overflow.

## Requirements

- **FR-001**: renderSVG creates idempotent SVG element with container dimensions
- **FR-002**: renderBoundsGroup creates idempotent bounds group with margin transform
- **FR-003**: renderContentGroup creates clip-path and content group

## Success Criteria

- **SC-001**: SVG width/height = container clientWidth/clientHeight
- **SC-002**: Bounds group has `transform: translate(left, top)`
- **SC-003**: Content group has `clip-path: url(#chart-content-clip)`
- **SC-004**: All renderers are idempotent (re-render doesn't duplicate elements)
