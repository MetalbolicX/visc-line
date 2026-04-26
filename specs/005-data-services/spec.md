# Feature Specification: Data Services

**Feature Branch**: `005-data-services` | **Created**: 2026-04-25 | **Status**: Draft
**Input**: Reverse-spec: Data wrangling, scale creation, extent computation

## Scope

✅ **In-Scope**: processAllSeries, processNumericData, getMultiSeriesExtents, createScales, clearExtentCache
❌ **Out-of-Scope**: Line/axis/grid rendering (F006-F008)

## User Stories

### US1 — Process Series Data (P1)
Filter invalid values and attach processed data to each series descriptor.

### US2 — Compute Extents (P2)
Find min/max across all series with caching.

### US3 — Create D3 Scales (P1)
Create configured X and Y scales with domain, range, nice().

## Requirements

- **FR-001**: processAllSeries filters invalid values using isValidNumber
- **FR-002**: getMultiSeriesExtents computes combined x/y extents with caching
- **FR-003**: createScales creates xScale (range [0, innerWidth]) and yScale (range [innerHeight, 0])
- **FR-004**: Log/pow scales with non-positive domain fallback to linear
- **FR-005**: clearExtentCache clears module-level cache

## Success Criteria

- **SC-001**: NaN/Infinity/null/undefined values filtered from processed data
- **SC-002**: Cached extents returned on repeated calls with same data
- **SC-003**: Y scale inverted (innerHeight → 0)
