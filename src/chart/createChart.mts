import type { ChartConfig } from "@/types/index.mjs";

import { observeResize } from "@/accessibility/index.mjs";
import { renderBoundsGroup, renderSVG } from "@/components/index.mjs";
import { disposeTooltip } from "@/interactivity/index.mjs";
import {
  clearExtentCache,
  getMultiSeriesExtents,
  processAllSeries,
} from "@/services/index.mjs";
import { defaultTheme } from "@/themes/index.mjs";
import { applyThemeCssVars, mergeTheme, resolveCurve } from "@/utils/index.mjs";
import { DEFAULT_MARGINS } from "@/chart/chartConstants.mjs";
import { cleanupAllEnhancements } from "@/chart/chartLifecycle.mjs";
import { renderChart } from "@/chart/chartRender.mjs";
import {
  areAxesOptionsEqual,
  areGridOptionsEqual,
  areLegendOptionsEqual,
  areTitleOptionsEqual,
  areTooltipOptionsEqual,
  areZoomPanOptionsEqual,
} from "@/chart/optionComparators.mjs";
import { getFeatureFlags, type ChartState } from "@/chart/chartState.mjs";
import type { ChartInstance, ChartOptions } from "@/chart/chartTypes.mjs";

/**
 * Create and render an interactive chart inside a DOM container.
 *
 * This factory wires up theme CSS variables, renders the SVG root and bounds
 * group, prepares the internal chart state derived from the provided
 * configuration, and installs a resize observer to re-render on container
 * size changes. The returned ChartInstance exposes fluent feature toggles
 * (withAxes, withGrid, withLegend, withPoints, withTitle, withTooltip,
 * withZoomPan), an update method to replace the underlying data, and a
 * dispose method to remove enhancements and listeners.
 *
 * @template T - The item type for the supplied data array. Types must be
 * compatible with the provided accessors in `config.xSerie.accessor` and
 * `config.ySeries`.
 * @param {HTMLElement} container - Host element that will contain the chart's
 * SVG. The element should be attached to the document for resize observation
 * to work reliably.
 * @param {ChartConfig<T>} config - Chart configuration including `data`, an
 * `xSerie` accessor and `ySeries` definitions. The x accessor must return a
 * value that can be used for scaling (e.g., Date, number, or ordinal key).
 * @param {ChartOptions} [options] - Optional rendering options. Common fields
 * include `curve` (line interpolation), `margins`, `theme`, and `xType`.
 * Defaults are applied for margins and xType.
 * @returns {ChartInstance<T>} A live chart instance. Side effects:
 * - mutates the DOM by injecting SVG and enhancing it with interactive
 *   behaviors; - applies CSS variables for the resolved theme to `container`;
 * - installs a resize observer. Call `dispose()` to release resources.
 * @throws {Error} If a method is invoked on a disposed chart (e.g. calling
 * any fluent API after `dispose()`), an Error is thrown.
 * @example
 * ```ts
 * // Create a time-series chart and enable axes and tooltip
 * const chart = createChart(document.getElementById('root'), {
 *   data: myData,
 *   xSerie: { accessor: d => d.date },
 *   ySeries: [{ accessor: d => d.value }]
 * });
 * chart.withAxes().withTooltip();
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
    yLabel,
  }: ChartOptions = {},
): ChartInstance<T> => {
  if (container == null) {
    throw new Error("createChart: container must be a non-null HTMLElement");
  }
  if (!Array.isArray(config.data)) {
    throw new Error("createChart: config.data must be an array");
  }
  if (!Array.isArray(config.ySeries) || config.ySeries.length === 0) {
    throw new Error("createChart: config.ySeries must be a non-empty array");
  }

  const duplicateLabels = config.ySeries
    .map(({ label }) => label)
    .filter((label, index, labels) => labels.indexOf(label) !== index);
  if (duplicateLabels.length > 0) {
    throw new Error(
      `createChart: duplicated ySeries labels are not allowed. Duplicates: ${duplicateLabels.join(", ")}`,
    );
  }

  const resolvedTheme = mergeTheme(defaultTheme, theme);
  applyThemeCssVars(container, resolvedTheme);

  const resolvedCurve = resolveCurve(curve ?? resolvedTheme.line.curve);
  const reducedMotion = resolvedTheme.accessibility?.reducedMotion ?? false;
  const clipPathId = `visc-clip-${crypto.randomUUID().slice(0, 8)}`;

  const svg = renderSVG(container, "Interactive line chart");
  const bounds = renderBoundsGroup(svg, margins);

  const filterSeriesByLabels = (
    allSeries: readonly ReturnType<typeof processAllSeries<T>>[number][],
    visibleLabels: ReadonlySet<string>,
  ) => allSeries.filter(({ label }) => visibleLabels.has(label));

  const assertValidVisibleLabels = (
    labels: readonly string[],
    allSeries: readonly ReturnType<typeof processAllSeries<T>>[number][],
    caller: "updateVisibleSeries" | "withVisibleSeries",
  ): void => {
    const validLabels = new Set(allSeries.map(({ label }) => label));
    const invalidLabels = labels.filter((label) => !validLabels.has(label));
    if (invalidLabels.length > 0) {
      throw new Error(
        `createChart.${caller}: Unknown series labels [${invalidLabels.join(", ")}]. Valid labels: [${Array.from(validLabels).join(", ")}]`,
      );
    }
  };

  const allSeries = processAllSeries<T>(
    config.data,
    config.xSerie.accessor,
    config.ySeries,
  );
  const allSeriesExtents = getMultiSeriesExtents(
    allSeries,
    config.xSerie.accessor,
  );
  const defaultVisibleLabels = new Set(allSeries.map(({ label }) => label));

  const state: ChartState<T> = {
    allSeries,
    allSeriesExtents,
    currentSeries: allSeries,
    customCallback: null,
    customCleanup: null,
    hasAxes: false,
    hasCustom: false,
    hasGrid: false,
    hasLegend: false,
    hasPoints: false,
    hasTitle: false,
    hasTooltip: false,
    hasZoomPan: false,
    isDisposed: false,
    axesOptions: {},
    gridOptions: {},
    legendOptions: null,
    titleOptions: null,
    tooltipOptions: {},
    visibleLabels: defaultVisibleLabels,
    zoomBehavior: null,
    zoomPanOptions: {},
  };

  const render = (): void => {
    renderChart(
      {
        bounds,
        clipPathId,
        config,
        container,
        flags: getFeatureFlags(state),
        margins,
        resolvedCurve,
        state,
        svg,
        xType,
        reducedMotion,
        yLabel,
      },
      {
        onZoomBehaviorChange: (nextZoomBehavior): void => {
          state.zoomBehavior = nextZoomBehavior;
        },
        onCustomCleanupChange: (cleanup): void => {
          state.customCleanup = cleanup;
        },
      },
    );
  };

  const disposeResize = observeResize(container, render);

  const ensureActive = (): void => {
    if (state.isDisposed) {
      throw new Error("Cannot operate on a disposed chart instance.");
    }
  };

  const chart: ChartInstance<T> = {
    get allSeries() {
      return Object.freeze([...state.allSeries]);
    },
    container,
    dispose: (): void => {
      if (state.isDisposed) return;
      state.isDisposed = true;
      state.customCleanup?.();
      disposeResize();
      cleanupAllEnhancements(bounds, svg, () => {
        state.zoomBehavior = null;
      });
      disposeTooltip(bounds);
    },
    get series() {
      return Object.freeze([...state.currentSeries]);
    },
    svg,
    update: (newData: readonly T[]): void => {
      ensureActive();
      clearExtentCache();
      state.allSeries = processAllSeries<T>(
        newData,
        config.xSerie.accessor,
        config.ySeries,
      );
      state.allSeriesExtents = getMultiSeriesExtents(
        state.allSeries,
        config.xSerie.accessor,
      );
      const nextVisibleLabels = new Set(
        [...state.visibleLabels].filter((label) =>
          state.allSeries.some((serie) => serie.label === label),
        ),
      );
      state.visibleLabels = nextVisibleLabels;
      state.currentSeries = filterSeriesByLabels(
        state.allSeries,
        state.visibleLabels,
      );
      render();
    },
    updateVisibleSeries: (labels): void => {
      ensureActive();
      assertValidVisibleLabels(labels, state.allSeries, "updateVisibleSeries");
      clearExtentCache();
      state.visibleLabels = new Set(labels);
      state.currentSeries = filterSeriesByLabels(state.allSeries, state.visibleLabels);
      state.zoomBehavior?.reset();
      render();
    },
    withAxes: (options = {}): ChartInstance<T> => {
      ensureActive();
      if (state.hasAxes && areAxesOptionsEqual(state.axesOptions, options)) {
        return chart;
      }
      state.hasAxes = true;
      state.axesOptions = options;
      render();
      return chart;
    },
    withCustom: (callback): ChartInstance<T> => {
      ensureActive();
      if (callback === null) {
        state.customCleanup?.();
        state.customCleanup = null;
        state.customCallback = null;
        state.hasCustom = false;
        render();
        return chart;
      }
      state.customCallback = callback;
      state.hasCustom = true;
      render();
      return chart;
    },
    withGrid: (options = {}): ChartInstance<T> => {
      ensureActive();
      if (state.hasGrid && areGridOptionsEqual(state.gridOptions, options)) {
        return chart;
      }
      state.hasGrid = true;
      state.gridOptions = options;
      render();
      return chart;
    },
    withLegend: (options): ChartInstance<T> => {
      ensureActive();
      if (
        state.hasLegend &&
        areLegendOptionsEqual(state.legendOptions, options)
      ) {
        return chart;
      }
      state.hasLegend = true;
      state.legendOptions = options;
      render();
      return chart;
    },
    withPoints: (): ChartInstance<T> => {
      ensureActive();
      if (state.hasPoints) return chart;
      state.hasPoints = true;
      render();
      return chart;
    },
    withVisibleSeries: (labels): ChartInstance<T> => {
      ensureActive();
      assertValidVisibleLabels(labels, state.allSeries, "withVisibleSeries");
      const nextLabels = new Set(labels);
      const hasSameSize = state.visibleLabels.size === nextLabels.size;
      const hasSameMembers = hasSameSize
        ? [...nextLabels].every((label) => state.visibleLabels.has(label))
        : false;
      if (hasSameMembers) {
        return chart;
      }
      clearExtentCache();
      state.visibleLabels = nextLabels;
      state.currentSeries = filterSeriesByLabels(state.allSeries, state.visibleLabels);
      state.zoomBehavior?.reset();
      render();
      return chart;
    },
    withTitle: (options): ChartInstance<T> => {
      ensureActive();
      if (state.hasTitle && areTitleOptionsEqual(state.titleOptions, options)) {
        return chart;
      }
      state.hasTitle = true;
      state.titleOptions = options;
      render();
      return chart;
    },
    withTooltip: (options = {}): ChartInstance<T> => {
      ensureActive();
      if (
        state.hasTooltip &&
        areTooltipOptionsEqual(state.tooltipOptions, options)
      ) {
        return chart;
      }
      state.hasTooltip = true;
      state.tooltipOptions = options;
      render();
      return chart;
    },
    withZoomPan: (options = {}): ChartInstance<T> => {
      ensureActive();
      if (
        state.hasZoomPan &&
        areZoomPanOptionsEqual(state.zoomPanOptions, options)
      ) {
        return chart;
      }
      state.hasZoomPan = true;
      state.zoomPanOptions = options;
      render();
      return chart;
    },
  };

  render();
  return chart;
};
