import type { AnyScale, BoundsSelection, TickableScale } from "@/types/index.mjs";
import type { Selection } from "d3";

// Soft, dashed grid lines keep the chart background light without stealing focus.
const defaultGridLineStyle = {
  opacity: 0.65,
  shapeRendering: "crispEdges",
  stroke: "var(--vl-grid-stroke, #cfd8dc)",
  strokeDasharray: "var(--vl-grid-dash-array, 4 7)",
  strokeLinecap: "round",
  strokeWidth: "var(--vl-grid-stroke-width, 1)",
} as const;

type DefaultGridLineStyle = typeof defaultGridLineStyle;
export type GridLineStyle = Partial<DefaultGridLineStyle>;

const getGridLineStyle = (style?: GridLineStyle): DefaultGridLineStyle => ({
  ...defaultGridLineStyle,
  ...style,
});

const asTickableScale = (scale: AnyScale): TickableScale =>
  scale as unknown as TickableScale;

const applyGridAttrs = (
  selection: Selection<SVGLineElement, unknown, SVGGElement, unknown>,
  gridStyle: DefaultGridLineStyle,
): void => {
  selection
    .attr("stroke", gridStyle.stroke)
    .attr("stroke-width", gridStyle.strokeWidth)
    .attr("stroke-dasharray", gridStyle.strokeDasharray)
    .attr("opacity", gridStyle.opacity)
    .attr("stroke-linecap", gridStyle.strokeLinecap)
    .attr("shape-rendering", gridStyle.shapeRendering);
};

export const renderXGrid = (
  boundSelection: BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
  style?: GridLineStyle,
): void => {
  const xTickableScale = asTickableScale(xScale);
  const yTickableScale = asTickableScale(yScale);
  const [xMin, xMax] = xTickableScale.domain();

  if (xMin === undefined || xMax === undefined) {
    return;
  }

  applyGridAttrs(
    boundSelection
      .selectAll<SVGLineElement, unknown>("line.grid-x")
      .data(yTickableScale.ticks())
      .join("line")
      .attr("class", "grid-x")
      .attr("x1", xTickableScale(xMin))
      .attr("y1", (d) => yTickableScale(d))
      .attr("x2", xTickableScale(xMax))
      .attr("y2", (d) => yTickableScale(d)),
    getGridLineStyle(style),
  );
};

export const renderYGrid = (
  boundSelection: BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
  style?: GridLineStyle,
): void => {
  const xTickableScale = asTickableScale(xScale);
  const yTickableScale = asTickableScale(yScale);
  const [yMin, yMax] = yTickableScale.domain();

  if (yMin === undefined || yMax === undefined) {
    return;
  }

  applyGridAttrs(
    boundSelection
      .selectAll<SVGLineElement, unknown>("line.grid-y")
      .data(xTickableScale.ticks())
      .join("line")
      .attr("class", "grid-y")
      .attr("x1", (d) => xTickableScale(d))
      .attr("y1", yTickableScale(yMin))
      .attr("x2", (d) => xTickableScale(d))
      .attr("y2", yTickableScale(yMax)),
    getGridLineStyle(style),
  );
};
