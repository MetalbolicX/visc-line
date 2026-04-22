import type { AxisDomain } from "d3";

import { axisBottom } from "d3";

import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

/**
 * Render an X axis inside the provided bounds group using a D3 axis generator.
 *
 * Creates or updates a child `<g>` element with class `"x-axis"`, positions it at
 * `y = innerHeight`, and calls a D3 bottom axis constructed from the given scale.
 *
 * @param boundsGroup - D3 selection of the container group for the axis.
 * @param xScale - D3 scale used to generate axis ticks.
 * @param innerHeight - Vertical offset (pixels) to position the x-axis.
 * @param options - Optional configuration.
 */
/**
 * Narrow view of a D3 scale sufficient for axis generators used here.
 *
 * We require `copy()` because D3 axis constructors call it internally
 * and `range()` to determine pixel extents. This intentionally omits other
 * scale methods to remain permissive over different scale kinds (linear,
 * time, band, etc.).
 */
type AxisCompatibleScale = AnyScale & Readonly<{
  readonly copy: () => unknown;
  readonly range: () => readonly number[];
}>;

/**
 * A minimal shape of a D3 scale required by axis generators used here.
 *
 * This narrows AnyScale to the properties axisBottom expects so callers
 * and type-checking can rely on `copy()` and `range()` being present.
 */

/** Options for {@link renderXAxis}. */
/**
 * Configuration for renderXAxis.
 *
 * - tickCount: preferred number of axis ticks (positive integer). D3 may
 *   adjust this value depending on the domain and layout.
 * - tickFormat: optional formatter for tick labels; receives the domain
 *   value and the tick index and should return the rendered label.
 */
interface RenderXAxisOptions {
  readonly tickCount?: number;
  readonly tickFormat?: (domainValue: AxisDomain, index: number) => string;
}

/**
 * Cast an arbitrary AnyScale to the narrower AxisCompatibleScale.
 * This is a thin, unchecked cast used to satisfy the D3 axis API at
 * call sites. Consumers should ensure the provided scale implements
 * `copy()` and `range()`.
 */
const asAxisScale = (scale: AnyScale): AxisCompatibleScale => scale;

/**
 * Render or update an X axis inside the provided bounds group.
 *
 * Side effects:
 * - creates or updates a single child <g class="x-axis"> element
 *   positioned at y = innerHeight and applies a D3 bottom axis to it.
 *
 * @param boundsGroup - D3 selection of the container group for the axis.
 * @param xScale - D3-compatible scale used to generate ticks. Must
 *   implement `copy()` and `range()` (see {@link AxisCompatibleScale}).
 * @param innerHeight - Vertical pixel offset at which the x-axis is
 *   positioned (typically the inner drawing height of the chart).
 * @param options.tickCount - preferred number of ticks; D3 may adjust it.
 * @param options.tickFormat - optional formatter for tick labels.
 */
export const renderXAxis = (
  boundsGroup: BoundsSelection,
  xScale: AnyScale,
  innerHeight: number,
  { tickCount = 5, tickFormat }: RenderXAxisOptions = {},
): void => {
  const axis = axisBottom(asAxisScale(xScale)).ticks(tickCount);
  if (tickFormat) axis.tickFormat(tickFormat);

  boundsGroup
    .selectAll<SVGGElement, null>("g.x-axis")
    .data([null])
    .join("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${String(innerHeight)})`)
    .call(axis);
};
