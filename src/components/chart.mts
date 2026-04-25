import type { CurveFactory } from "d3";

import type {
  AnyScale,
  ChartConfig,
  CurvePreset,
  ProcessedSeries,
  Theme,
} from "@/types/index.mjs";
import type { Margins } from "@/types/index.mjs";

import { observeResize } from "@/accessibility/index.mjs";
import {
  renderBoundsGroup,
  renderContentGroup,
  renderLegend,
  renderLine,
  renderPoints,
  renderSVG,
  renderTitle,
  renderXAxis,
  renderXAxisLabel,
  renderXGrid,
  renderYAxis,
  renderYAxisLabel,
  renderYGrid,
} from "@/components/index.mjs";
import { addTooltip, addZoomPan } from "@/interactivity/index.mjs";
import type { ZoomBehaviorWithReset } from "@/interactivity/index.mjs";
import {
  createScales,
  getDimensions,
  getMultiSeriesExtents,
  processAllSeries,
} from "@/services/index.mjs";
import { defaultTheme } from "@/themes/index.mjs";
import { applyThemeCssVars, mergeTheme, resolveCurve } from "@/utils/index.mjs";

export interface WithTooltipOptions {
  readonly formatX?: (v: unknown) => string;
  readonly formatY?: (v: unknown) => string;
  readonly stylesheetUrl?: string;
}

export interface WithTitleOptions {
  readonly title: string;
}

export interface WithLegendOptions {
  readonly items: readonly Readonly<{ readonly color: string; readonly label: string }>[];
}

export interface WithZoomPanOptions {
  readonly onZoom?: (newX: AnyScale, newY: AnyScale) => void;
}

/**
 * A live, mounted chart handle returned by createChart.
 */
export interface ChartInstance<T> {
  readonly container: HTMLElement;
  readonly dispose: () => void;
  readonly series: readonly ProcessedSeries<T>[];
  readonly svg: ReturnType<typeof renderSVG>;
  readonly update: (newData: readonly T[]) => void;
  readonly withAxes: () => ChartInstance<T>;
  readonly withGrid: () => ChartInstance<T>;
  readonly withLegend: (options: WithLegendOptions) => ChartInstance<T>;
  readonly withPoints: () => ChartInstance<T>;
  readonly withTitle: (options: WithTitleOptions) => ChartInstance<T>;
  readonly withTooltip: (options?: WithTooltipOptions) => ChartInstance<T>;
  readonly withZoomPan: (options?: WithZoomPanOptions) => ChartInstance<T>;
}

export interface ChartOptions {
  readonly curve?: CurveFactory | CurvePreset;
  readonly margins?: Margins;
  readonly theme?: Partial<Theme>;
  readonly xType?: "linear" | "log" | "pow" | "time";
}

const DEFAULT_MARGINS: Margins = { bottom: 70, left: 55, right: 60, top: 50 };
const LEGEND_TOP_OFFSET = 12;
const LEGEND_WIDTH = 90;

const areTitleOptionsEqual = (
  a: null | WithTitleOptions,
  b: WithTitleOptions,
): boolean => a?.title === b.title;

const areLegendOptionsEqual = (
  a: null | WithLegendOptions,
  b: WithLegendOptions,
): boolean => {
  if (!a) return false;
  if (a.items.length !== b.items.length) return false;
  for (let index = 0; index < a.items.length; index += 1) {
    const left = a.items[index];
    const right = b.items[index];
    if (!left || !right) return false;
    if (left.color !== right.color || left.label !== right.label) return false;
  }
  return true;
};

const areTooltipOptionsEqual = (
  a: WithTooltipOptions,
  b: WithTooltipOptions,
): boolean =>
  a.formatX === b.formatX &&
  a.formatY === b.formatY &&
  a.stylesheetUrl === b.stylesheetUrl;

const areZoomPanOptionsEqual = (
  a: WithZoomPanOptions,
  b: WithZoomPanOptions,
): boolean => a.onZoom === b.onZoom;

/**
 * Create and mount a responsive SVG chart into the provided container.
 *
 * Base behavior renders only the non-optional layers (theme vars, svg,
 * bounds/content groups, and line series). Additional features are enabled
 * incrementally via fluent `with*` methods.
 */
export const createChart = <T,>(
  container: HTMLElement,
  config: ChartConfig<T>,
  {
    curve,
    margins = DEFAULT_MARGINS,
    theme,
    xType = "time",
  }: ChartOptions = {},
): ChartInstance<T> => {
  const resolvedTheme = mergeTheme(defaultTheme, theme);
  applyThemeCssVars(container, resolvedTheme);

  const svg = renderSVG(container);
  const bounds = renderBoundsGroup(svg, margins);

  const resolvedCurve = resolveCurve(curve ?? resolvedTheme.line.curve);
  const reducedMotion = resolvedTheme.accessibility?.reducedMotion ?? false;

  let hasAxes = false;
  let hasGrid = false;
  let hasPoints = false;
  let hasTooltip = false;
  let hasTitle = false;
  let hasLegend = false;
  let hasZoomPan = false;

  let titleOptions: null | WithTitleOptions = null;
  let legendOptions: null | WithLegendOptions = null;
  let tooltipOptions: WithTooltipOptions = {};
  let zoomPanOptions: WithZoomPanOptions = {};

  let zoomBehavior: null | ZoomBehaviorWithReset = null;
  let currentSeries = processAllSeries<T>(
    config.data,
    config.xSerie.accessor,
    config.ySeries,
  );
  let isDisposed = false;

  const clearOptionalNodes = (): void => {
    if (!hasAxes) {
      bounds.selectAll("g.x-axis, g.y-axis").remove();
      svg.selectAll("text.x-axis-label, text.y-axis-label").remove();
    }
    if (!hasGrid) {
      bounds.selectAll("line.grid-x, line.grid-y").remove();
    }
    if (!hasPoints) {
      bounds.selectAll("g.point-series").remove();
    }
    if (!hasTitle) {
      svg.selectAll("text.chart-title").remove();
    }
    if (!hasLegend) {
      svg.selectAll("g.legend").remove();
    }
    if (!hasTooltip) {
      bounds
        .on("mousemove.tooltip", null)
        .on("mouseleave.tooltip", null)
        .selectAll("line.tooltip-cursor, circle.tooltip-dot")
        .remove();
    }
    if (!hasZoomPan) {
      svg.on(".zoom", null);
      zoomBehavior = null;
    }
  };

  const cleanupAllEnhancements = (): void => {
    bounds
      .on("mousemove.tooltip", null)
      .on("mouseleave.tooltip", null)
      .selectAll("line.tooltip-cursor, circle.tooltip-dot")
      .remove();
    svg.on(".zoom", null);
    zoomBehavior = null;
  };

  const render = (): void => {
    if (isDisposed) return;

    const dims = getDimensions(container, margins);
    const content = renderContentGroup(bounds, svg, {
      innerHeight: dims.innerHeight,
      innerWidth: dims.innerWidth,
    });
    const { xDomain, yDomain } = getMultiSeriesExtents(
      currentSeries,
      config.xSerie.accessor,
    );
    const { xScale, yScale } = createScales({
      innerHeight: dims.innerHeight,
      innerWidth: dims.innerWidth,
      xDomain: xDomain as Parameters<typeof createScales>[0]["xDomain"],
      xType,
      yDomain,
    });

    renderLine<T>(
      content,
      currentSeries,
      xScale,
      yScale,
      config.xSerie.accessor,
      { curve: resolvedCurve, reducedMotion },
    );

    if (hasAxes) {
      bounds
        .call(renderXAxis, xScale, dims.innerHeight)
        .call(renderYAxis, yScale);
      svg
        .call(renderXAxisLabel, {
          innerHeight: dims.innerHeight,
          innerWidth: dims.innerWidth,
          label: config.xSerie.label,
          margins: dims.margins,
        })
        .call(renderYAxisLabel, {
          innerHeight: dims.innerHeight,
          innerWidth: dims.innerWidth,
          label: "Value",
          margins: dims.margins,
        });
    }

    if (hasGrid) {
      content.call(renderXGrid, xScale, yScale).call(renderYGrid, xScale, yScale);
    }

    if (hasPoints) {
      renderPoints<T>(
        content,
        currentSeries,
        xScale,
        yScale,
        config.xSerie.accessor,
      );
    }

    if (hasTooltip) {
      addTooltip<T>(
        bounds,
        currentSeries,
        xScale,
        yScale,
        config.xSerie.accessor,
        {
          ...tooltipOptions,
          innerHeight: dims.innerHeight,
          innerWidth: dims.innerWidth,
        },
      );
    }

    if (hasTitle && titleOptions) {
      svg.call(renderTitle, {
        margins: dims.margins,
        title: titleOptions.title,
        width: dims.width,
      });
    }

    if (hasLegend && legendOptions) {
      svg.call(renderLegend, {
        items: legendOptions.items,
        x: margins.left + dims.innerWidth - LEGEND_WIDTH,
        y: margins.top + LEGEND_TOP_OFFSET,
      });
    }

    if (hasZoomPan) {
      svg.on(".zoom", null);
      zoomBehavior = addZoomPan(svg, {
        innerHeight: dims.innerHeight,
        innerWidth: dims.innerWidth,
        onZoom:
          zoomPanOptions.onZoom ??
          ((newX: AnyScale, newY: AnyScale): void => {
            if (hasAxes) {
              renderXAxis(bounds, newX, dims.innerHeight);
              renderYAxis(bounds, newY);
            }
            if (hasGrid) {
              content.call(renderXGrid, newX, newY).call(renderYGrid, newX, newY);
            }
            renderLine<T>(
              content,
              currentSeries,
              newX,
              newY,
              config.xSerie.accessor,
              { curve: resolvedCurve, reducedMotion },
            );
            if (hasPoints) {
              renderPoints<T>(
                content,
                currentSeries,
                newX,
                newY,
                config.xSerie.accessor,
              );
            }
          }),
        xScale,
        yScale,
      });
    }

    clearOptionalNodes();
  };

  const disposeResize = observeResize(container, render);

  const ensureActive = (): void => {
    if (isDisposed) {
      throw new Error("Cannot operate on a disposed chart instance.");
    }
  };

  const chart: ChartInstance<T> = {
    container,
    dispose: (): void => {
      if (isDisposed) return;
      isDisposed = true;
      disposeResize();
      cleanupAllEnhancements();
    },
    get series() {
      return currentSeries;
    },
    svg,
    update: (newData: readonly T[]): void => {
      ensureActive();
      currentSeries = processAllSeries<T>(
        newData,
        config.xSerie.accessor,
        config.ySeries,
      );
      render();
    },
    withAxes: (): ChartInstance<T> => {
      ensureActive();
      if (hasAxes) return chart;
      hasAxes = true;
      render();
      return chart;
    },
    withGrid: (): ChartInstance<T> => {
      ensureActive();
      if (hasGrid) return chart;
      hasGrid = true;
      render();
      return chart;
    },
    withLegend: (options: WithLegendOptions): ChartInstance<T> => {
      ensureActive();
      if (hasLegend && areLegendOptionsEqual(legendOptions, options)) return chart;
      hasLegend = true;
      legendOptions = options;
      render();
      return chart;
    },
    withPoints: (): ChartInstance<T> => {
      ensureActive();
      if (hasPoints) return chart;
      hasPoints = true;
      render();
      return chart;
    },
    withTitle: (options: WithTitleOptions): ChartInstance<T> => {
      ensureActive();
      if (hasTitle && areTitleOptionsEqual(titleOptions, options)) return chart;
      hasTitle = true;
      titleOptions = options;
      render();
      return chart;
    },
    withTooltip: (options: WithTooltipOptions = {}): ChartInstance<T> => {
      ensureActive();
      if (hasTooltip && areTooltipOptionsEqual(tooltipOptions, options)) return chart;
      hasTooltip = true;
      tooltipOptions = options;
      render();
      return chart;
    },
    withZoomPan: (options: WithZoomPanOptions = {}): ChartInstance<T> => {
      ensureActive();
      if (hasZoomPan && areZoomPanOptionsEqual(zoomPanOptions, options)) return chart;
      hasZoomPan = true;
      zoomPanOptions = options;
      render();
      return chart;
    },
  };

  render();
  return chart;
};
