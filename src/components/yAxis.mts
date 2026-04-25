import type { AxisDomain } from "d3";

import { axisLeft } from "d3";

import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

/**
 * A scale compatible with D3 axis generators used in this module.
 */
type AxisCompatibleScale = AnyScale & Readonly<{
  readonly copy: () => unknown;
  readonly range: () => readonly number[];
}>;

/** Options for {@link renderYAxis}. */
export interface RenderYAxisOptions {
  /** Preferred number of ticks to request from the axis generator. */
  readonly tickCount?: number;
  /** Optional formatter for tick labels. */
  readonly tickFormat?: (domainValue: AxisDomain, index: number) => string;
}

const asAxisScale = (scale: AnyScale): AxisCompatibleScale => scale;

/**
 * Render a left-oriented Y axis into the provided bounds group.
 *
 * Tick size, tick padding, tick label font size, and tick label colour are
 * driven by CSS custom properties (`--vl-axis-tick-size`, `--vl-axis-tick-padding`,
 * `--vl-axis-font-size`, `--vl-axis-color`) written by {@link applyThemeCssVars}.
 * Numeric values are resolved via `getComputedStyle` because D3's
 * `.tickSize()` / `.tickPadding()` require actual numbers.
 *
 * @param boundsGroup - D3 selection of the container group where the axis is rendered.
 * @param yScale - D3 scale used to generate the axis. Must implement `copy()` and `range()`.
 * @param options.tickCount - Preferred number of ticks (default 5).
 * @param options.tickFormat - Optional formatter for tick labels.
 * @example
 * ```ts
 * renderYAxis(boundsG, yScale, { tickCount: 6, tickFormat: (v) => `${v}%` });
 * ```
 */
export const renderYAxis = (
  boundsGroup: BoundsSelection,
  yScale: AnyScale,
  { tickCount = 5, tickFormat }: RenderYAxisOptions = {},
): void => {
  const node = boundsGroup.node();
  const cs = node ? getComputedStyle(node) : null;
  const tickSize = cs ? parseFloat(cs.getPropertyValue("--vl-axis-tick-size")) || 6 : 6;
  const tickPadding = cs ? parseFloat(cs.getPropertyValue("--vl-axis-tick-padding")) || 8 : 8;

  const axis = axisLeft(asAxisScale(yScale))
    .ticks(tickCount)
    .tickSize(tickSize)
    .tickPadding(tickPadding);
  if (tickFormat) axis.tickFormat(tickFormat);

  const g = boundsGroup
    .selectAll<SVGGElement, null>("g.y-axis")
    .data([null])
    .join("g")
    .attr("class", "y-axis")
    .call(axis);

  g.selectAll<SVGTextElement, unknown>("text")
    .style("fill", "var(--vl-axis-color, #333333)")
    .style("font-size", "var(--vl-axis-font-size, 12px)");
};
