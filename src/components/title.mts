import type { Margins, SVGSelection } from "@/types/index.mjs";

/**
 * Options for renderTitle.
 *
 * - `margins` is used to compute the title's centered x position and top y offset.
 * - `width` is the full svg width used together with margins to center the text.
 */
interface RenderTitleOptions {
  /** CSS color or paint server for the title (default: var(--vl-title-color, #222)). */
  readonly fill?: string;
  /** Font size as number (px) or CSS size string. */
  readonly fontSize?: number | string;
  /** Font weight as number or CSS string. */
  readonly fontWeight?: number | string;
  /** Layout margins (left, right, top, bottom) used for positioning. */
  readonly margins: Margins;
  /** The title text to render. */
  readonly title: string;
  /** Total SVG width in pixels. */
  readonly width: number;
}

/**
 * Render or update a centered chart title inside the provided SVG selection.
 *
 * This mutates the passed svg by selecting/creating a single <text.chart-title> element
 * and setting its position, font, and fill. The title is horizontally centered between
 * margins.left and width - margins.right and vertically placed at margins.top / 2.
 *
 * @param svg - D3-like SVG selection to render the title into.
 * @param options - Rendering options (fill, fontSize, fontWeight, margins, title, width).
 * @returns void
 * @example
 * ```ts
 * renderTitle(svg, { title: 'My Chart', margins: { left: 12, right: 12, top: 24, bottom: 12 }, width: 800 });
 * ```
 */
export const renderTitle = (
  svg: SVGSelection,
  {
    fill = "var(--vl-title-color, #222)",
    fontSize = "var(--vl-title-font-size, 16px)",
    fontWeight = "var(--vl-title-font-weight, 600)",
    margins,
    title,
    width,
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
