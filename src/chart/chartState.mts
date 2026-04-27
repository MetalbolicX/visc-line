import type { ProcessedSeries } from "@/types/index.mjs";

import type { ZoomBehaviorWithReset } from "@/interactivity/index.mjs";
import type {
  WithAxesOptions,
  WithGridOptions,
  WithLegendOptions,
  WithTitleOptions,
  WithTooltipOptions,
  WithZoomPanOptions,
} from "@/chart/chartTypes.mjs";
import type { CustomCallback } from "@/types/index.mjs";

/**
 * Compact, read-only view of which visual features are enabled on a chart.
 *
 * @internal
 * Notes:
 * - Each property mirrors a boolean flag on ChartState and is intended for
 *   quick shallow-equality checks to determine whether feature-specific
 *   render or initialization logic should run.
 */
export interface FeatureFlags {
  readonly hasAxes: boolean;
  readonly hasCustom: boolean;
  readonly hasGrid: boolean;
  readonly hasLegend: boolean;
  readonly hasPoints: boolean;
  readonly hasTitle: boolean;
  readonly hasTooltip: boolean;
  readonly hasZoomPan: boolean;
}

/**
 * Full internal representation of a chart's runtime state.
 *
 * @internal
 * Invariants / remarks:
 * - `currentSeries` is treated as immutable by consumers (it is a read-only array
 *   of processed series).
 * - Boolean feature flags (hasAxes, hasGrid, ...) drive feature-level rendering
 *   and should remain consistent with the corresponding options objects when
 *   present (e.g. `hasLegend` vs `legendOptions`).
 */
export interface ChartState<T> {
  currentSeries: readonly ProcessedSeries<T>[];
  customCallback: null | CustomCallback;
  customCleanup: null | (() => void);
  hasAxes: boolean;
  hasCustom: boolean;
  hasGrid: boolean;
  hasLegend: boolean;
  hasPoints: boolean;
  hasTitle: boolean;
  hasTooltip: boolean;
  hasZoomPan: boolean;
  isDisposed: boolean;
  axesOptions: WithAxesOptions;
  gridOptions: WithGridOptions;
  legendOptions: null | WithLegendOptions;
  titleOptions: null | WithTitleOptions;
  tooltipOptions: WithTooltipOptions;
  zoomBehavior: null | ZoomBehaviorWithReset;
  zoomPanOptions: WithZoomPanOptions;
}

/**
 * Create a lightweight FeatureFlags snapshot from a ChartState.
 *
 * Why: callers frequently need a stable, shallow object that summarizes which
 * features are enabled so they can perform cheap equality checks and decide
 * whether to (re)initialize or render feature-specific components.
 *
 * Guarantees:
 * - Does not mutate the provided state or its nested objects.
 * - Returns a new plain object whose properties exactly mirror the boolean
 *   feature flags on the source state.
 *
 * @typeParam T - Series data point type; not used by the function but kept for
 *   API symmetry with ChartState.
 * @param state - Snapshot of the chart's internal state. Treated as read-only.
 * @returns A fresh FeatureFlags object derived from `state`.
 *
 * @example
 * const flags = getFeatureFlags(state);
 * if (flags.hasLegend && !prevFlags.hasLegend) {
 *   // initialize legend
 * }
 */
export const getFeatureFlags = <T,>(state: ChartState<T>): FeatureFlags => ({
  hasAxes: state.hasAxes,
  hasCustom: state.hasCustom,
  hasGrid: state.hasGrid,
  hasLegend: state.hasLegend,
  hasPoints: state.hasPoints,
  hasTitle: state.hasTitle,
  hasTooltip: state.hasTooltip,
  hasZoomPan: state.hasZoomPan,
});
