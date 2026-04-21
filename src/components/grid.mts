import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

interface TickableScale {
  (value: unknown): number;
  domain: () => unknown[];
  ticks: (count?: number) => unknown[];
}

// Soft, dashed grid lines keep the chart background light without stealing focus.
/**
 *
 */
const DEFAULT_GRID_LINE_STYLE = {
  opacity: 0.65,
  shapeRendering: "crispEdges",
  stroke: "var(--vl-grid-stroke, #cfd8dc)",
  strokeDasharray: "var(--vl-grid-dash-array, 4 7)",
  strokeLinecap: "round",
  strokeWidth: "var(--vl-grid-stroke-width, 1)",
} as const;

export type GridLineStyle = Partial<DefaultGridLineStyle>;
type DefaultGridLineStyle = typeof DEFAULT_GRID_LINE_STYLE;

/**
 *
 */
const getGridLineStyle = (style?: GridLineStyle): DefaultGridLineStyle => ({
  ...DEFAULT_GRID_LINE_STYLE,
  ...style,
});

/**
 *
 */
const asTickableScale = (scale: AnyScale): TickableScale =>
  scale as unknown as TickableScale;

/**
 *
 */
export /**
        *
        */
const renderXGrid = (
  boundSelection: BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
  style?: GridLineStyle,
): void => {
  /**
   *
   */
  const xTickableScale = asTickableScale(xScale);
  /**
   *
   */
  const yTickableScale = asTickableScale(yScale);
  /**
   *
   */
  const [xMin, xMax] = xTickableScale.domain();

  if (xMin === undefined || xMax === undefined) {
    return;
  }

  /**
   *
   */
  const gridStyle = getGridLineStyle(style);

  boundSelection
    .selectAll<SVGLineElement, unknown>("line.grid-x")
    .data(yTickableScale.ticks())
    .join("line")
    .attr("class", "grid-x")
    .attr("x1", xTickableScale(xMin))
    .attr("y1", (d) => yTickableScale(d))
    .attr("x2", xTickableScale(xMax))
    .attr("y2", (d) => yTickableScale(d))
    .attr("stroke", gridStyle.stroke)
    .attr("stroke-width", gridStyle.strokeWidth)
    .attr("stroke-dasharray", gridStyle.strokeDasharray)
    .attr("opacity", gridStyle.opacity)
    .attr("stroke-linecap", gridStyle.strokeLinecap)
    .attr("shape-rendering", gridStyle.shapeRendering);
};

/**
 *
 */
export /**
        *
        */
const renderYGrid = (
  boundSelection: BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
  style?: GridLineStyle,
): void => {
  /**
   *
   */
  const xTickableScale = asTickableScale(xScale);
  /**
   *
   */
  const yTickableScale = asTickableScale(yScale);
  /**
   *
   */
  const [yMin, yMax] = yTickableScale.domain();

  if (yMin === undefined || yMax === undefined) {
    return;
  }

  /**
   *
   */
  const gridStyle = getGridLineStyle(style);

  boundSelection
    .selectAll<SVGLineElement, unknown>("line.grid-y")
    .data(xTickableScale.ticks())
    .join("line")
    .attr("class", "grid-y")
    .attr("x1", (d) => xTickableScale(d))
    .attr("y1", yTickableScale(yMin))
    .attr("x2", (d) => xTickableScale(d))
    .attr("y2", yTickableScale(yMax))
    .attr("stroke", gridStyle.stroke)
    .attr("stroke-width", gridStyle.strokeWidth)
    .attr("stroke-dasharray", gridStyle.strokeDasharray)
    .attr("opacity", gridStyle.opacity)
    .attr("stroke-linecap", gridStyle.strokeLinecap)
    .attr("shape-rendering", gridStyle.shapeRendering);
};
