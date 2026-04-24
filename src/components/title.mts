import type { Margins, SVGSelection } from "@/types/index.mjs";

/** Options for {@link renderTitle}. */
interface RenderTitleOptions {
  /** Layout margins used for positioning. */
  readonly margins: Margins;
  /** The title text to render. */
  readonly title: string;
  /** Total SVG width in pixels. */
  readonly width: number;
}

/**
 * Render or update a centered chart title inside the provided SVG selection.
 *
 * Visual appearance (colour, font size, font weight) is controlled by CSS
 * custom properties written by {@link applyThemeCssVars}:
 * - `--vl-title-color` — text colour
 * - `--vl-title-font-size` — font size
 * - `--vl-title-font-weight` — font weight
 *
 * The title is horizontally centered between `margins.left` and
 * `width - margins.right` and vertically placed at `margins.top / 2`.
 *
 * @param svg - D3 SVG selection to render the title into.
 * @param options - Layout options (margins, title text, SVG width).
 * @returns void
 * @example
 * ```ts
 * renderTitle(svg, { title: 'My Chart', margins, width: 800 });
 * ```
 */
export const renderTitle = (
  svg: SVGSelection,
  { margins, title, width }: RenderTitleOptions,
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
    .style("font-size", "var(--vl-title-font-size, 16px)")
    .style("font-weight", "var(--vl-title-font-weight, 600)")
    .style("fill", "var(--vl-title-color, #222222)")
    .text(title);
};
