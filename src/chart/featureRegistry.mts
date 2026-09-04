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
import type { AnyScale, ChartConfig, CustomCallback, Margins, ScaleType } from "@/types/index.mjs";

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
interface RenderCallbacks {
  readonly onCustomCleanupChange: (cleanup: (() => void) | null) => void;
  readonly onZoomBehaviorChange: (
    zoomBehavior: import("@/interactivity/index.mjs").ZoomBehaviorWithReset | null,
  ) => void;
}

// ─── Registry ────────────────────────────────────────────────────────────────

import { renderXAxisLabel, renderYAxisLabel } from "@/components/axisLabel.mjs";
import { renderXGrid, renderYGrid } from "@/components/grid.mjs";
import { renderLegend } from "@/components/legend.mjs";
import { renderLine } from "@/components/line.mjs";
import { renderPoints } from "@/components/points.mjs";
import { renderTitle } from "@/components/title.mjs";
import { renderXAxis } from "@/components/xAxis.mjs";
import { renderYAxis } from "@/components/yAxis.mjs";
import { addTooltip } from "@/interactivity/tooltip.mjs";
import { addZoomPan } from "@/interactivity/zoomPan.mjs";

// ─── File-local helpers ───────────────────────────────────────────────────────

type TickFormat = (domainValue: import("d3").AxisDomain, index: number) => string;

const resolveEffectiveXTickFormat = (
  xType: ScaleType,
  axesOptions: WithAxesOptions,
): TickFormat | undefined =>
  xType === "time" && axesOptions.timeTickFormat !== undefined
    ? typeof axesOptions.timeTickFormat === "string"
      ? (timeFormat(axesOptions.timeTickFormat) as TickFormat)
      : (axesOptions.timeTickFormat as TickFormat)
    : axesOptions.xTickFormat;

const renderGridScales = (
  content: import("@/types/index.mjs").BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
  gridOptions: WithGridOptions,
): void => {
  const { showX = true, showY = true } = gridOptions;
  if (showX) { content.call(renderXGrid, xScale, yScale); }
  else { content.selectAll("line.grid-x").remove(); }
  if (showY) { content.call(renderYGrid, xScale, yScale); }
  else { content.selectAll("line.grid-y").remove(); }
};

const renderPointsAt = (
  ctx: FeatureRenderContext<unknown>,
  xScale: AnyScale,
  yScale: AnyScale,
): void => {
  renderPoints(ctx.content, ctx.state.currentSeries, xScale, yScale, ctx.config.xSerie.accessor);
};

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
  isEqual: (a: unknown, b: unknown): boolean => {
    const pa = a as WithAxesOptions;
    const pb = b as WithAxesOptions;
    const prevX = pa.xTickCount ?? 5;
    const prevY = pa.yTickCount ?? 5;
    const nextX = pb.xTickCount ?? 5;
    const nextY = pb.yTickCount ?? 5;
    return (
      prevX === nextX &&
      pa.xTickFormat === pb.xTickFormat &&
      prevY === nextY &&
      pa.yTickFormat === pb.yTickFormat
    );
  },
  key: "axes",
  onZoomRedraw: (ctx, dims, newX, newY) => {
    if (!ctx.flags.hasAxes) return;
    const { xTickCount, yTickCount, yTickFormat } = ctx.state.axesOptions;
    const effectiveXTickFormat = resolveEffectiveXTickFormat(ctx.xType, ctx.state.axesOptions);
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
    const { xTickCount, yTickCount, yTickFormat } = ctx.state.axesOptions;
    const effectiveXTickFormat = resolveEffectiveXTickFormat(ctx.xType, ctx.state.axesOptions);
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
  isEqual: (a: unknown, b: unknown): boolean => {
    const pa = a as WithGridOptions;
    const pb = b as WithGridOptions;
    return (
      (pa.showX ?? true) === (pb.showX ?? true) &&
      (pa.showY ?? true) === (pb.showY ?? true)
    );
  },
  key: "grid",
  onZoomRedraw: (ctx, _dims, newX, newY) => {
    if (!ctx.flags.hasGrid) return;
    renderGridScales(ctx.content, newX, newY, ctx.state.gridOptions as WithGridOptions);
  },

  optionsKey: "gridOptions",

  render: (ctx, _dims) => {
    if (!ctx.flags.hasGrid) return;
    renderGridScales(ctx.content, ctx.xScale, ctx.yScale, ctx.state.gridOptions as WithGridOptions);
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

/**
 * Tooltip feature definition.
 *
 * - Options: WithTooltipOptions { formatX?, formatY?, stylesheetUrl?, tooltipHtml? }
 * - Comparator: areTooltipOptionsEqual
 * - Zoom-path: excluded (tooltip does not re-render on zoom)
 * - DOM cleanup: line.tooltip-cursor, circle.tooltip-dot; event listeners: mousemove.tooltip, mouseleave.tooltip
 */
export const tooltipDef: FeatureDefinition<"tooltip"> = {
  clearEvents: ["mousemove.tooltip", "mouseleave.tooltip"],
  clearSelectors: ["line.tooltip-cursor", "circle.tooltip-dot"],
  flagKey: "hasTooltip",
  isEqual: (a: unknown, b: unknown): boolean => {
    const pa = a as WithTooltipOptions;
    const pb = b as WithTooltipOptions;
    return (
      pa.formatX === pb.formatX &&
      pa.formatY === pb.formatY &&
      pa.stylesheetUrl === pb.stylesheetUrl &&
      pa.tooltipHtml === pb.tooltipHtml
    );
  },
  key: "tooltip",
  optionsKey: "tooltipOptions",
  render: (ctx, dims) => {
    if (!ctx.flags.hasTooltip) return;
    // addTooltip is called directly (not via .call) since it needs the boundsGroup as first arg
    addTooltip<unknown>(
      ctx.bounds,
      ctx.state.currentSeries,
      ctx.xScale,
      ctx.yScale,
      ctx.config.xSerie.accessor,
      {
        ...ctx.state.tooltipOptions,
        innerHeight: dims.innerHeight,
        innerWidth: dims.innerWidth,
      },
    );
  },
};

/**
 * Zoom/Pan feature definition — the zoom dispatch trigger.
 *
 * - Options: WithZoomPanOptions { onZoom?, scaleExtent? }
 * - Comparator: areZoomPanOptionsEqual
 * - Zoom-path: zoomPan IS the trigger; no onZoomRedraw of its own
 * - DOM cleanup: no selectors; event cleanup via svg.on(".zoom", null)
 */
export const zoomPanDef: FeatureDefinition<"zoomPan"> = {
  clearEvents: [".zoom"],
  clearSelectors: [],
  flagKey: "hasZoomPan",
  isEqual: (a: unknown, b: unknown): boolean => {
    const pa = a as import("@/chart/chartTypes.mjs").WithZoomPanOptions;
    const pb = b as import("@/chart/chartTypes.mjs").WithZoomPanOptions;
    if (pa.onZoom !== pb.onZoom) return false;
    const prevExtent = pa.scaleExtent;
    const nextExtent = pb.scaleExtent;
    if (prevExtent === nextExtent) return true;
    if (prevExtent === undefined || nextExtent === undefined) return false;
    return prevExtent[0] === nextExtent[0] && prevExtent[1] === nextExtent[1];
  },
  key: "zoomPan",
  optionsKey: "zoomPanOptions",
  render: (ctx, dims) => {
    if (!ctx.flags.hasZoomPan) return;
    ctx.svg.on(".zoom", null);
    const zoomBehavior = addZoomPan(ctx.svg, {
      innerHeight: dims.innerHeight,
      innerWidth: dims.innerWidth,
      margins: ctx.margins,
      onZoom:
        ctx.state.zoomPanOptions.onZoom ??
        ((newX: AnyScale, newY: AnyScale): void => {
          // Registry-driven zoom dispatch
          for (const feature of FEATURE_REGISTRY) {
            if (ctx.flags[feature.flagKey] && feature.onZoomRedraw) {
              feature.onZoomRedraw(
                { ...ctx, allSeriesExtents: ctx.allSeriesExtents } as FeatureRenderContext<unknown>,
                dims,
                newX,
                newY,
              );
            }
          }
          // Line re-render is NOT in the registry — re-render line directly
          renderLine<unknown>(
            ctx.content,
            ctx.state.currentSeries,
            newX,
            newY,
            ctx.config.xSerie.accessor,
            { curve: ctx.resolvedCurve, reducedMotion: ctx.reducedMotion },
          );
        }),
      scaleExtent: ctx.state.zoomPanOptions.scaleExtent,
      xScale: ctx.xScale,
      yScale: ctx.yScale,
    });
    ctx.callbacks.onZoomBehaviorChange(zoomBehavior);
  },
};

/**
 * Custom callback feature definition — arbitrary user-rendered content.
 *
 * - Options: CustomCallback function
 * - Comparator: () => true (no options to compare; callback identity checked elsewhere)
 * - Zoom-path: excluded (custom does not re-render on zoom)
 * - DOM cleanup: none (custom manages its own DOM)
 */
export const customDef: FeatureDefinition<"custom"> = {
  clearSelectors: [],
  flagKey: "hasCustom",
  isEqual: () => true,
  key: "custom",
  optionsKey: "customCallback",
  render: (ctx, dims) => {
    if (!ctx.state.customCallback || !ctx.flags.hasCustom) return;
    const customCtx = {
      bounds: ctx.bounds,
      content: ctx.content,
      dims,
      svg: ctx.svg,
      xScale: ctx.xScale,
      yScale: ctx.yScale,
    };
    ctx.state.customCleanup?.();
    const cleanup = ctx.state.customCallback(customCtx);
    ctx.callbacks.onCustomCleanupChange(typeof cleanup === "function" ? cleanup : null);
  },
};

/** Ordered registry — the array order IS the render sequence */
export const FEATURE_REGISTRY: readonly FeatureDefinition<FeatureKey>[] = [
  axesDef,
  gridDef,
  titleDef,
  legendDef,
  tooltipDef,
  zoomPanDef,
  customDef,
  {
    clearSelectors: ["g.point-series"],
    flagKey: "hasPoints",
    isEqual: () => true,
    key: "points",
    onZoomRedraw: (ctx, _dims, newX, newY) => {
      if (!ctx.flags.hasPoints) return;
      renderPointsAt(ctx, newX, newY);
    },

    optionsKey: "hasPoints",

    render: (ctx) => {
      if (!ctx.flags.hasPoints) return;
      renderPointsAt(ctx, ctx.xScale, ctx.yScale);
    },
  },
];
