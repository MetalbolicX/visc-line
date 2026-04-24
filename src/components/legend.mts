import type { SVGSelection } from "@/types/index.mjs";

/**
 * A single entry in the legend.
 *
 * - `color`: CSS/SVG color string used to fill the swatch.
 * - `label`: Human-facing label displayed next to the swatch.
 */
export interface LegendItem {
  /** CSS/SVG color string used to fill the swatch. */
  readonly color: string;
  /** Text shown next to the swatch in the legend. */
  readonly label: string;
}

/** Options for {@link renderLegend}. */
interface RenderLegendOptions {
  /** Array of items to render in order. */
  readonly items: readonly LegendItem[];
  /** X offset applied to the legend group (default: 0). */
  readonly x?: number;
  /** Y offset applied to the legend group (default: 0). */
  readonly y?: number;
}

/**
 * Render a vertical legend into the provided SVG selection.
 *
 * Visual properties (font size, label colour, swatch size, row spacing) are
 * controlled by CSS custom properties written by {@link applyThemeCssVars}:
 * - `--vl-legend-symbol-size` — swatch square size (px, default 12)
 * - `--vl-legend-item-spacing` — gap between swatch+label and between rows (px, default 8)
 * - `--vl-legend-font-size` — label font size
 * - `--vl-text` — label text colour
 *
 * Numeric layout values (swatch size, row height) are read from the resolved
 * CSS custom properties via `getComputedStyle` so they correctly reflect any
 * active theme override.
 *
 * @param svg - D3 SVG selection to render into.
 * @param options - Rendering options. `items` is required.
 * @example
 * ```ts
 * renderLegend(svgSelection, { items: [{ label: 'Series A', color: '#1f77b4' }] });
 * ```
 */
export const renderLegend = (
  svg: SVGSelection,
  { items, x = 0, y = 0 }: RenderLegendOptions,
): void => {
  const node = svg.node();
  const cs = node ? getComputedStyle(node) : null;
  const symbolSize = cs
    ? parseFloat(cs.getPropertyValue("--vl-legend-symbol-size")) || 12
    : 12;
  const itemSpacing = cs
    ? parseFloat(cs.getPropertyValue("--vl-legend-item-spacing")) || 8
    : 8;
  const rowHeight = symbolSize + itemSpacing;

  const legendGroup = svg
    .selectAll<SVGGElement, null>("g.legend")
    .data([null])
    .join("g")
    .attr("class", "legend")
    .attr("transform", `translate(${String(x)},${String(y)})`);

  const entries = legendGroup
    .selectAll<SVGGElement, LegendItem>("g.legend-entry")
    .data(items)
    .join("g")
    .attr("class", "legend-entry")
    .attr("transform", (_, i) => `translate(0,${String(i * rowHeight)})`);

  entries
    .selectAll<SVGRectElement, LegendItem>("rect.swatch")
    .data((d) => [d])
    .join("rect")
    .attr("class", "swatch")
    .attr("width", symbolSize)
    .attr("height", symbolSize)
    .attr("rx", 2)
    .attr("fill", (d) => d.color);

  entries
    .selectAll<SVGTextElement, LegendItem>("text.legend-label")
    .data((d) => [d])
    .join("text")
    .attr("class", "legend-label")
    .attr("x", symbolSize + itemSpacing)
    .attr("y", symbolSize / 2)
    .attr("dominant-baseline", "middle")
    .style("font-size", "var(--vl-legend-font-size, 12px)")
    .style("fill", "var(--vl-text, #222222)")
    .text((d) => d.label);
};
