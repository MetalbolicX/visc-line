import { axisBottom } from "d3";
import type { BoundsSelection, AnyScale } from "@/types/index.mjs";

/** Options for {@link renderXAxis}. */
interface RenderXAxisOptions {
  tickCount?: number;
  tickFormat?: (domainValue: unknown, index: number) => string;
}

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
export const renderXAxis = (
  boundsGroup: BoundsSelection,
  xScale: AnyScale,
  innerHeight: number,
  { tickCount = 5, tickFormat }: RenderXAxisOptions = {},
): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axis = axisBottom(xScale as any).ticks(tickCount);
  if (tickFormat) axis.tickFormat(tickFormat as never);

  boundsGroup
    .selectAll<SVGGElement, null>("g.x-axis")
    .data([null])
    .join("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(axis as never);
};
