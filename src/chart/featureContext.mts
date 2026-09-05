/**
 * Shared context types for the feature registry and feature definitions.
 *
 * These types were previously co-located in featureRegistry.mts. They are
 * separated here so feature defs and consumers can import from a single home.
 *
 * @module featureContext
 * @internal
 */

import type { ChartState, FeatureFlags } from "@/chart/chartState.mjs";
import type { WithAxesOptions, WithEndLabelsOptions, WithGridOptions, WithLegendOptions, WithTitleOptions, WithTooltipOptions, WithZoomPanOptions } from "@/chart/chartTypes.mjs";
import type { ZoomBehaviorWithReset } from "@/interactivity/index.mjs";
import type { AnyScale, ChartConfig, CustomCallback, Margins, ScaleType } from "@/types/index.mjs";
import type { Dimensions } from "@/types/layoutTypes.mjs";

/** Computed layout dimensions — single source is @/types/layoutTypes */
export type { Dimensions } from "@/types/layoutTypes.mjs";

/**
 * Declaration of a single optional chart feature.
 *
 * Each entry encodes: which flag gates it, where options are stored on
 * ChartState, how to compare options for change detection, how to render it
 * (initial path and optionally zoom path), and which DOM selectors to clean
 * up when the feature is disabled.
 */
export interface FeatureDefinition<K extends FeatureKey> {
  /**
   * D3 event namespaces to unbind when this feature is disabled.
   * e.g. ["mousemove.tooltip", "mouseleave.tooltip"].
   * These are cleared by calling `selection.on(namespace, null)`.
   */
  readonly clearEvents?: readonly string[];
  /** CSS selectors for DOM cleanup (passed to clearOptionalNodes) */
  readonly clearSelectors: readonly string[];
  /** Which boolean flag on FeatureFlags controls this feature */
  readonly flagKey: keyof FeatureFlags;
  /** Shallow-equality check for the feature's options */
  readonly isEqual: (a: unknown, b: unknown) => boolean;
  readonly key: K;
  /**
   * Zoom-path render — called inside the zoom behavior callback.
   * Omit/leave undefined to exclude the feature from zoom re-renders.
   * The zoom callback is built in renderChart; only axes, grid, points,
   * and line participate in the zoom path (title/legend/tooltip/custom
   * are intentionally excluded).
   */
  readonly onZoomRedraw?: (
    ctx: FeatureRenderContext<unknown>,
    dims: Dimensions,
    newX: AnyScale,
    newY: AnyScale,
  ) => void;
  /** Which field on ChartState holds this feature's options */
  readonly optionsKey: keyof ChartState<unknown>;
  /** Initial-path render — called during renderChart main flow */
  readonly render: (ctx: FeatureRenderContext<unknown>, dims: Dimensions) => void;
}

/** Discriminated union key for all registered features */
export type FeatureKey =
  | "axes" | "custom" | "endLabels" | "grid"
  | "legend" | "points" | "title"
  | "tooltip" | "zoomPan";

/** Options type per feature — discriminated union */
export type FeatureOptionsMap = {
  axes: WithAxesOptions;
  custom: CustomCallback | null;
  endLabels: null | WithEndLabelsOptions;
  grid: WithGridOptions;
  legend: null | WithLegendOptions;
  points: null;
  title: null | WithTitleOptions;
  tooltip: WithTooltipOptions;
  zoomPan: WithZoomPanOptions;
};

/** Context required by FeatureDefinition.render */
export interface FeatureRenderContext<T> {
  readonly allSeriesExtents: Readonly<{
    readonly xDomain: readonly [unknown, unknown];
    readonly yDomain: readonly [number, number];
  }>;
  readonly bounds: import("@/types/index.mjs").BoundsSelection;
  readonly callbacks: RenderCallbacks;
  readonly clipPathId: string;
  readonly config: ChartConfig<T>;
  readonly container: HTMLElement;
  /** Clip-path content group — the proper target for grid/points rendering */
  readonly content: import("@/types/index.mjs").BoundsSelection;
  readonly flags: FeatureFlags;
  readonly margins: Margins;
  readonly reducedMotion: boolean;
  readonly resolvedCurve: import("d3").CurveFactory;
  readonly state: ChartState<unknown>;
  readonly svg: import("@/types/index.mjs").SVGSelection;
  readonly xScale: AnyScale;
  readonly xType: ScaleType;
  readonly yLabel?: string;
  readonly yScale: AnyScale;
}

/** Callbacks exposed by the chart renderer for lifecycle notifications */
export interface RenderCallbacks {
  readonly onCustomCleanupChange: (cleanup: (() => void) | null) => void;
  readonly onZoomBehaviorChange: (
    zoomBehavior: null | ZoomBehaviorWithReset,
  ) => void;
}
