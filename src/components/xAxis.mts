import type { AxisDomain } from "d3";

import { axisBottom } from "d3";

import { asAxisScale } from "@/utils/axisScale.mjs";
import { readCssNumber } from "@/utils/cssVariables.mjs";
import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

/** Options for {@link renderXAxis}. */
export interface RenderXAxisOptions {
  /** Preferred number of axis ticks (positive integer). D3 may adjust this value. */
  readonly tickCount?: number;
  /** Optional formatter for tick labels. */
  readonly tickFormat?: (domainValue: AxisDomain, index: number) => string;
}

/**
 * Render or update an X axis inside the provided bounds group.
 *
 * Tick size, tick padding, tick label font size, and tick label colour are
 * driven by CSS custom properties (`--vl-axis-tick-size`, `--vl-axis-tick-padding`,
 * `--vl-axis-font-size`, `--vl-axis-color`) that are written by
 * {@link applyThemeCssVars} and inherited through the SVG element tree.
 * Numeric values are resolved via `getComputedStyle` because D3's
 * `.tickSize()` / `.tickPadding()` require actual numbers.
 *
 * @param boundsGroup - D3 selection of the container group for the axis.
 * @param xScale - D3-compatible scale used to generate ticks. Must implement
 *   `copy()` and `range()`.
 * @param innerHeight - Vertical pixel offset at which the x-axis is positioned.
 * @param options.tickCount - Preferred number of ticks; D3 may adjust.
 * @param options.tickFormat - Optional formatter for tick labels.
 */
export const renderXAxis = (
  boundsGroup: BoundsSelection,
  xScale: AnyScale,
  innerHeight: number,
  { tickCount = 5, tickFormat }: RenderXAxisOptions = {},
): void => {
  const node = boundsGroup.node();
  const tickSize = node ? readCssNumber(node, "--vl-axis-tick-size", 6) : 6;
  const tickPadding = node ? readCssNumber(node, "--vl-axis-tick-padding", 8) : 8;

  const axis = axisBottom(asAxisScale(xScale))
    .ticks(tickCount)
    .tickSize(tickSize)
    .tickPadding(tickPadding);
  if (tickFormat) axis.tickFormat(tickFormat);

  const g = boundsGroup
    .selectAll<SVGGElement, null>("g.x-axis")
    .data([null])
    .join("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${String(innerHeight)})`)
    .call(axis);

  g.selectAll<SVGTextElement, unknown>("text")
    .style("fill", "var(--vl-axis-color, #333333)")
    .style("font-size", "var(--vl-axis-font-size, 12px)");
};
