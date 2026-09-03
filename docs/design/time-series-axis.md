# Time-Series Axis Polish — Design Document

> **Plan**: 013
> **Branch**: `spike/013-time-axis`
> **Base**: `advisor/009-component-consolidation` (commit `1f5ee6a`)
> **Status**: SPIKE complete

---

## 1. Current Behavior Baseline

### Empirical Findings (Unit Test Results)

Tests were run against the consolidated axis renderer (`axisRenderer.mts`) using jsdom.
Three domain spans were tested: 1 day, 1 month, 5 years.

| Domain Span | Tick Count Range | Label Format | Zoom Behavior |
|-------------|-----------------|-------------|---------------|
| 1 day       | 4–8             | Hour-level (e.g., "00:00", "06:00", "12:00") | d3 default multi-scale: adjusts to minute-level on heavy zoom |
| 1 month     | 4–8             | Day-level (e.g., "Jan 1", "Jan 8", "Jan 15") | d3 default multi-scale: adjusts to week-level or day-level depending on zoom |
| 5 years     | 4–6             | Year-level (e.g., "2020", "2022", "2024") | d3 default multi-scale: stays at year-level; month-level on heavy zoom-in |

**Key observations**:
- d3's default multi-scale time format is zoom-aware by construction — it recalculates tick positions and labels based on the transformed domain.
- No user control over tick format exists today; `xTickFormat` in `WithAxesOptions` accepts a function but requires the caller to know d3's `AxisDomain` union type.
- For time scales specifically, users must pass a function that handles `Date | number | string`, which is ergonomically poor compared to a Date-specific formatter.
- Tick counts are automatically determined by d3-axis based on the axis length and domain span; the `tickCount` option serves as a hint that d3 may override.

### Zoom Interaction Analysis

The zoom redraw path is in `chartRender.mts:289–316`:

```typescript
onZoom: context.state.zoomPanOptions.onZoom ??
  ((newX: AnyScale, newY: AnyScale): void => {
    if (context.flags.hasAxes) {
      const { xTickCount, xTickFormat, yTickCount, yTickFormat } = context.state.axesOptions;
      renderXAxis(context.bounds, newX, dims.innerHeight, {
        tickCount: xTickCount,
        tickFormat: xTickFormat,
      });
      // ...
    }
  })
```

**How zoom derives new domains**: d3-zoom calls the `onZoom` callback with rescaled scales (`newX`, `newY`) that have had their domains re-computed based on the transform. The callback simply re-renders axes with these new scales.

**Format re-evaluation on zoom**: With the current implementation (no `timeTickFormat`), d3's default multi-scale format handles zoom automatically. When a custom format is applied (via `xTickFormat` or `timeTickFormat`), the format is FIXED — it does not adapt to zoom level. This is a fundamental trade-off: custom formats are static by design.

---

## 2. Option Surface

### Option A: `timeTickFormat?: string | ((date: Date) => string)`

**Type signature**:
```typescript
readonly timeTickFormat?: string | ((date: Date) => string);
```

**Where consumed**:
- `chartRender.mts:187–195` (initial render) and `:303–311` (zoom redraw)
- Only active when `context.xType === "time"`
- String form: parsed by `d3.timeFormat()` to produce a `(Date) => string` function
- Function form: passed directly to `axis.tickFormat()`

**Zoom interaction**: FIXED granularity — the format does not change when the domain transforms. This is the documented trade-off; users who need zoom-adaptive formatting must use the default (no custom format).

**Public type addition**: `WithAxesOptions.timeTickFormat` (added to `chartTypes.mts`)

**Status**: ✅ Prototype implemented on `spike/013-time-axis`

---

### Option B: `timeTickInterval?: { every: number; unit: "second" | "minute" | "hour" | "day" | "week" | "month" | "year" }`

**Type signature**:
```typescript
interface TimeTickInterval {
  readonly every: number;
  readonly unit: "second" | "minute" | "hour" | "day" | "week" | "month" | "year";
}
readonly timeTickInterval?: TimeTickInterval;
```

**Where consumed**: `axis.ticks()` instead of `axis.ticks(tickCount)`. Maps to:
- `"second"` → `d3.timeSecond.every(every)`
- `"minute"` → `d3.timeMinute.every(every)`
- etc.

**Zoom interaction**: INTERVAL-based ticks are fixed positions regardless of zoom. Combined with `timeTickFormat`, this gives full control. Without custom format, d3's multi-scale format still applies to interval-based ticks.

**Public type addition**: `WithAxesOptions.timeTickInterval` + supporting `TimeTickInterval` interface

**Status**: NOT implemented (deferred to build plan)

---

### Option C: `locale?: LocaleSpecification`

**Type signature**:
```typescript
readonly locale?: d3.TimeLocaleDefinition;
```

**Feasibility note**: d3's `timeFormatDefaultLocale()` mutates global state and is not thread-safe. Proper i18n would require `d3.timeFormat()` scoped to a locale object (available in d3 v7.7+). The current axis renderer uses the global format. Adding locale support would require threading locale through `axis.tickFormat()` at construction time, which is architecturally invasive.

**Recommendation**: OUT OF SCOPE for the initial build. Revisit only if there is explicit demand with evidence that d3 v7.7+ locale scoping is available and safe.

**Status**: NOT IMPLEMENTED — documented as deferred

---

### Option D: Zoom-aware granularity analysis

**Default behavior (no custom format)**: d3's multi-scale time format IS zoom-aware. From the d3 documentation:
> The multi-scale time format adapts to the density of the temporal context. At millisecond densities, the format renders as "12:34:45.567"; at second densities, "12:34:45"; at minute densities, "12:34"; at hour densities, "12:00"; at day densities, "Mon 21"; at week densities, "Nov 14"; at month densities, "March"; at year densities, "2024".

**Custom formats (Option A)**: FIXED granularity. A format like `"%b %d"` always renders "Jan 15", regardless of whether the domain is 1 day or 5 years. This is the expected trade-off.

**Recommendation**: Document this trade-off prominently in the API docs. Do NOT attempt to build auto-format-switching unless there is a concrete use case.

---

## 3. Prototype Findings (Step 3)

The `timeTickFormat` option was implemented end-to-end:

1. **Type extension** (`chartTypes.mts`): Added `timeTickFormat?: string | ((date: Date) => string)` to `WithAxesOptions`
2. **Plumbing** (`chartRender.mts`): Added `timeFormat` import from d3; in both initial render and zoom redraw paths, resolved `timeTickFormat` (string → `timeFormat()`, function → pass through) and forwarded as `tickFormat` to `renderXAxis`
3. **Renderer wiring**: The existing `axisRenderer.mts` already forwards `tickFormat` to `axis.tickFormat()` — no changes needed there
4. **Unit tests**: Two new test cases verify that custom formatters produce correctly formatted labels

**Finding**: The consolidated axis renderer from plan 009 already supports `tickFormat` forwarding. The spike was minimal because the infrastructure was already in place.

**Type safety challenge**: `timeTickFormat` function type `(date: Date) => string` is not structurally identical to `RenderXAxisOptions.tickFormat` type `(domainValue: AxisDomain, index: number) => string`. Type casting was required at the call site because d3-axis always passes Date values for time scales. This cast is safe and documented.

---

## 4. Build Plan Skeleton

### Phase 1: `timeTickFormat` (lowest risk, highest value)

1. Merge `timeTickFormat` type + plumbing + unit tests from `spike/013-time-axis`
2. Add characterization tests: assert exact tick label values for known format strings
3. Update API documentation with the trade-off note about fixed granularity during zoom

**Risks**: Low. Already prototyped and tested.

### Phase 2: `timeTickInterval` (medium risk)

1. Add `TimeTickInterval` interface + `timeTickInterval` to `WithAxesOptions`
2. Update `axisRenderer.mts` to use `ticks(interval)` instead of `ticks(tickCount)` when interval is provided
3. Handle edge cases:
   - Month-based intervals on domains that don't span full months (e.g., Feb 30)
   - Week-based intervals on domains near month boundaries
4. Add unit tests for interval-based tick generation

**Risks**:
- Month/week boundary edge cases (d3's `every()` can produce out-of-range ticks)
- Interaction between `timeTickInterval` and `timeTickFormat` (both set — which wins?)

### Phase 3: Documentation + polish

1. Update `docs/` with new API reference entries
2. Add example in `examples/main.mts` showing `timeTickFormat` usage
3. Consider a demo showing zoom behavior with/without custom format

---

## 5. Open Questions

1. **Should `timeTickFormat` and `xTickFormat` be mutually exclusive?** Currently they are independent; `timeTickFormat` takes precedence for time scales. Is this the desired behavior?

2. **Should `timeTickInterval` override `xTickCount`?** When both are set, `ticks(interval)` should take precedence, but this should be documented.

3. **Should there be a combined `timeTickOptions` object instead of flat options?** For future extensibility (locale, interval, format), grouping time-specific options under `timeTickOptions: { format, interval }` may be cleaner than flat options.

4. **Are there real use cases for zoom-adaptive custom formats?** If so, the architecture would need a way to recompute format based on the transformed domain. This is non-trivial.

---

## 6. Recommendation

**RECOMMENDATION: PROCEED (refine)**

The `timeTickFormat` option should be built. The prototype confirmed:

1. The infrastructure from plan 009 already supports `tickFormat` forwarding — no architectural changes needed
2. The implementation is minimal: type + plumbing + 2 casts
3. Unit tests validate the behavior end-to-end
4. The only trade-off (fixed granularity during zoom) is well-understood and documented

The next step is a numbered build plan that:
1. Cherry-picks the `timeTickFormat` type + plumbing from this spike
2. Adds characterization tests with exact label assertions
3. Updates API docs

The `timeTickInterval` option is a logical follow-up, but should be a separate build plan due to edge-case complexity (month boundaries, interval×format interactions).

`locale` support should be explicitly deferred — the global-state mutation problem is a real architectural concern that is not worth solving without concrete demand.
