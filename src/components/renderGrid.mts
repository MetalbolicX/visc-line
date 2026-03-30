import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

export const renderXGrid = (
  boundSelection: BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
): void => {
  const [xMin, xMax] = xScale.domain();

  boundSelection
    .selectAll<SVGLineElement, unknown>("line.grid-x")
    .data(yScale.ticks() as number[])
    .join("line")
    .attr("class", "grid-x")
    .attr("x1", xScale(xMin))
    .attr("y1", (d) => (yScale as (v: unknown) => number)(d))
    .attr("x2", xScale(xMax))
    .attr("y2", (d) => (yScale as (v: unknown) => number)(d))
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1);
};

export const renderYGrid = (
  boundSelection: BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
): void => {
  const [yMin, yMax] = yScale.domain();

  boundSelection
    .selectAll<SVGLineElement, unknown>("line.grid-y")
    .data(xScale.ticks() as number[])
    .join("line")
    .attr("class", "grid-y")
    .attr("x1", (d) => (xScale as (v: unknown) => number)(d))
    .attr("y1", yScale(yMin))
    .attr("x2", (d) => (xScale as (v: unknown) => number)(d))
    .attr("y2", yScale(yMax))
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1);
};
