import type { Margins, SVGSelection } from "@/types/index.mjs";

import { readCssNumber } from "@/utils/cssVariables.mjs";

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
 * Derives all spacing values needed for axis label positioning from the
 * resolved CSS custom properties on the SVG node.
 *
 * Returns an object with:
 * - padding: the --vl-label-padding value (default 8)
 * - axisTickSize: the --vl-axis-tick-size value (default 6)
 * - axisTickPadding: the --vl-axis-tick-padding value (default 8)
 * - axisFontSize: the --vl-axis-font-size value (default 12)
 * - axisLabelSpacing: the sum of the three axis style values
 */
const resolveAxisLabelSpacing = (
  svg: SVGSelection,
): {
  readonly axisFontSize: number;
  readonly axisLabelSpacing: number;
  readonly axisTickPadding: number;
  readonly axisTickSize: number;
  readonly padding: number;
} => {
  const node = svg.node();
  const padding = node ? readCssNumber(node, "--vl-label-padding", 8) : 8;
  const axisTickSize = node ? readCssNumber(node, "--vl-axis-tick-size", 6) : 6;
  const axisTickPadding = node ? readCssNumber(node, "--vl-axis-tick-padding", 8) : 8;
  const axisFontSize = node ? readCssNumber(node, "--vl-axis-font-size", 12) : 12;
  const axisLabelSpacing = axisTickSize + axisTickPadding + axisFontSize;
  return { axisFontSize, axisLabelSpacing, axisTickPadding, axisTickSize, padding };
};

/**
 * Renders or updates a centered X-axis label inside the given SVG selection.
 *
 * Visual appearance (colour, font size) is controlled by CSS custom properties
 * written by {@link applyThemeCssVars}:
 * - `--vl-label-color` — text colour
 * - `--vl-label-font-size` — font size
 * - `--vl-label-font-weight` — font weight
 * - `--vl-label-padding` — spacing from the axis
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
  }: XAxisLabelOptions,
): void => {
  const { axisLabelSpacing, padding } = resolveAxisLabelSpacing(svg);

  svg
    .selectAll<SVGTextElement, null>("text.x-axis-label")
    .data([null])
    .join("text")
    .attr("class", "x-axis-label")
    .attr("x", margins.left + innerWidth / 2)
    .attr("y", margins.top + innerHeight + axisLabelSpacing + padding)
    .attr("text-anchor", "middle")
    .style("font-size", "var(--vl-label-font-size, 12px)")
    .style("font-weight", "var(--vl-label-font-weight, 400)")
    .style("fill", "var(--vl-label-color, #222222)")
    .text(label ?? "");
};

/**
 * Renders a rotated Y-axis label into the given SVG selection.
 *
 * Visual appearance (colour, font size) is controlled by CSS custom properties
 * written by {@link applyThemeCssVars}:
 * - `--vl-label-color` — text colour
 * - `--vl-label-font-size` — font size
 * - `--vl-label-font-weight` — font weight
 * - `--vl-label-padding` — spacing from the axis
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
  }: YAxisLabelOptions,
): void => {
  const { axisLabelSpacing, padding } = resolveAxisLabelSpacing(svg);

  svg
    .selectAll<SVGTextElement, null>("text.y-axis-label")
    .data([null])
    .join("text")
    .attr("class", "y-axis-label")
    .attr(
      "transform",
      `translate(${String(margins.left - (axisLabelSpacing + padding))},${String(margins.top + innerHeight / 2)}) rotate(-90)`,
    )
    .attr("text-anchor", "middle")
    .style("font-size", "var(--vl-label-font-size, 12px)")
    .style("font-weight", "var(--vl-label-font-weight, 400)")
    .style("fill", "var(--vl-label-color, #222222)")
    .text(label ?? "");
};
