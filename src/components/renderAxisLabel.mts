import type { SVGSelection, Margins } from "@/types/index.mjs";

/** Options shared between X and Y axis label renderers. */
interface AxisLabelOptions {
  innerWidth: number;
  innerHeight: number;
  margins: Margins;
  label?: string;
  fontSize?: number;
}

/**
 * Renders or updates a centered X-axis label inside the given SVG selection.
 *
 * Selects or creates a single <text> element with class "x-axis-label", positions it
 * horizontally centered within the inner drawing area and vertically below the chart
 * using the provided margins and innerHeight, applies styling, and sets the label text.
 *
 * @param svg - D3 selection of the SVG container to render the label into.
 * @param options - Configuration options for the axis label.
 * @param options.innerWidth - Inner drawing width (excluding margins).
 * @param options.innerHeight - Inner drawing height (excluding margins).
 * @param options.margins - Margins object (expected to include left and top).
 * @param options.label - Text content for the X-axis label.
 * @param options.fontSize - Font size in pixels for the label. Defaults to 12.
 *
 * @returns void
 */
export const renderXAxisLabel = (
  svg: SVGSelection,
  {
    innerWidth,
    innerHeight,
    margins,
    label,
    fontSize = 12,
  }: AxisLabelOptions = {} as AxisLabelOptions,
): void => {
  svg
    .selectAll<SVGTextElement, null>("text.x-axis-label")
    .data([null])
    .join("text")
    .attr("class", "x-axis-label")
    .attr("x", margins.left + innerWidth / 2)
    .attr("y", margins.top + innerHeight + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", fontSize)
    .attr("fill", "#333")
    .text(label ?? "");
};

/**
 * Renders a rotated Y-axis label into the given SVG selection.
 *
 * Selects or creates a single <text> element with class "y-axis-label", positions it
 * to the left of the chart area and vertically centered, rotates it -90 degrees, and
 * applies basic styling (text-anchor, font-size, fill).
 *
 * @param svg - The SVGSelection to render the label into.
 * @param options - AxisLabelOptions describing layout and label text. If omitted, an empty object is used.
 * @param options.innerWidth - Inner drawing width of the chart.
 * @param options.innerHeight - Inner drawing height of the chart.
 * @param options.margins - Margins object used to compute the label position (expects at least `left` and `top`).
 * @param options.label - The label text to display. Defaults to an empty string.
 * @param options.fontSize - Font size in pixels for the label. Defaults to 12.
 * @returns void
 *
 * @remarks
 * - Created/used element will have class "y-axis-label".
 * - Function mutates the DOM and is idempotent (reuses the same element via D3's join).
 */
export const renderYAxisLabel = (
  svg: SVGSelection,
  {
    innerWidth,
    innerHeight,
    margins,
    label,
    fontSize = 12,
  }: AxisLabelOptions = {} as AxisLabelOptions,
): void => {
  svg
    .selectAll<SVGTextElement, null>("text.y-axis-label")
    .data([null])
    .join("text")
    .attr("class", "y-axis-label")
    .attr(
      "transform",
      `translate(${margins.left - 40},${margins.top + innerHeight / 2}) rotate(-90)`,
    )
    .attr("text-anchor", "middle")
    .attr("font-size", fontSize)
    .attr("fill", "#333")
    .text(label ?? "");
};
