# Spec Draft — F004: Accessibility

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F004-001: Observe Container Resize

**Type**: Functional Requirement

**Description**: Chart must observe container resize events and trigger re-render.

**Source**: B011 (`observeResize`)

**Acceptance Criteria**:
- SC-F004-001: Given a container element and callback, `observeResize` sets up ResizeObserver
- SC-F004-002: When container is resized, callback is called
- SC-F004-003: `observeResize` returns a cleanup function that disconnects the observer
- SC-F004-004: Cleanup function can be called to stop observing

## Draft SCs (Edge Cases)

### SC-E-F004-001: Cleanup on Dispose

**Description**: Resize observer must be cleaned up when chart is disposed.

**Given**: Chart with active resize observer
**When**: `chart.dispose()` is called
**Then**: ResizeObserver is disconnected, no further callbacks occur

## Draft Cross-Feature SCs

None — Accessibility is a standalone service.
