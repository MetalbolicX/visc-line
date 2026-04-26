# Feature Specification: Accessibility

**Feature Branch**: `004-accessibility` | **Created**: 2026-04-25 | **Status**: Draft
**Input**: Reverse-spec: Resize observer for chart re-rendering

## Scope

✅ **In-Scope**: observeResize with cleanup
❌ **Out-of-Scope**: ARIA annotations, keyboard navigation (handled by SVG/Bounds)

## Requirements

- **FR-001**: `observeResize(container, callback)` sets up ResizeObserver
- **FR-002**: Returns cleanup function that disconnects observer

## Success Criteria

- **SC-001**: Container resize triggers callback
- **SC-002**: Cleanup stops observation
- **SC-003**: No callback after cleanup
