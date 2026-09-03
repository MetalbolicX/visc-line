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
/* eslint-disable @typescript-eslint/naming-convention -- showX/showY match public API types */

import type { ChartState, FeatureFlags } from "@/chart/chartState.mjs";
import type { WithAxesOptions, WithGridOptions, WithLegendOptions, WithTitleOptions, WithTooltipOptions, WithZoomPanOptions } from "@/chart/chartTypes.mjs";
import type { AnyScale, ChartConfig, CustomCallback, Margins, ScaleType, SVGSelection } from "@/types/index.mjs";

// ─── Context types ────────────────────────────────────────────────────────────

/** Computed layout dimensions — derived in renderChart before feature render loop */
export interface Dimensions {
  readonly height: number;
  readonly innerHeight: number;
  readonly innerWidth: number;
  readonly margins: Margins;
  readonly width: number;
}

/**
 * Declaration of a single optional chart feature.
 *
 * Each entry encodes: which flag gates it, where options are stored on
 * ChartState, how to compare options for change detection, how to render it
 * (initial path and optionally zoom path), and which DOM selectors to clean
 * up when the feature is disabled.
 */
export interface FeatureDefinition<K extends FeatureKey> {
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

// ─── Feature key ─────────────────────────────────────────────────────────────

/** Discriminated union key for all registered features */
export type FeatureKey =
  | "axes" | "custom" | "grid"
  | "legend" | "points" | "title"
  | "tooltip" | "zoomPan";

/** Options type per feature — discriminated union */
export type FeatureOptionsMap = {
  axes: WithAxesOptions;
  custom: CustomCallback | null;
  grid: WithGridOptions;
  legend: null | WithLegendOptions;
  points: null;
  title: null | WithTitleOptions;
  tooltip: WithTooltipOptions;
  zoomPan: WithZoomPanOptions;
};

// ─── FeatureDefinition ───────────────────────────────────────────────────────

/** Context required by FeatureDefinition.render */
export interface FeatureRenderContext<T> {
  readonly allSeriesExtents: Readonly<{
    readonly xDomain: readonly [unknown, unknown];
    readonly yDomain: readonly [number, number];
  }>;
  readonly bounds: import("@/types/index.mjs").BoundsSelection;
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
  readonly svg: SVGSelection;
  readonly xScale: AnyScale;
  readonly xType: ScaleType;
  readonly yLabel?: string;
  readonly yScale: AnyScale;
}

// ─── Registry ────────────────────────────────────────────────────────────────

import { areGridOptionsEqual } from "@/chart/optionComparators.mjs";
import { renderXGrid, renderYGrid } from "@/components/grid.mjs";

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
  clearSelectors: ["line.grid-x", "line.grid-y"],
  flagKey: "hasGrid",
  isEqual: areGridOptionsEqual,
  key: "grid",
  onZoomRedraw: (ctx, _dims, newX, newY) => {
    if (!ctx.flags.hasGrid) return;
    const { showX = true, showY = true } = ctx.state.gridOptions as WithGridOptions;
    if (showX) {
      ctx.content.call(renderXGrid, newX, newY);
    } else {
      ctx.content.selectAll("line.grid-x").remove();
    }
    if (showY) {
      ctx.content.call(renderYGrid, newX, newY);
    } else {
      ctx.content.selectAll("line.grid-y").remove();
    }
  },

  optionsKey: "gridOptions",

  render: (ctx, _dims) => {
    if (!ctx.flags.hasGrid) return;
    const { showX = true, showY = true } = ctx.state.gridOptions as WithGridOptions;
    if (showX) {
      ctx.content.call(renderXGrid, ctx.xScale, ctx.yScale);
    } else {
      ctx.content.selectAll("line.grid-x").remove();
    }
    if (showY) {
      ctx.content.call(renderYGrid, ctx.xScale, ctx.yScale);
    } else {
      ctx.content.selectAll("line.grid-y").remove();
    }
  },
};

/** Ordered registry — the array order IS the render sequence */
export const FEATURE_REGISTRY: readonly FeatureDefinition<FeatureKey>[] = [
  gridDef,
];
