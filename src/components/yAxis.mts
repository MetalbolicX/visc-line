import { axisLeft } from "d3";
import type { AxisDomain } from "d3";

import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

/** Options for {@link renderYAxis}. */
interface RenderYAxisOptions {
  tickCount?: number;
  tickFormat?: (domainValue: AxisDomain, index: number) => string;
}

/**
 * Render a left Y axis into a provided bounds group using the given D3 scale.
 *
 * Creates or updates a single `<g>` element with class `"y-axis"` under the provided
 * `boundsGroup` and invokes a D3 left-axis generator configured with the provided
 * scale, tick count, and optional tick formatter.
 *
 * @param boundsGroup - D3 selection of the container group where the axis will be rendered.
 * @param yScale - D3 scale used to generate the axis.
 * @param options - Optional configuration object.
 */
type AxisCompatibleScale = AnyScale & {
  range: () => number[];
  copy: () => unknown;
};

const asAxisScale = (scale: AnyScale): AxisCompatibleScale =>
  scale as unknown as AxisCompatibleScale;

export const renderYAxis = (
  boundsGroup: BoundsSelection,
  yScale: AnyScale,
  { tickCount = 5, tickFormat }: RenderYAxisOptions = {},
): void => {
  const axis = axisLeft(asAxisScale(yScale)).ticks(tickCount);
  if (tickFormat) axis.tickFormat(tickFormat as (d: AxisDomain, i: number) => string);

  boundsGroup
    .selectAll<SVGGElement, null>("g.y-axis")
    .data([null])
    .join("g")
    .attr("class", "y-axis")
    .call(axis);
};
