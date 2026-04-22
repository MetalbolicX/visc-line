/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import type {
  ChartConfig,
  ProcessedSeries,
  Theme,
} from "@/types/index.mjs";
import type { Margins } from "@/types/index.mjs";

import { observeResize } from "@/accessibility/index.mjs";
import {
  addTooltip,
  createScales,
  getDimensions,
  getMultiSeriesExtents,
  processAllSeries,
  renderBoundsGroup,
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
import {
  applyThemeCssVars,
  defaultTheme,
  mergeTheme,
} from "@/themes/index.mjs";

export interface ChartInstance<T> {
  container: HTMLElement;
  dispose: () => void;
  series: ProcessedSeries<T>[];
  svg: ReturnType<typeof renderSVG>;
  update: (newData: T[]) => void;
}

interface ChartOptions {
  curve?: Parameters<typeof renderLine>[5]["curve"];
  margins?: Margins;
  theme?: Partial<Theme>;
  xType?: "linear" | "log" | "pow" | "time";
}

/**
 *
 */
export /**
        *
        */
const createChart = <T,>(
  container: HTMLElement,
  config: ChartConfig<T>,
  {
    curve,
    margins = { bottom: 70, left: 55, right: 60, top: 50 },
    theme,
    xType = "time",
  }: ChartOptions = {},
): ChartInstance<T> => {
  /**
   *
   */
  const resolvedTheme = mergeTheme(defaultTheme, theme);
  applyThemeCssVars(container, resolvedTheme);

  /**
   *
   */
  const svg = renderSVG(container);
  /**
   *
   */
  const bounds = renderBoundsGroup(svg, margins);

  /**
   *
   */
  const processedSeries = processAllSeries<T>(
    config.data,
    config.xSerie.accessor,
    config.ySeries,
  );

  /**
   *
   */
  let currentSeries = processedSeries;

  /**
   *
   */
  const render = (): void => {
    /**
     *
     */
    const dims = getDimensions(container, margins);
    /**
     *
     */
    const { xDomain, yDomain } = getMultiSeriesExtents(
      currentSeries,
      config.xSerie.accessor,
    );
    /**
     *
     */
    const { xScale, yScale } = createScales({
      innerHeight: dims.innerHeight,
      innerWidth: dims.innerWidth,
      xDomain,
      xType,
      yDomain,
    });

    bounds
      .call(renderXAxis, xScale, dims.innerHeight)
      .call(renderYAxis, yScale);

    bounds
      .call(renderXGrid, xScale, yScale)
      .call(renderYGrid, xScale, yScale);

    renderLine<T>(bounds, currentSeries, xScale, yScale, config.xSerie.accessor, { curve });
    renderPoints<T>(bounds, currentSeries, xScale, yScale, config.xSerie.accessor);

    svg
      .call(renderXAxisLabel, { ...dims, label: config.xSerie.label })
      .call(renderYAxisLabel, { ...dims, label: "Value" });

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

  /**
   *
   */
  const dispose = observeResize(container, render);

  return {
    container,
    dispose,
    get series() {
      return currentSeries;
    },
    svg,
    /**
     *
     */
    update: (newData: T[]): void => {
      currentSeries = processAllSeries<T>(
        newData,
        config.xSerie.accessor,
        config.ySeries,
      );
      render();
    },
  };
};