import type { SVGSelection } from "@/types/index.mjs";

/** A single entry in the legend. */
export interface LegendItem {
  label: string;
  color: string;
}

/** Options for {@link renderLegend}. */
interface RenderLegendOptions {
  items: LegendItem[];
  x?: number;
  y?: number;
  fontSize?: number;
  swatchSize?: number;
  gap?: number;
}

/**
 * Renders a compact legend inside the given SVG selection.
 *
 * Creates a single <g class="legend"> translated to (x, y). For each entry in
 * options.items a <g class="legend-entry"> row is created containing a rounded
 * rectangle (.swatch) filled with the item's color and a text (.legend-label)
 * positioned to the right of the swatch.
 *
 * @param svg - D3 selection of the SVG container to render the legend into.
 * @param options - Rendering options.
 * @param options.items - Array of legend items. Each item should include:
 *                         { label: string, color: string }.
 * @param options.x - Horizontal translation of the legend group (px). Default: 0.
 * @param options.y - Vertical translation of the legend group (px). Default: 0.
 * @param options.fontSize - Font size for labels (px). Default: 12.
 * @param options.swatchSize - Width and height of the color swatch (px). Default: 12.
 * @param options.gap - Gap (px) used between swatch and label and between rows. Default: 6.
 *
 * @returns void
 */
export const renderLegend = (
  svg: SVGSelection,
  {
    items,
    x = 0,
    y = 0,
    fontSize = 12,
    swatchSize = 12,
    gap = 6,
  }: RenderLegendOptions,
): void => {
  const legendGroup = svg
    .selectAll<SVGGElement, null>("g.legend")
    .data([null])
    .join("g")
    .attr("class", "legend")
    .attr("transform", `translate(${x},${y})`);

  const rowHeight = swatchSize + gap;

  const entries = legendGroup
    .selectAll<SVGGElement, LegendItem>("g.legend-entry")
    .data(items)
    .join("g")
    .attr("class", "legend-entry")
    .attr("transform", (_, i) => `translate(0,${i * rowHeight})`);

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
    .attr("fill", "#333")
    .text((d) => d.label);
};
