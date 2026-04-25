# Spec Draft — F003: SVG/Bounds

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F003-001: Render SVG Root Element

**Type**: Functional Requirement

**Description**: SVG component must render a single SVG element sized to the container.

**Source**: B008 (`renderSVG`)

**Acceptance Criteria**:
- SC-F003-001: Given a container element, `renderSVG(container)` creates exactly one SVG child element
- SC-F003-002: SVG width equals `container.clientWidth` and height equals `container.clientHeight`
- SC-F003-003: SVG has `overflow: visible` style
- SC-F003-004: SVG has ARIA role="img" and optional aria-label
- SC-F003-005: Second call reuses existing SVG (idempotent)

### FR-F003-002: Render Bounds Group

**Type**: Functional Requirement

**Description**: Bounds group provides the main coordinate system with margins applied.

**Source**: B009 (`renderBoundsGroup`)

**Acceptance Criteria**:
- SC-F003-006: Given SVG selection and margins, `renderBoundsGroup(svg, margins)` creates/updates exactly one `<g class="bounds">`
- SC-F003-007: Bounds group transform is `translate(margins.left, margins.top)`
- SC-F003-008: Second call reuses existing bounds group (idempotent)

### FR-F003-003: Render Content Group with Clip-Path

**Type**: Functional Requirement

**Description**: Content group clips rendered content to the inner drawing area.

**Source**: B010 (`renderContentGroup`)

**Acceptance Criteria**:
- SC-F003-009: Given bounds selection, SVG, and dimensions, `renderContentGroup` creates `<defs><clipPath id="chart-content-clip">`
- SC-F003-010: Content group has `clip-path: url(#chart-content-clip)`
- SC-F003-011: Clip rect sized to innerWidth × innerHeight

## Draft SCs (Edge Cases)

### SC-E-F003-001: Resize Handler Updates Dimensions

**Description**: When container resizes, SVG dimensions must update.

**Given**: SVG already rendered with original dimensions
**When**: Container is resized to new dimensions
**Then**: `renderSVG` call updates width/height attributes to new values

## Draft Cross-Feature SCs

### SC-X-F003-001: SVG Depends on Theme CSS Variables

**Description**: SVG background color comes from theme CSS variable.

**Given**: Theme with `colors.background = "#ffffff"`
**When**: `renderSVG` is called after `applyThemeCssVars`
**Then**: SVG background style is `var(--vl-background)` which resolves to "#ffffff"
