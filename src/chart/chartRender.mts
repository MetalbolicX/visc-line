import type { CurveFactory } from "d3";

import type {
  AnyScale,
  BoundsSelection,
  ChartConfig,
  CustomContext,
  SVGSelection,
  ScaleType,
} from "@/types/index.mjs";

import { renderContentGroup } from "@/components/contentGroup.mjs";
import { renderLegend } from "@/components/legend.mjs";
import { renderLine } from "@/components/line.mjs";
import { renderPoints } from "@/components/points.mjs";
import { renderTitle } from "@/components/title.mjs";
import { renderXAxis } from "@/components/xAxis.mjs";
import { renderXAxisLabel, renderYAxisLabel } from "@/components/axisLabel.mjs";
import { renderXGrid, renderYGrid } from "@/components/grid.mjs";
import { renderYAxis } from "@/components/yAxis.mjs";
import { addTooltip } from "@/interactivity/tooltip.mjs";
import { addZoomPan } from "@/interactivity/zoomPan.mjs";
import type { ZoomBehaviorWithReset } from "@/interactivity/index.mjs";
import {
  createScales,
  getDimensions,
  getMultiSeriesExtents,
} from "@/services/index.mjs";
import { LEGEND_TOP_OFFSET, LEGEND_WIDTH } from "@/chart/chartConstants.mjs";
import { clearOptionalNodes } from "@/chart/chartLifecycle.mjs";
import type { ChartState, FeatureFlags } from "@/chart/chartState.mjs";
import type { Margins } from "@/types/index.mjs";

/**
 * Context required to render a chart instance.
 *
 * Provides all inputs and handles needed by the rendering pipeline: DOM
 * attachment points (svg, bounds, container), visual configuration, runtime
 * state and feature flags. Implementations should treat this object as
 * read-only; rendering mutates the DOM but does not change the context.
 *
 * @template T - data series point type used by the chart (matches ChartConfig<T>)
 * @internal
 * @property {BoundsSelection} bounds - Group selection used as the drawing
 *   origin for axes/content (already translated by margins).
 * @property {ChartConfig<T>} config - Static chart configuration (series
 *   definitions, labels, accessors).
 * @property {HTMLElement} container - Outer container element used to compute
 *   layout (width/height) and attach the SVG.
 * @property {ChartState<T>} state - Mutable runtime state (currentSeries,
 *   tooltip/title/legend/zoom options, isDisposed flag). The renderer will read
 *   from this but will not mutate state directly.
 * @property {FeatureFlags} flags - Feature toggles controlling which
 *   components (axes, grid, points, legend, tooltip, zoom/pan, title) are
 *   rendered.
 * @property {Margins} margins - Resolved margins applied to layout calculations.
 * @property {CurveFactory} resolvedCurve - D3 curve factory used when drawing lines.
 * @property {SVGSelection} svg - Root SVG selection for attaching top-level
 *   elements (title, legend, axis labels) and global event handlers.
 * @property {ScaleType} xType - Type of the X scale (used when creating scales).
 * @property {boolean} reducedMotion - When true, animations/transitions should be minimized.
 */
export interface RenderContext<T> {
  readonly bounds: BoundsSelection;
  readonly clipPathId: string;
  readonly config: ChartConfig<T>;
  readonly container: HTMLElement;
  readonly state: ChartState<T>;
  readonly flags: FeatureFlags;
  readonly margins: Margins;
  readonly resolvedCurve: CurveFactory;
  readonly svg: SVGSelection;
  readonly xType: ScaleType;
  readonly reducedMotion: boolean;
  readonly yLabel?: string;
}

/**
 * Callbacks invoked by the renderer to notify the host about lifecycle events.
 *
 * Currently only used to communicate the active zoom behavior so the owner can
 * keep a reference (e.g. to reset or dispose it) when re-rendering or tearing
 * down the chart.
 *
 * @internal
 */
export interface RenderCallbacks {
  /**
   * Invoked whenever the renderer creates or clears the zoom behavior.
   * @param {ZoomBehaviorWithReset | null} zoomBehavior - Newly active zoom
   *   behavior, or null when the renderer removed any zoom handlers.
   */
  readonly onZoomBehaviorChange: (
    zoomBehavior: null | ZoomBehaviorWithReset,
  ) => void;
  /**
   * Invoked whenever the custom cleanup function changes.
   * @param {(() => void) | null} cleanup - New cleanup function, or null to clear.
   */
  readonly onCustomCleanupChange: (cleanup: (() => void) | null) => void;
}

/**
 * Render the entire chart for a given context.
 *
 * This function drives the rendering pipeline: it computes layout, creates
 * scales, draws lines/points, optionally renders axes, grid, title and legend,
 * and wires up interactivity such as tooltip and zoom/pan.
 *
 * Side effects:
 * - Mutates the provided SVG/bounds DOM by appending/updating elements.
 * - Attaches event listeners (zoom/pan); when creating a zoom behavior the
 *   renderer will call `callbacks.onZoomBehaviorChange` with the new behavior.
 * - When clearing the chart the renderer will call `callbacks.onZoomBehaviorChange(null)`.
 *
 * The function returns early if `context.state.isDisposed` is true.
 *
 * @template T - type of points in the series data
 * @param {RenderContext<T>} context - Rendering inputs and runtime state
 * @param {RenderCallbacks} callbacks - Lifecycle callbacks the renderer will call
 * @returns {void}
 * @example
 * ```ts
 * // Typical usage: called from a chart manager after state/config changes
 * renderChart(context, { onZoomBehaviorChange: (z) => (zoomRef = z) });
 * ```
 */
export const renderChart = <T,>(
  context: RenderContext<T>,
  callbacks: RenderCallbacks,
): void => {
  if (context.state.isDisposed) return;

  const dims = getDimensions(context.container, context.margins);

  const content = renderContentGroup(context.bounds, context.svg, {
    clipPathId: context.clipPathId,
    innerHeight: dims.innerHeight,
    innerWidth: dims.innerWidth,
  });

  const { xDomain, yDomain } = getMultiSeriesExtents(
    context.state.currentSeries,
    context.config.xSerie.accessor,
  );

  const [visibleXMin, visibleXMax] = xDomain;
  const [visibleYMin, visibleYMax] = yDomain;
  const xDomainToUse =
    visibleXMin !== undefined && visibleXMax !== undefined
      ? xDomain
      : context.state.allSeriesExtents.xDomain;
  const isSingleSeriesVisible = context.state.currentSeries.length === 1;
  const yDomainToUse = isSingleSeriesVisible &&
    visibleYMin !== undefined &&
    visibleYMax !== undefined
    ? yDomain
    : context.state.allSeriesExtents.yDomain;

  const { xScale, yScale } = createScales({
    innerHeight: dims.innerHeight,
    innerWidth: dims.innerWidth,
    xDomain: xDomainToUse as Parameters<typeof createScales>[0]["xDomain"],
    xType: context.xType,
    yDomain: yDomainToUse,
  });

  renderLine<T>(
    content,
    context.state.currentSeries,
    xScale,
    yScale,
    context.config.xSerie.accessor,
    { curve: context.resolvedCurve, reducedMotion: context.reducedMotion },
  );

  if (context.flags.hasAxes) {
    const {
      xTickCount,
      xTickFormat,
      yTickCount,
      yTickFormat,
    } = context.state.axesOptions;

    context.bounds
      .call(renderXAxis, xScale, dims.innerHeight, {
        tickCount: xTickCount,
        tickFormat: xTickFormat,
      })
      .call(renderYAxis, yScale, {
        tickCount: yTickCount,
        tickFormat: yTickFormat,
      });

    context.svg
      .call(renderXAxisLabel, {
        innerHeight: dims.innerHeight,
        innerWidth: dims.innerWidth,
        label: context.config.xSerie.label,
        margins: dims.margins,
      })
      .call(renderYAxisLabel, {
        innerHeight: dims.innerHeight,
        innerWidth: dims.innerWidth,
        label: context.yLabel ?? context.config.ySeries[0]?.label ?? "Value",
        margins: dims.margins,
      });
  }

  if (context.flags.hasGrid) {
    const { showX = true, showY = true } = context.state.gridOptions;
    if (showX) {
      content.call(renderXGrid, xScale, yScale);
    } else {
      content.selectAll("line.grid-x").remove();
    }
    if (showY) {
      content.call(renderYGrid, xScale, yScale);
    } else {
      content.selectAll("line.grid-y").remove();
    }
  }

  if (context.flags.hasPoints) {
    renderPoints<T>(
      content,
      context.state.currentSeries,
      xScale,
      yScale,
      context.config.xSerie.accessor,
    );
  }

  if (context.flags.hasTooltip) {
    addTooltip<T>(
      context.bounds,
      context.state.currentSeries,
      xScale,
      yScale,
      context.config.xSerie.accessor,
      {
        ...context.state.tooltipOptions,
        innerHeight: dims.innerHeight,
        innerWidth: dims.innerWidth,
      },
    );
  }

  if (context.flags.hasTitle && context.state.titleOptions) {
    context.svg.call(renderTitle, {
      margins: dims.margins,
      title: context.state.titleOptions.title,
      width: dims.width,
    });
  }

  if (context.flags.hasLegend && context.state.legendOptions) {
    const derivedItems = context.state.allSeries.map((s, i) => ({
      color: s.stroke ?? `var(--vl-palette-${String(i)}, steelblue)`,
      label: s.label,
    }));
    context.svg.call(renderLegend, {
      items: context.state.legendOptions.items ?? derivedItems,
      interactive: context.state.legendOptions.interactive,
      onToggle: context.state.legendOptions.onToggle,
      visibleLabels: context.state.visibleLabels,
      x: context.margins.left + dims.innerWidth - LEGEND_WIDTH,
      y: context.margins.top + LEGEND_TOP_OFFSET,
    });
  }

  if (context.flags.hasZoomPan) {
    context.svg.on(".zoom", null);
    const zoomBehavior = addZoomPan(context.svg, {
      innerHeight: dims.innerHeight,
      innerWidth: dims.innerWidth,
      scaleExtent: context.state.zoomPanOptions.scaleExtent,
      onZoom:
        context.state.zoomPanOptions.onZoom ??
        ((newX: AnyScale, newY: AnyScale): void => {
          if (context.flags.hasAxes) {
            const {
              xTickCount,
              xTickFormat,
              yTickCount,
              yTickFormat,
            } = context.state.axesOptions;
            renderXAxis(context.bounds, newX, dims.innerHeight, {
              tickCount: xTickCount,
              tickFormat: xTickFormat,
            });
            renderYAxis(context.bounds, newY, {
              tickCount: yTickCount,
              tickFormat: yTickFormat,
            });
          }

          if (context.flags.hasGrid) {
            const { showX = true, showY = true } = context.state.gridOptions;
            if (showX) {
              content.call(renderXGrid, newX, newY);
            } else {
              content.selectAll("line.grid-x").remove();
            }
            if (showY) {
              content.call(renderYGrid, newX, newY);
            } else {
              content.selectAll("line.grid-y").remove();
            }
          }

          renderLine<T>(
            content,
            context.state.currentSeries,
            newX,
            newY,
            context.config.xSerie.accessor,
            {
              curve: context.resolvedCurve,
              reducedMotion: context.reducedMotion,
            },
          );

          if (context.flags.hasPoints) {
            renderPoints<T>(
              content,
              context.state.currentSeries,
              newX,
              newY,
              context.config.xSerie.accessor,
            );
          }
        }),
      xScale,
      yScale,
    });

    callbacks.onZoomBehaviorChange(zoomBehavior);
  }

  if (context.state.customCallback && context.flags.hasCustom) {
    const customCtx: CustomContext = {
      bounds: context.bounds,
      content,
      dims,
      svg: context.svg,
      xScale,
      yScale,
    };
    context.state.customCleanup?.();
    const cleanup = context.state.customCallback(customCtx);
    callbacks.onCustomCleanupChange(typeof cleanup === "function" ? cleanup : null);
  }

  clearOptionalNodes(context.bounds, context.svg, context.flags, () => {
    callbacks.onZoomBehaviorChange(null);
  });
};
