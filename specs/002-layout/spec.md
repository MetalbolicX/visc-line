# Feature Specification: Layout

**Feature Branch**: `002-layout` | **Created**: 2026-04-25 | **Status**: Draft
**Input**: Reverse-spec: Dimension calculation utilities for chart drawing area

## Scope

✅ **In-Scope**:
- Calculate inner drawing dimensions from container size and margins
- Provide default margins constant

❌ **Out-of-Scope**:
- Responsive layout (handled by F004 Accessibility)
- SVG/Bounds rendering (handled by F003)

## User Scenarios

### User Story 1 — Calculate Drawing Dimensions (Priority: P1)

A chart needs to know the available drawing area for scales and components. Layout calculates `innerWidth` and `innerHeight` from the container's `clientWidth`/`clientHeight` minus margins.

**Acceptance Scenarios**:
1. **Given** container with clientWidth=800, clientHeight=600 and margins {top:20,right:20,bottom:40,left:50}, **When** `getDimensions(container, margins)` is called, **Then** result is {width:800, height:600, innerWidth:730, innerHeight:540, margins:{...}}
2. **Given** container with clientWidth=0, **When** `getDimensions` is called, **Then** innerWidth is 0 (no negative values)

## Requirements

- **FR-001**: System MUST calculate inner dimensions from container size minus margins
- **FR-002**: System MUST provide sensible default margins (top=20, right=20, bottom=40, left=50)

## Success Criteria

- **SC-001**: Given 800×600 container with default margins, innerWidth=730, innerHeight=540
- **SC-002**: Dimensions include: width, height, innerWidth, innerHeight, margins
- **SC-003**: Zero-size container produces zero inner dimensions (not negative)

## Assumptions

- Container is attached to DOM (required for clientWidth/clientHeight)
- Margins object has top, right, bottom, left in pixels
