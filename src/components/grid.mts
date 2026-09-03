import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

import { asTickable } from "@/utils/scaleCast.mjs";

// ── Internal shared grid renderer ─────────────────────────────────────────────
// NOT exported from the package index. Use renderXGrid / renderYGrid instead.

interface GridRenderParams {
  readonly boundSelection: BoundsSelection;
  readonly tickScale: AnyScale;
  readonly className: "grid-x" | "grid-y";
  /** Domain endpoint for x1/x2 (for grid-x) or y1/y2 (for grid-y). */
  readonly domainMin: number | null;
  readonly domainMax: number | null;
}

const renderGrid = ({
  boundSelection,
  tickScale,
  className,
  domainMin,
  domainMax,
}: GridRenderParams): void => {
  const tickableScale = asTickable(tickScale);

  if (domainMin == null || domainMax == null) {
    return;
  }

  boundSelection
    .selectAll<SVGLineElement, unknown>(`line.${className}`)
    .data(tickableScale.ticks())
    .join("line")
    .attr("class", className)
    .attr("x1", className === "grid-x" ? domainMin : tickableScale)
    .attr("y1", className === "grid-x" ? tickableScale : domainMin)
    .attr("x2", className === "grid-x" ? domainMax : tickableScale)
    .attr("y2", className === "grid-x" ? tickableScale : domainMax)
    .attr("stroke", "var(--vl-grid-stroke, #e6e6e6)")
    .attr("stroke-width", "var(--vl-grid-stroke-width, 1)")
    .attr("stroke-dasharray", "var(--vl-grid-dash-array, 4 7)")
    .attr("opacity", "var(--vl-grid-opacity, 0.65)")
    .attr("stroke-linecap", "var(--vl-grid-stroke-linecap, round)")
    .attr("shape-rendering", "crispEdges");
};

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
  const [xMin, xMax] = xTickableScale.domain() as [number | null, number | null];

  renderGrid({
    boundSelection,
    tickScale: yScale,
    className: "grid-x",
    domainMin: xMin,
    domainMax: xMax,
  });
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
  const yTickableScale = asTickable(yScale);
  const [yMin, yMax] = yTickableScale.domain() as [number | null, number | null];

  renderGrid({
    boundSelection,
    tickScale: xScale,
    className: "grid-y",
    domainMin: yMin,
    domainMax: yMax,
  });
};
