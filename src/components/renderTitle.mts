import type { SVGSelection, Margins } from "@/types/index.mjs";

/** Options for {@link renderTitle}. */
interface RenderTitleOptions {
  width: number;
  margins: Margins;
  title: string;
  fontSize?: number;
  fill?: string;
  fontWeight?: string | number;
}

/**
 * Render or update a centered chart title inside the given SVG selection.
 *
 * Binds a single <text> element with class "chart-title" (creating it if missing),
 * positions it horizontally centered between the left and right margins at
 * y = margins.top / 2, sets text-anchor and dominant-baseline to center it,
 * applies font-size, font-weight and fill, and sets the element's text content.
 *
 * @param svg - D3 SVG selection to render the title into.
 * @param options - Configuration options.
 * @param options.width - Total width of the drawing area (including margins).
 * @param options.margins - Margins object with numeric top, right, bottom, left.
 * @param options.title - Title text to render.
 * @param options.fontSize - Font size for the title (default: 16).
 * @param options.fill - Fill color for the title text (default: "#222").
 * @param options.fontWeight - Font weight for the title (default: "bold").
 * @returns void
 */
export const renderTitle = (
  svg: SVGSelection,
  {
    width,
    margins,
    title,
    fontSize = 16,
    fill = "#222",
    fontWeight = "bold",
  }: RenderTitleOptions,
): void => {
  svg
    .selectAll<SVGTextElement, null>("text.chart-title")
    .data([null])
    .join("text")
    .attr("class", "chart-title")
    .attr("x", margins.left + (width - margins.left - margins.right) / 2)
    .attr("y", margins.top / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", fontSize)
    .attr("font-weight", fontWeight)
    .attr("fill", fill)
    .text(title);
};
