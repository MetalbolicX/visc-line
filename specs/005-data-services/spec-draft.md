# Spec Draft — F005: Data Services

> Draft FR/SC generated from reverse-spec source analysis.
> To be refined during /speckit.specify.

## Draft FRs

### FR-F005-001: Process All Data Series

**Type**: Functional Requirement

**Description**: Data wrangling must filter invalid values and attach processed data to each series descriptor.

**Source**: B014 (`processAllSeries`)

**Acceptance Criteria**:
- SC-F005-001: Given raw data array, x accessor, and y series descriptors, `processAllSeries` returns array of ProcessedSeries
- SC-F005-002: Each ProcessedSeries contains original descriptor properties plus `data` field with filtered items
- SC-F005-003: Data items are filtered to only those where both xAccessor and yAccessor return valid numbers or Dates
- SC-F005-004: A value is valid if: not null, not undefined, (Date with valid time) or (not NaN and finite number)

### FR-F005-002: Compute Multi-Series Extents

**Type**: Functional Requirement

**Description**: Extent computation must find min/max values across all series with caching.

**Source**: B015 (`getMultiSeriesExtents`)

**Acceptance Criteria**:
- SC-F005-005: Given processed series and x accessor, `getMultiSeriesExtents` returns xDomain [min, max] across all data
- SC-F005-006: Given processed series and y accessors, `getMultiSeriesExtents` returns yDomain [min, max] across all series
- SC-F005-007: Results are cached using deterministic key based on series labels and data point values
- SC-F005-008: Second call with same data returns cached result without recomputation

### FR-F005-003: Create Configured D3 Scales

**Type**: Functional Requirement

**Description**: Scale creation must produce configured X and Y scales ready for plotting.

**Source**: B013 (`createScales`)

**Acceptance Criteria**:
- SC-F005-009: Given CreateScalesOptions (dimensions, domains, types), `createScales` returns ChartScales with xScale and yScale
- SC-F005-010: X scale range is [0, innerWidth]; Y scale range is [innerHeight, 0] (inverted)
- SC-F005-011: `.nice()` is called on both scales for cleaner tick values
- SC-F005-012: For log/pow scales with non-positive domain, falls back to linear scale

### FR-F005-004: Clear Extent Cache

**Type**: Functional Requirement

**Description**: Extent cache must be cleared before recomputing with new data.

**Source**: B016 (`clearExtentCache`)

**Acceptance Criteria**:
- SC-F005-013: `clearExtentCache()` removes all entries from the module-level cache
- SC-F005-014: Called by `chart.update()` before processing new data

## Draft SCs (Edge Cases)

### SC-E-F005-001: All Invalid Data

**Description**: When all data points have invalid values, series data is empty.

**Given**: Raw data where all x or y values are null/NaN
**When**: `processAllSeries` is called
**Then**: Returned ProcessedSeries has empty `data` array

### SC-E-F005-002: Log Scale with Non-Positive Domain

**Description**: Log scale with zero or negative values falls back to linear.

**Given**: ScaleType="log" with domain [-10, 10]
**When**: `createScales` is called
**Then**: xSafeType becomes "linear" (fallback)

### SC-E-F005-003: Same Data Different Order

**Description**: Cache key includes data point values, so reordered data misses cache.

**Given**: Series with same labels but different data point order
**When**: `getMultiSeriesExtents` is called
**Then**: Cache key differs, so recomputation occurs (not a bug — this is correct behavior)

## Draft Cross-Feature SCs

### SC-X-F005-001: Extent Cache Shared Across Series

**Description**: All series share the same extent cache.

**Given**: Chart with multiple series being processed
**When**: `getMultiSeriesExtents` is called after `processAllSeries`
**Then**: Cache key includes all series labels, so combined extents are computed together
