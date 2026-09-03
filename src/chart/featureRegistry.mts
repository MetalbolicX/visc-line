/**
 * Feature registry — central declaration of all optional chart features.
 *
 * Each feature is declared once with its flag, options, comparator, render
 * behavior, zoom-path participation, and DOM cleanup selectors. The registry
 * drives `with*` method generation, `getFeatureFlags`, `clearOptionalNodes`,
 * and the render/zoom dispatch loops.
 *
 * @module featureRegistry
 * @internal
 */

import type { AnyScale, ChartConfig, CustomCallback, Margins, ScaleType, SVGSelection } from "@/types/index.mjs";
import type { ChartState, FeatureFlags } from "@/chart/chartState.mjs";
import type { WithAxesOptions, WithGridOptions, WithLegendOptions, WithTitleOptions, WithTooltipOptions, WithZoomPanOptions } from "@/chart/chartTypes.mjs";

// ─── Context types ────────────────────────────────────────────────────────────

/** Context required by FeatureDefinition.render */
export interface FeatureRenderContext<T> {
  readonly bounds: import("@/types/index.mjs").BoundsSelection;
  readonly config: ChartConfig<T>;
  readonly container: HTMLElement;
  readonly flags: FeatureFlags;
  readonly margins: Margins;
  readonly resolvedCurve: import("d3").CurveFactory;
  readonly state: ChartState<unknown>;
  readonly svg: SVGSelection;
  readonly xType: ScaleType;
  readonly yLabel?: string;
  readonly reducedMotion: boolean;
  readonly clipPathId: string;
  readonly xScale: AnyScale;
  readonly yScale: AnyScale;
  readonly allSeriesExtents: Readonly<{
    readonly xDomain: readonly [unknown, unknown];
    readonly yDomain: readonly [number, number];
  }>;
}

/** Computed layout dimensions — derived in renderChart before feature render loop */
export interface Dimensions {
  readonly width: number;
  readonly height: number;
  readonly innerWidth: number;
  readonly innerHeight: number;
  readonly margins: Margins;
}

// ─── Feature key ─────────────────────────────────────────────────────────────

/** Discriminated union key for all registered features */
export type FeatureKey =
  | "axes" | "grid" | "points"
  | "title" | "legend" | "tooltip"
  | "zoomPan" | "custom";

/** Options type per feature — discriminated union */
export type FeatureOptionsMap = {
  axes: WithAxesOptions;
  grid: WithGridOptions;
  points: null;
  title: WithTitleOptions | null;
  legend: WithLegendOptions | null;
  tooltip: WithTooltipOptions;
  zoomPan: WithZoomPanOptions;
  custom: CustomCallback | null;
};

// ─── FeatureDefinition ───────────────────────────────────────────────────────

/**
 * Declaration of a single optional chart feature.
 *
 * Each entry encodes: which flag gates it, where options are stored on
 * ChartState, how to compare options for change detection, how to render it
 * (initial path and optionally zoom path), and which DOM selectors to clean
 * up when the feature is disabled.
 */
export interface FeatureDefinition<K extends FeatureKey> {
  readonly key: K;
  /** Which boolean flag on FeatureFlags controls this feature */
  readonly flagKey: keyof FeatureFlags;
  /** Which field on ChartState holds this feature's options */
  readonly optionsKey: keyof ChartState<unknown>;
  /** Shallow-equality check for the feature's options */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly isEqual: (a: any, b: any) => boolean;
  /** Initial-path render — called during renderChart main flow */
  readonly render: (ctx: FeatureRenderContext<unknown>, dims: Dimensions) => void;
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
  /** CSS selectors for DOM cleanup (passed to clearOptionalNodes) */
  readonly clearSelectors: readonly string[];
}

// ─── Registry ────────────────────────────────────────────────────────────────

import { renderXGrid, renderYGrid } from "@/components/grid.mjs";
import { areGridOptionsEqual } from "@/chart/optionComparators.mjs";
import type { BoundsSelection } from "@/types/index.mjs";

/**
 * Grid feature definition — first migrated feature for prototype validation.
 *
 * Grid is the simplest feature to migrate:
 * - Options: WithGridOptions { showX?, showY? }
 * - Comparator: areGridOptionsEqual
 * - Zoom-path: participates (re-renders on zoom)
 * - DOM cleanup: line.grid-x, line.grid-y
 */
export const gridDef: FeatureDefinition<"grid"> = {
  key: "grid",
  flagKey: "hasGrid",
  optionsKey: "gridOptions",
  isEqual: areGridOptionsEqual,
  clearSelectors: ["line.grid-x", "line.grid-y"],

  render: (ctx, _dims) => {
    if (!ctx.flags.hasGrid) return;
    const { showX = true, showY = true } = ctx.state.gridOptions as WithGridOptions;
    if (showX) {
      (ctx.bounds as BoundsSelection).call(renderXGrid, ctx.xScale, ctx.yScale);
    } else {
      ctx.bounds.selectAll("line.grid-x").remove();
    }
    if (showY) {
      (ctx.bounds as BoundsSelection).call(renderYGrid, ctx.xScale, ctx.yScale);
    } else {
      ctx.bounds.selectAll("line.grid-y").remove();
    }
  },

  onZoomRedraw: (ctx, _dims, newX, newY) => {
    if (!ctx.flags.hasGrid) return;
    const { showX = true, showY = true } = ctx.state.gridOptions as WithGridOptions;
    if (showX) {
      (ctx.bounds as BoundsSelection).call(renderXGrid, newX, newY);
    } else {
      ctx.bounds.selectAll("line.grid-x").remove();
    }
    if (showY) {
      (ctx.bounds as BoundsSelection).call(renderYGrid, newX, newY);
    } else {
      ctx.bounds.selectAll("line.grid-y").remove();
    }
  },
};

/** Ordered registry — the array order IS the render sequence */
export const FEATURE_REGISTRY: readonly FeatureDefinition<FeatureKey>[] = [
  gridDef,
];
