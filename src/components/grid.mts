import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

// Soft, dashed grid lines keep the chart background light without stealing focus.
const DEFAULT_GRID_LINE_STYLE = {
  stroke: "#cfd8dc",
  strokeWidth: 1,
  strokeDasharray: "4 7",
  opacity: 0.65,
  strokeLinecap: "round",
  shapeRendering: "crispEdges",
} as const;

type DefaultGridLineStyle = typeof DEFAULT_GRID_LINE_STYLE;
export type GridLineStyle = Partial<DefaultGridLineStyle>;

const getGridLineStyle = (style?: GridLineStyle): DefaultGridLineStyle => ({
  ...DEFAULT_GRID_LINE_STYLE,
  ...style,
});

export const renderXGrid = (
  boundSelection: BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
  style?: GridLineStyle,
): void => {
  const [xMin, xMax] = xScale.domain();
  const gridStyle = getGridLineStyle(style);

  boundSelection
    .selectAll<SVGLineElement, unknown>("line.grid-x")
    .data(yScale.ticks() as number[])
    .join("line")
    .attr("class", "grid-x")
    .attr("x1", xScale(xMin))
    .attr("y1", (d) => (yScale as (v: unknown) => number)(d))
    .attr("x2", xScale(xMax))
    .attr("y2", (d) => (yScale as (v: unknown) => number)(d))
    .attr("stroke", gridStyle.stroke)
    .attr("stroke-width", gridStyle.strokeWidth)
    .attr("stroke-dasharray", gridStyle.strokeDasharray)
    .attr("opacity", gridStyle.opacity)
    .attr("stroke-linecap", gridStyle.strokeLinecap)
    .attr("shape-rendering", gridStyle.shapeRendering);
};

export const renderYGrid = (
  boundSelection: BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
  style?: GridLineStyle,
): void => {
  const [yMin, yMax] = yScale.domain();
  const gridStyle = getGridLineStyle(style);

  boundSelection
    .selectAll<SVGLineElement, unknown>("line.grid-y")
    .data(xScale.ticks() as number[])
    .join("line")
    .attr("class", "grid-y")
    .attr("x1", (d) => (xScale as (v: unknown) => number)(d))
    .attr("y1", yScale(yMin))
    .attr("x2", (d) => (xScale as (v: unknown) => number)(d))
    .attr("y2", yScale(yMax))
    .attr("stroke", gridStyle.stroke)
    .attr("stroke-width", gridStyle.strokeWidth)
    .attr("stroke-dasharray", gridStyle.strokeDasharray)
    .attr("opacity", gridStyle.opacity)
    .attr("stroke-linecap", gridStyle.strokeLinecap)
    .attr("shape-rendering", gridStyle.shapeRendering);
};
