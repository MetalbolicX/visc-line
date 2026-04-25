import type { Margins, SVGSelection } from "@/types/index.mjs";

export interface XAxisLabelOptions {
  readonly innerHeight: number;
  readonly innerWidth: number;
  readonly label?: string;
  readonly margins: Margins;
}

export interface YAxisLabelOptions {
  readonly innerHeight: number;
  readonly label?: string;
  readonly margins: Margins;
}

/**
 * Renders or updates a centered X-axis label inside the given SVG selection.
 *
 * Visual appearance (colour, font size) is controlled by CSS custom properties
 * written by {@link applyThemeCssVars}:
 * - `--vl-axis-color` — text colour
 * - `--vl-axis-font-size` — font size
 *
 * @param svg - D3 selection of the SVG container.
 * @param options - Layout options (innerWidth, innerHeight, margins, label text).
 * @returns void
 */
export const renderXAxisLabel = (
  svg: SVGSelection,
  {
    innerHeight,
    innerWidth,
    label,
    margins,
  }: XAxisLabelOptions = {} as XAxisLabelOptions,
): void => {
  svg
    .selectAll<SVGTextElement, null>("text.x-axis-label")
    .data([null])
    .join("text")
    .attr("class", "x-axis-label")
    .attr("x", margins.left + innerWidth / 2)
    .attr("y", margins.top + innerHeight + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "var(--vl-axis-font-size, 12px)")
    .style("fill", "var(--vl-axis-color, #333333)")
    .text(label ?? "");
};

/**
 * Renders a rotated Y-axis label into the given SVG selection.
 *
 * Visual appearance (colour, font size) is controlled by CSS custom properties
 * written by {@link applyThemeCssVars}:
 * - `--vl-axis-color` — text colour
 * - `--vl-axis-font-size` — font size
 *
 * @param svg - The SVGSelection to render the label into.
 * @param options - Layout options (innerHeight, margins, label text).
 * @returns void
 */
export const renderYAxisLabel = (
  svg: SVGSelection,
  {
    innerHeight,
    label,
    margins,
  }: YAxisLabelOptions = {} as YAxisLabelOptions,
): void => {
  svg
    .selectAll<SVGTextElement, null>("text.y-axis-label")
    .data([null])
    .join("text")
    .attr("class", "y-axis-label")
    .attr(
      "transform",
      `translate(${String(margins.left - 40)},${String(margins.top + innerHeight / 2)}) rotate(-90)`,
    )
    .attr("text-anchor", "middle")
    .style("font-size", "var(--vl-axis-font-size, 12px)")
    .style("fill", "var(--vl-axis-color, #333333)")
    .text(label ?? "");
};
