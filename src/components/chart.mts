import type { ChartConfig, ProcessedSeries, Theme } from "@/types/index.mjs";
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
import { applyThemeCssVars, mergeTheme } from "@/utils/index.mjs";

export interface ChartInstance<T> {
  readonly container: HTMLElement;
  readonly dispose: () => void;
  readonly series: readonly ProcessedSeries<T>[];
  readonly svg: ReturnType<typeof renderSVG>;
  readonly update: (newData: readonly T[]) => void;
}

interface ChartOptions {
  readonly curve?: NonNullable<Parameters<typeof renderLine>[5]>["curve"];
  readonly margins?: Margins;
  readonly theme?: Partial<Theme>;
  readonly xType?: "linear" | "log" | "pow" | "time";
}

/** Create a chart instance mounted into the given container using the provided configuration. */
export const createChart = <T,>(
  container: HTMLElement,
  config: ChartConfig<T>,
  {
    curve,
    margins = { bottom: 70, left: 55, right: 60, top: 50 },
    theme,
    xType = "time",
  }: ChartOptions = {},
): ChartInstance<T> => {
  const resolvedTheme = mergeTheme(defaultTheme, theme);
  applyThemeCssVars(container, resolvedTheme);
  const svg = renderSVG(container);
  const bounds = renderBoundsGroup(svg, margins);
  const processedSeries = processAllSeries<T>(
    config.data,
    config.xSerie.accessor,
    config.ySeries,
  );
  let currentSeries = processedSeries;
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
      { curve },
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
