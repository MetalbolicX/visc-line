import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

import { asTickable } from "@/utils/scaleCast.mjs";

/**
 * Render horizontal grid lines (left-to-right) across the chart area.
 *
 * Binds the ticks produced by `yScale` to `<line class="grid-x">` elements
 * and positions each line using the horizontal scale domain edges for
 * `x1`/`x2` and the tick value for `y1`/`y2`.
 *
 * Visual appearance is fully controlled by CSS custom properties written by
 * {@link applyThemeCssVars}:
 * - `--vl-grid-stroke` — line colour
 * - `--vl-grid-stroke-width` — line width
 * - `--vl-grid-dash-array` — dash pattern
 * - `--vl-grid-opacity` — opacity
 * - `--vl-grid-stroke-linecap` — line cap style
 *
 * @param boundSelection - D3 selection (typically a clipped content group) where grid lines are rendered.
 * @param xScale - Horizontal scale; must expose `domain()` and mapping.
 * @param yScale - Vertical scale; must be tickable (provide `ticks()`).
 * @returns void
 * @example
 * ```ts
 * renderXGrid(contentGroup, xScale, yScale);
 * ```
 */
export const renderXGrid = (
  boundSelection: BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
): void => {
  const xTickableScale = asTickable(xScale);
  const yTickableScale = asTickable(yScale);
  const [xMin, xMax] = xTickableScale.domain();

  if (xMin == null || xMax == null) {
    return;
  }

  boundSelection
    .selectAll<SVGLineElement, unknown>("line.grid-x")
    .data(yTickableScale.ticks())
    .join("line")
    .attr("class", "grid-x")
    .attr("x1", xTickableScale(xMin))
    .attr("y1", yTickableScale)
    .attr("x2", xTickableScale(xMax))
    .attr("y2", yTickableScale)
    .attr("stroke", "var(--vl-grid-stroke, #e6e6e6)")
    .attr("stroke-width", "var(--vl-grid-stroke-width, 1)")
    .attr("stroke-dasharray", "var(--vl-grid-dash-array, 4 7)")
    .attr("opacity", "var(--vl-grid-opacity, 0.65)")
    .attr("stroke-linecap", "var(--vl-grid-stroke-linecap, round)")
    .attr("shape-rendering", "crispEdges");
};

/**
 * Render vertical grid lines (top-to-bottom) across the chart area.
 *
 * Binds the ticks produced by `xScale` to `<line class="grid-y">` elements
 * and positions each line using the tick value for `x1`/`x2` and the vertical
 * scale domain edges for `y1`/`y2`.
 *
 * Visual appearance is fully controlled by CSS custom properties written by
 * {@link applyThemeCssVars} — see {@link renderXGrid} for the full list.
 *
 * @param boundSelection - D3 selection where grid lines are rendered.
 * @param xScale - Horizontal scale; must be tickable (provide `ticks()`).
 * @param yScale - Vertical scale; must expose `domain()` and mapping.
 * @returns void
 * @example
 * ```ts
 * renderYGrid(contentGroup, xScale, yScale);
 * ```
 */
export const renderYGrid = (
  boundSelection: BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
): void => {
  const xTickableScale = asTickable(xScale);
  const yTickableScale = asTickable(yScale);
  const [yMin, yMax] = yTickableScale.domain();

  if (yMin == null || yMax == null) {
    return;
  }

  boundSelection
    .selectAll<SVGLineElement, unknown>("line.grid-y")
    .data(xTickableScale.ticks())
    .join("line")
    .attr("class", "grid-y")
    .attr("x1", xTickableScale)
    .attr("y1", yTickableScale(yMin))
    .attr("x2", xTickableScale)
    .attr("y2", yTickableScale(yMax))
    .attr("stroke", "var(--vl-grid-stroke, #e6e6e6)")
    .attr("stroke-width", "var(--vl-grid-stroke-width, 1)")
    .attr("stroke-dasharray", "var(--vl-grid-dash-array, 4 7)")
    .attr("opacity", "var(--vl-grid-opacity, 0.65)")
    .attr("stroke-linecap", "var(--vl-grid-stroke-linecap, round)")
    .attr("shape-rendering", "crispEdges");
};