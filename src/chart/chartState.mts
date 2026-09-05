import type {
  WithAnnotationsOptions,
  WithAxesOptions,
  WithGridOptions,
  WithLegendOptions,
  WithReferenceLinesOptions,
  WithTitleOptions,
  WithTooltipOptions,
  WithZoomPanOptions,
} from "@/chart/chartTypes.mjs";
import type { ZoomBehaviorWithReset } from "@/interactivity/index.mjs";
import type { ProcessedSeries } from "@/types/index.mjs";
import type { CustomCallback } from "@/types/index.mjs";

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
  allSeries: readonly ProcessedSeries<T>[];
  allSeriesExtents: Readonly<{
    readonly xDomain: readonly [undefined, undefined] | readonly [unknown, unknown];
    readonly yDomain: readonly [number, number] | readonly [undefined, undefined];
  }>;
  annotationsOptions: null | WithAnnotationsOptions;
  axesOptions: WithAxesOptions;
  currentSeries: readonly ProcessedSeries<T>[];
  customCallback: CustomCallback | null;
  customCleanup: (() => void) | null;
  focusLabels: ReadonlySet<string>;
  gridOptions: WithGridOptions;
  hasAnnotations: boolean;
  hasAxes: boolean;
  hasCustom: boolean;
  hasGrid: boolean;
  hasLegend: boolean;
  hasPoints: boolean;
  hasReferenceLines: boolean;
  hasTitle: boolean;
  hasTooltip: boolean;
  hasZoomPan: boolean;
  isDisposed: boolean;
  legendOptions: null | WithLegendOptions;
  referenceLinesOptions: WithReferenceLinesOptions;
  titleOptions: null | WithTitleOptions;
  tooltipOptions: WithTooltipOptions;
  visibleLabels: ReadonlySet<string>;
  zoomBehavior: null | ZoomBehaviorWithReset;
  zoomPanOptions: WithZoomPanOptions;
}

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
  readonly hasAnnotations: boolean;
  readonly hasAxes: boolean;
  readonly hasCustom: boolean;
  readonly hasGrid: boolean;
  readonly hasLegend: boolean;
  readonly hasPoints: boolean;
  readonly hasReferenceLines: boolean;
  readonly hasTitle: boolean;
  readonly hasTooltip: boolean;
  readonly hasZoomPan: boolean;
}


