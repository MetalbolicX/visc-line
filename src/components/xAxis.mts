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
type AxisCompatibleScale = AnyScale & {
  copy: () => unknown;
  range: () => number[];
};

/** Options for {@link renderXAxis}. */
interface RenderXAxisOptions {
  tickCount?: number;
  tickFormat?: (domainValue: AxisDomain, index: number) => string;
}

/**
 *
 */
const asAxisScale = (scale: AnyScale): AxisCompatibleScale =>
  scale;

/**
 *
 */
export /**
        *
        */
const renderXAxis = (
  boundsGroup: BoundsSelection,
  xScale: AnyScale,
  innerHeight: number,
  { tickCount = 5, tickFormat }: RenderXAxisOptions = {},
): void => {
  /**
   *
   */
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
