# Spec Draft — F002: Layout

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F002-001: Calculate Chart Dimensions

**Type**: Functional Requirement

**Description**: Layout service must calculate inner drawing dimensions from container size minus margins.

**Source**: B006 (`getDimensions`)

**Acceptance Criteria**:
- SC-F002-001: Given container with clientWidth=800 and clientHeight=600, and margins={top:20,right:20,bottom:40,left:50}, then innerWidth=730 (800-50-20) and innerHeight=540 (600-20-40)
- SC-F002-002: Result includes: width, height, innerWidth, innerHeight, margins

### FR-F002-002: Default Margins Configuration

**Type**: Configuration Requirement

**Description**: Chart must use sensible default margins when not specified.

**Source**: B007 (`DEFAULT_MARGINS`)

**Acceptance Criteria**:
- SC-F002-003: Default margins are: top=20, right=20, bottom=40, left=50 (in pixels)
- SC-F002-004: Default margins provide adequate space for axis labels and ticks

## Draft SCs (Edge Cases)

### SC-E-F002-001: Container with Zero Dimensions

**Description**: Container with zero or undefined dimensions should return zero dimensions.

**Given**: Container with clientWidth=0 or clientHeight=0
**When**: `getDimensions(container, margins)` is called
**Then**: Result has innerWidth=0 and innerHeight=0 (no negative values)

## Draft Cross-Feature SCs

None — Layout is a foundational calculation service.
