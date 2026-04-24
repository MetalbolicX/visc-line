import type { CurveFactory } from "d3";

import type {
  AnyScale,
  BoundsSelection,
  ChartConfig,
  CurvePreset,
  Dimensions,
  ProcessedSeries,
  Theme,
} from "@/types/index.mjs";
import type { Margins } from "@/types/index.mjs";

import { observeResize } from "@/accessibility/index.mjs";
import {
  renderBoundsGroup,
  renderContentGroup,
  renderLine,
  renderPoints,
  renderSVG,
  renderXAxis,
  renderXAxisLabel,
  renderXGrid,
  renderYAxis,
  renderYAxisLabel,
  renderYGrid,
} from "@/components/index.mjs";
import { addTooltip } from "@/interactivity/index.mjs";
import {
  createScales,
  getDimensions,
  getMultiSeriesExtents,
  processAllSeries,
} from "@/services/index.mjs";
import { defaultTheme } from "@/themes/index.mjs";
import { applyThemeCssVars, mergeTheme, resolveCurve } from "@/utils/index.mjs";

/**
 * A live, mounted chart handle returned by createChart.
 *
 * Template T is the raw datum type used to produce rendered series. Consumers
 * must call dispose() when the chart is no longer needed to remove observers
 * and event handlers and avoid memory leaks.
 *
 * Invariants:
 * - `container` must remain attached to the document for layout/measurement
 *   helpers (getDimensions) to produce correct values.
 * - `series` reflects the most recently processed series produced from the
 *   last call to update() or the initial config data.
 *
 * @template T - datum type for the underlying data array
 */
export interface ChartInstance<T> {
  readonly container: HTMLElement;
  readonly dispose: () => void;
  readonly series: readonly ProcessedSeries<T>[];
  readonly svg: ReturnType<typeof renderSVG>;
  readonly update: (newData: readonly T[]) => void;
}

/**
 * Curve preset name or D3 CurveFactory for the line generator.
 * When omitted, falls back to `theme.line.curve` (default: `"linear"`).
 */
/**
 * Optional configuration for createChart.
 *
 * Type-first notes:
 * - `curve`: either a D3 CurveFactory or a named CurvePreset. If omitted the
 *   resolved curve is taken from the merged theme (theme.line.curve).
 * - `margins`: layout margins in pixels. Defaults to { bottom:70, left:55,
 *   right:60, top:50 } and only affects SVG group placement.
 * - `theme`: a partial Theme object merged with the library defaultTheme.
 * - `xType`: the x-axis scale type. Supported values are 'linear', 'log',
 *   'pow', and 'time' (default: 'time').
 */
interface ChartOptions {
  readonly curve?: CurveFactory | CurvePreset;
  readonly margins?: Margins;
  readonly theme?: Partial<Theme>;
  readonly xType?: "linear" | "log" | "pow" | "time";
}

interface MinimalChartOptions {
  readonly curve?: CurveFactory | CurvePreset;
  readonly margins?: Margins;
  readonly theme?: Partial<Theme>;
  readonly xType?: "linear" | "log" | "pow" | "time";
}

interface ChartInternals {
  readonly bounds: BoundsSelection;
  readonly content: BoundsSelection;
  readonly dims: Dimensions;
  readonly xScale: AnyScale;
  readonly yScale: AnyScale;
}

const chartInternalsRegistry = new WeakMap<ChartInstance<unknown>, ChartInternals>();

const getChartInternals = (instance: ChartInstance<unknown>): ChartInternals => {
  const internals = chartInternalsRegistry.get(instance);
  if (!internals) {
    throw new Error("Chart internals are unavailable.");
  }
  return internals;
};

const DEFAULT_MARGINS: Margins = { bottom: 70, left: 55, right: 60, top: 50 };

export const createMinimalChart = <T,>(
  container: HTMLElement,
  config: ChartConfig<T>,
  {
    curve,
    margins = DEFAULT_MARGINS,
    theme,
    xType = "time",
  }: MinimalChartOptions = {},
): ChartInstance<T> => {
  const resolvedTheme = mergeTheme(defaultTheme, theme);
  applyThemeCssVars(container, resolvedTheme);
  const svg = renderSVG(container);
  const bounds = renderBoundsGroup(svg, margins);
  let currentSeries = processAllSeries<T>(
    config.data,
    config.xSerie.accessor,
    config.ySeries,
  );

  const resolvedCurve = resolveCurve(curve ?? resolvedTheme.line.curve);
  const reducedMotion = resolvedTheme.accessibility?.reducedMotion ?? false;

  const disposePlaceholder = (): void => {};

  let disposeResize = disposePlaceholder;

  const instance: ChartInstance<T> = {
    container,
    dispose: (): void => {
      disposeResize();
      chartInternalsRegistry.delete(instance as ChartInstance<unknown>);
    },
    get series() {
      return currentSeries;
    },
    svg,
    update: (newData: readonly T[]): void => {
      currentSeries = processAllSeries<T>(
        newData,
        config.xSerie.accessor,
        config.ySeries,
      );
      render();
    },
  };

  const render = (): void => {
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

    chartInternalsRegistry.set(instance as ChartInstance<unknown>, {
      bounds,
      content,
      dims,
      xScale,
      yScale,
    });
  };

  render();
  disposeResize = observeResize(container, render);

  return instance;
};

/**
 * Create and mount a responsive SVG chart into the provided container.
 *
 * Key behaviors and side effects:
 * - Renders axes, grids, lines and points into an internal SVG appended to
 *   `container` and registers resize observers + tooltip handlers. Call
 *   `dispose()` on the returned ChartInstance to remove those observers.
 * - The chart measures layout using getDimensions; `container` must be
 *   attached to the document for correct measurement and grid/axis placement.
 * - `update(newData)` will re-process the series and re-render; the returned
 *   instance exposes the latest processed series via the `series` getter.
 *
 * Type parameters and arguments are intentionally explicit: the function does
 * not accept `any` and preserves the generic datum type T across processing
 * and interactivity handlers.
 *
 * @template T - the raw data item type supplied to the chart (used by accessors)
 * @param {HTMLElement} container - DOM element to append the SVG into. Must be
 *   attached to document for measurement.
 * @param {ChartConfig<T>} config - chart configuration (xSerie, ySeries, data)
 * @param {ChartOptions} [options] - optional rendering overrides (curve, margins, theme, xType)
 * @returns {ChartInstance<T>} a live chart handle. Call dispose() to teardown.
 * @example
 * ```ts
 * const chart = createChart(document.getElementById('root'), config);
 * // later
 * chart.update(newData);
 * chart.dispose();
 * ```
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
  const minimalChart = createMinimalChart(container, config, {
    curve,
    margins,
    theme,
    xType,
  });
  const { bounds } = getChartInternals(minimalChart as ChartInstance<unknown>);
  const { svg } = minimalChart;
  minimalChart.dispose();
  svg.selectAll<SVGPathElement, unknown>("path.chart-line").remove();

  const resolvedTheme = mergeTheme(defaultTheme, theme);
  let currentSeries = minimalChart.series;

  const resolvedCurve = resolveCurve(curve ?? resolvedTheme.line.curve);
  const reducedMotion = resolvedTheme.accessibility?.reducedMotion ?? false;

  /**
   * Re-render the entire chart into the existing SVG container.
   *
   * Notes / invariants:
   * - Expects `container` to be attached to the document so measurements (getDimensions)
   *   return correct values. If the container is detached, grid/axis placement may be wrong.
   * - Idempotent in the sense that calling it repeatedly will reconcile the SVG content
   *   by delegating to the renderer helpers (renderLine, renderPoints, renderAxis/grid helpers).
   * - Side effects: mutates the SVG DOM (axes, grid, lines, points) and registers tooltip
   *   event handlers via addTooltip. It does not close over external mutable state other than
   *   `currentSeries`, `resolvedCurve` and `reducedMotion` which influence rendering output.
   * - Performance: this is a hot path (called on resize and data updates). Consider memoizing
   *   expensive scale/extent calculations if rendering becomes a bottleneck. (PERF)
   *
   * @remarks
   * Uses the helper pipeline: measure -> create content group -> compute multi-series extents ->
   * create scales -> render axes and grids -> draw lines & points -> attach axis labels & tooltip.
   *
   * @returns void
   */
  const render = (): void => {
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

    bounds
      .call(renderXAxis, xScale, dims.innerHeight)
      .call(renderYAxis, yScale);

    content.call(renderXGrid, xScale, yScale).call(renderYGrid, xScale, yScale);

    renderLine<T>(
      content,
      currentSeries,
      xScale,
      yScale,
      config.xSerie.accessor,
      { curve: resolvedCurve, reducedMotion },
    );
    renderPoints<T>(
      content,
      currentSeries,
      xScale,
      yScale,
      config.xSerie.accessor,
    );

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

    addTooltip<T>(
      bounds,
      currentSeries,
      xScale,
      yScale,
      config.xSerie.accessor,
      { innerHeight: dims.innerHeight, innerWidth: dims.innerWidth },
    );
  };

  render();
  const dispose = observeResize(container, render);

  return {
    container,
    dispose,
    get series() {
      return currentSeries;
    },
    svg,
    update: (newData: readonly T[]): void => {
      currentSeries = processAllSeries<T>(
        newData,
        config.xSerie.accessor,
        config.ySeries,
      );
      render();
    },
  };
};
