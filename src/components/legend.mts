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

/** Options for {@link renderLegend}.
 *
 * `items` is required; other fields have sensible defaults used when omitted.
 */
interface RenderLegendOptions {
  /** Font size for legend labels. Can be a CSS string (e.g. '12px') or a numeric value. */
  readonly fontSize?: number | string;
  /** Gap in pixels between the swatch and the label, and between rows. */
  readonly gap?: number;
  /** Array of items to render in order. */
  readonly items: readonly LegendItem[];
  /** Color applied to the label text. */
  readonly labelColor?: string;
  /** Size in pixels of the legend swatch (square). */
  readonly swatchSize?: number;
  /** X offset applied to the legend group. */
  readonly x?: number;
  /** Y offset applied to the legend group. */
  readonly y?: number;
}

/**
 * Render a vertical legend into the provided SVG selection.
 *
 * This function will create or update a single <g class="legend"> group at
 * the provided (x,y) transform and populate it with one <g class="legend-entry"> per
 * item. Each entry contains a rectangular swatch and a label. Existing legend
 * content is joined and updated (idempotent for the same `items` order).
 *
 * @param svg - D3-like SVG selection to render into.
 * @param options - Rendering options. `items` is required and controls order.
 * @example
 * ```ts
 * renderLegend(svgSelection, { items: [{ label: 'Series A', color: '#1f77b4' }] });
 * ```
 */
export const renderLegend = (
  svg: SVGSelection,
  {
    fontSize = "var(--vl-legend-font-size, 12px)",
    gap = 6,
    items,
    labelColor = "var(--vl-text, #333)",
    swatchSize = 12,
    x = 0,
    y = 0,
  }: RenderLegendOptions,
): void => {
  const legendGroup = svg
    .selectAll<SVGGElement, null>("g.legend")
    .data([null])
    .join("g")
    .attr("class", "legend")
    .attr("transform", `translate(${String(x)},${String(y)})`);

  const rowHeight = swatchSize + gap;

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
    .attr("width", swatchSize)
    .attr("height", swatchSize)
    .attr("rx", 2)
    .attr("fill", (d) => d.color);

  entries
    .selectAll<SVGTextElement, LegendItem>("text.legend-label")
    .data((d) => [d])
    .join("text")
    .attr("class", "legend-label")
    .attr("x", swatchSize + gap)
    .attr("y", swatchSize / 2)
    .attr("dominant-baseline", "middle")
    .attr("font-size", fontSize)
    .attr("fill", labelColor)
    .text((d) => d.label);
};
