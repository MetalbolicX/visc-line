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

import { timeFormat } from "d3";

import type { ChartState, FeatureFlags } from "@/chart/chartState.mjs";
import type { WithAxesOptions, WithGridOptions, WithLegendOptions, WithTitleOptions, WithTooltipOptions, WithZoomPanOptions } from "@/chart/chartTypes.mjs";
import type { AnyScale, ChartConfig, CustomCallback, Margins, ScaleType, SVGSelection } from "@/types/index.mjs";

import { LEGEND_TOP_OFFSET, LEGEND_WIDTH } from "@/chart/chartConstants.mjs";

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

import { areAxesOptionsEqual, areGridOptionsEqual } from "@/chart/optionComparators.mjs";
import { renderXAxisLabel, renderYAxisLabel } from "@/components/axisLabel.mjs";
import { renderXGrid, renderYGrid } from "@/components/grid.mjs";
import { renderLegend } from "@/components/legend.mjs";
import { renderPoints } from "@/components/points.mjs";
import { renderTitle } from "@/components/title.mjs";
import { renderXAxis } from "@/components/xAxis.mjs";
import { renderYAxis } from "@/components/yAxis.mjs";

/**
 * Axes feature definition.
 *
 * - Options: WithAxesOptions { xTickCount?, xTickFormat?, yTickCount?, yTickFormat?, timeTickFormat? }
 * - Comparator: areAxesOptionsEqual
 * - Zoom-path: participates (re-renders on zoom)
 * - DOM cleanup: g.x-axis, g.y-axis, text.x-axis-label, text.y-axis-label
 */
export const axesDef: FeatureDefinition<"axes"> = {
  clearSelectors: ["g.x-axis, g.y-axis", "text.x-axis-label, text.y-axis-label"],
  flagKey: "hasAxes",
  isEqual: (a: unknown, b: unknown): boolean =>
    areAxesOptionsEqual(a as Parameters<typeof areAxesOptionsEqual>[0], b as Parameters<typeof areAxesOptionsEqual>[1]),
  key: "axes",
  onZoomRedraw: (ctx, dims, newX, newY) => {
    if (!ctx.flags.hasAxes) return;
    const { timeTickFormat, xTickCount, xTickFormat, yTickCount, yTickFormat } =
      ctx.state.axesOptions;
    const effectiveXTickFormat:
      | ((domainValue: import("d3").AxisDomain, index: number) => string)
      | undefined =
      ctx.xType === "time" && timeTickFormat !== undefined
        ? typeof timeTickFormat === "string"
          ? (timeFormat(timeTickFormat) as (domainValue: import("d3").AxisDomain, index: number) => string)
          : (timeTickFormat as (domainValue: import("d3").AxisDomain, index: number) => string)
        : xTickFormat;
    ctx.bounds.call(renderXAxis, newX, dims.innerHeight, {
      tickCount: xTickCount,
      tickFormat: effectiveXTickFormat,
    });
    ctx.bounds.call(renderYAxis, newY, {
      tickCount: yTickCount,
      tickFormat: yTickFormat,
    });
  },

  optionsKey: "axesOptions",

  render: (ctx, dims) => {
    if (!ctx.flags.hasAxes) return;
    const { timeTickFormat, xTickCount, xTickFormat, yTickCount, yTickFormat } =
      ctx.state.axesOptions;
    const effectiveXTickFormat:
      | ((domainValue: import("d3").AxisDomain, index: number) => string)
      | undefined =
      ctx.xType === "time" && timeTickFormat !== undefined
        ? typeof timeTickFormat === "string"
          ? (timeFormat(timeTickFormat) as (domainValue: import("d3").AxisDomain, index: number) => string)
          : (timeTickFormat as (domainValue: import("d3").AxisDomain, index: number) => string)
        : xTickFormat;
    ctx.bounds
      .call(renderXAxis, ctx.xScale, dims.innerHeight, {
        tickCount: xTickCount,
        tickFormat: effectiveXTickFormat,
      })
      .call(renderYAxis, ctx.yScale, {
        tickCount: yTickCount,
        tickFormat: yTickFormat,
      });
    ctx.svg
      .call(renderXAxisLabel, {
        innerHeight: dims.innerHeight,
        innerWidth: dims.innerWidth,
        label: ctx.config.xSerie.label,
        margins: dims.margins,
      })
      .call(renderYAxisLabel, {
        innerHeight: dims.innerHeight,
        innerWidth: dims.innerWidth,
        label: ctx.yLabel ?? ctx.config.ySeries[0]?.label ?? "Value",
        margins: dims.margins,
      });
  },
};

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

/**
 * Title feature definition.
 *
 * - Options: WithTitleOptions { title }
 * - Comparator: areTitleOptionsEqual
 * - Zoom-path: excluded (title does not re-render on zoom)
 * - DOM cleanup: text.chart-title
 */
export const titleDef: FeatureDefinition<"title"> = {
  clearSelectors: ["text.chart-title"],
  flagKey: "hasTitle",
  isEqual: (a: unknown, b: unknown): boolean => {
    const pa = a as null | WithTitleOptions;
    const pb = b as WithTitleOptions;
    return pa?.title === pb.title;
  },
  key: "title",
  optionsKey: "titleOptions",
  render: (ctx, dims) => {
    if (!ctx.flags.hasTitle || !ctx.state.titleOptions) return;
    ctx.svg.call(renderTitle, {
      margins: dims.margins,
      title: ctx.state.titleOptions.title,
      width: dims.width,
    });
  },
};

/**
 * Legend feature definition.
 *
 * - Options: WithLegendOptions { interactive?, items?, onToggle? }
 * - Comparator: areLegendOptionsEqual
 * - Zoom-path: excluded (legend does not re-render on zoom)
 * - DOM cleanup: g.legend
 */
export const legendDef: FeatureDefinition<"legend"> = {
  clearSelectors: ["g.legend"],
  flagKey: "hasLegend",
  isEqual: (a: unknown, b: unknown): boolean => {
    const pa = a as null | WithLegendOptions;
    const pb = b as WithLegendOptions;
    if (!pa) return false;
    if ((pa.interactive ?? false) !== (pb.interactive ?? false)) return false;
    if (pa.onToggle !== pb.onToggle) return false;
    const prevItems = pa.items;
    const nextItems = pb.items;
    if (prevItems == null && nextItems == null) return true;
    if (prevItems == null || nextItems == null) return false;
    if (prevItems.length !== nextItems.length) return false;
    for (const [index, prevItem] of prevItems.entries()) {
      const nextItem = nextItems[index];
      if (!nextItem) return false;
      if (prevItem.color !== nextItem.color || prevItem.label !== nextItem.label) return false;
    }
    return true;
  },
  key: "legend",
  optionsKey: "legendOptions",
  render: (ctx, dims) => {
    if (!ctx.flags.hasLegend || !ctx.state.legendOptions) return;
    const derivedItems = ctx.state.allSeries.map((s, i) => ({
      color: s.stroke ?? `var(--vl-palette-${String(i)}, steelblue)`,
      label: s.label,
    }));
    ctx.svg.call(renderLegend, {
      interactive: ctx.state.legendOptions.interactive,
      items: ctx.state.legendOptions.items ?? derivedItems,
      onToggle: ctx.state.legendOptions.onToggle,
      visibleLabels: ctx.state.visibleLabels,
      x: ctx.margins.left + dims.innerWidth - LEGEND_WIDTH,
      y: ctx.margins.top + LEGEND_TOP_OFFSET,
    });
  },
};

/** Ordered registry — the array order IS the render sequence */
export const FEATURE_REGISTRY: readonly FeatureDefinition<FeatureKey>[] = [
  axesDef,
  gridDef,
  titleDef,
  legendDef,
  {
    clearSelectors: ["g.point-series"],
    flagKey: "hasPoints",
    isEqual: () => true,
    key: "points",
    onZoomRedraw: (ctx) => {
      if (!ctx.flags.hasPoints) return;
      renderPoints(
        ctx.content,
        ctx.state.currentSeries,
        ctx.xScale,
        ctx.yScale,
        ctx.config.xSerie.accessor,
      );
    },

    optionsKey: "hasPoints",

    render: (ctx) => {
      if (!ctx.flags.hasPoints) return;
      renderPoints(
        ctx.content,
        ctx.state.currentSeries,
        ctx.xScale,
        ctx.yScale,
        ctx.config.xSerie.accessor,
      );
    },
  },
];
