import type { Selection } from "d3";

import type {
  AnyScale,
  BoundsSelection,
  TickableScale,
} from "@/types/index.mjs";

// Soft, dashed grid lines keep the chart background light without stealing focus.
/** Default visual style applied to grid lines. */
const defaultGridLineStyle = {
  opacity: 0.65,
  shapeRendering: "crispEdges",
  stroke: "var(--vl-grid-stroke, #cfd8dc)",
  strokeDasharray: "var(--vl-grid-dash-array, 4 7)",
  strokeLinecap: "round",
  strokeWidth: "var(--vl-grid-stroke-width, 1)",
} as const;

export type GridLineStyle = Partial<DefaultGridLineStyle>;
type DefaultGridLineStyle = typeof defaultGridLineStyle;

/** Merge user-provided grid style with defaults. */
const getGridLineStyle = (style?: GridLineStyle): DefaultGridLineStyle => ({
  ...defaultGridLineStyle,
  ...style,
});

/** Cast an AnyScale into a TickableScale for tick generation. */
const asTickableScale = (scale: AnyScale): TickableScale =>
  scale as unknown as TickableScale;

/**
 * Apply visual attributes from a resolved grid style to a D3 selection of SVG lines.
 * This function mutates the provided selection by setting stroke, stroke-width,
 * stroke-dasharray, opacity, stroke-linecap and shape-rendering attributes.
 *
 * @param selection - D3 selection containing SVGLineElement nodes (scoped to a <g> container).
 * @param gridStyle - Fully-resolved grid line style (defaults already applied).
 */
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

/**
 * Render horizontal grid lines (left-to-right) across the chart area.
 *
 * Binds the ticks produced by `yScale` to `<line class="grid-x">` elements
 * and positions each line using the horizontal scale domain edges for
 * `x1`/`x2` and the tick value for `y1`/`y2`.
 *
 * This function mutates `boundSelection` by performing a D3 data join and
 * updating/appending `<line>` elements. It is a no-op when the horizontal
 * scale domain cannot be determined.
 *
 * @param boundSelection - D3 selection (typically an SVG <g> clipped to chart bounds) where grid lines are rendered.
 * @param xScale - Horizontal scale; must expose `domain()` and mapping (used to compute x positions).
 * @param yScale - Vertical scale; must be tickable (provide `ticks()`), used to generate horizontal lines.
 * @param style - Optional partial style to override default grid line appearance.
 * @returns void
 * @example
 * ```ts
 * renderXGrid(group, xScale, yScale, { stroke: '#eee' });
 * ```
 */
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

/**
 * Render vertical grid lines (top-to-bottom) across the chart area.
 *
 * Binds the ticks produced by `xScale` to `<line class="grid-y">` elements
 * and positions each line using the tick value for `x1`/`x2` and the vertical
 * scale domain edges for `y1`/`y2`.
 *
 * This function mutates `boundSelection` by performing a D3 data join and
 * updating/appending `<line>` elements. It is a no-op when the vertical
 * scale domain cannot be determined.
 *
 * @param boundSelection - D3 selection (typically an SVG <g> clipped to chart bounds) where grid lines are rendered.
 * @param xScale - Horizontal scale; must be tickable (provide `ticks()`), used to generate vertical lines.
 * @param yScale - Vertical scale; must expose `domain()` and mapping (used to compute y positions).
 * @param style - Optional partial style to override default grid line appearance.
 * @returns void
 * @example
 * ```ts
 * renderYGrid(group, xScale, yScale, { stroke: '#eee' });
 * ```
 */
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
