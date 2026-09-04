import type { BoundsSelection } from "@/types/index.mjs";
import type { AnyScale } from "@/types/index.mjs";

// ─── Types (duplicated here for early implementation; will be in chartTypes.mts) ───

export interface ReferenceLine {
  /** "y" renders a horizontal line at a y-domain value; "x" renders vertical. */
  readonly axis: "x" | "y";
  readonly label?: string;
  readonly value: Date | number;
}

export interface RenderReferenceLinesOptions {
  readonly innerHeight: number;
  readonly innerWidth: number;
  readonly lines: readonly ReferenceLine[];
  readonly xScale: AnyScale;
  readonly yScale: AnyScale;
}

export interface WithReferenceLinesOptions {
  readonly lines: readonly ReferenceLine[];
}

// ─── Renderer ────────────────────────────────────────────────────────────────

import { asScaleNumber } from "@/utils/scaleCast.mjs";

/**
 * Renders reference lines (horizontal or vertical dashed lines at data values).
 *
 * Each reference line is rendered as a `<g class="reference-line">` containing:
 * - a `<line class="reference-line-stroke">` for the dashed line
 * - an optional `<text class="reference-line-label">` when label is provided
 *
 * Visual appearance is fully controlled by CSS custom properties:
 * - `--vl-reference-line-stroke` — line colour (default: #94a3b8)
 * - `--vl-reference-line-stroke-width` — line width (default: 1)
 * - `--vl-reference-line-dash-array` — dash pattern (default: 6 6)
 * - `--vl-reference-line-stroke-linecap` — line cap (default: round)
 * - `--vl-reference-line-label-fill` — label colour (default: #64748b)
 * - `--vl-reference-line-label-font-size` — label font size (default: 12px)
 *
 * @param boundSelection - D3 selection (typically the content group) where lines are rendered.
 * @param options - Reference line options including scale information.
 */
export const renderReferenceLines = (
  boundSelection: BoundsSelection,
  options: RenderReferenceLinesOptions,
): void => {
  const { innerHeight, innerWidth, lines, xScale, yScale } = options;
  const xAsNumber = asScaleNumber(xScale);
  const yAsNumber = asScaleNumber(yScale);

  // Join on g.reference-line
  const groups = boundSelection
    .selectAll<SVGGElement, ReferenceLine>("g.reference-line")
    .data(lines, (d) => `${d.axis}-${d.value}`);

  // Remove exited groups
  groups.exit().remove();

  // Enter new groups
  const entered = groups.enter().append("g").attr("class", "reference-line");

  // Add line element to entered groups
  entered.append("line").attr("class", "reference-line-stroke");

  // Merge enter + update
  const merged = entered.merge(groups);

  // Apply properties to all groups
  merged.each(function (d) {
    const g = this as SVGGElement;
    const lineEl = g.querySelector("line.reference-line-stroke") as null | SVGLineElement;
    const textEl = g.querySelector("text.reference-line-label") as null | SVGTextElement;

    if (!lineEl) return;

    if (d.axis === "y") {
      // Horizontal line at y-domain value
      const yPos = yAsNumber(d.value);
      if (!Number.isFinite(yPos)) {
        lineEl.setAttribute("visibility", "hidden");
        return;
      }
      lineEl.setAttribute("visibility", "");
      lineEl.setAttribute("x1", "0");
      lineEl.setAttribute("x2", String(innerWidth));
      lineEl.setAttribute("y1", String(yPos));
      lineEl.setAttribute("y2", String(yPos));

      if (d.label !== undefined) {
        // Add text element only when label is present
        if (!textEl) {
          const newText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          newText.setAttribute("class", "reference-line-label");
          newText.setAttribute("fill", "var(--vl-reference-line-label-fill, #64748b)");
          newText.setAttribute("font-size", "var(--vl-reference-line-label-font-size, 12px)");
          g.appendChild(newText);
        }
        const t = g.querySelector("text.reference-line-label") as SVGTextElement;
        t.setAttribute("visibility", "");
        t.setAttribute("x", String(innerWidth));
        t.setAttribute("y", String(yPos - 4));
        t.setAttribute("text-anchor", "end");
        t.textContent = d.label;
      } else if (textEl) {
        textEl.remove();
      }
    } else {
      // Vertical line at x-domain value
      const xPos = xAsNumber(d.value);
      if (!Number.isFinite(xPos)) {
        lineEl.setAttribute("visibility", "hidden");
        return;
      }
      lineEl.setAttribute("visibility", "");
      lineEl.setAttribute("x1", String(xPos));
      lineEl.setAttribute("x2", String(xPos));
      lineEl.setAttribute("y1", "0");
      lineEl.setAttribute("y2", String(innerHeight));

      if (d.label !== undefined) {
        if (!textEl) {
          const newText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          newText.setAttribute("class", "reference-line-label");
          newText.setAttribute("fill", "var(--vl-reference-line-label-fill, #64748b)");
          newText.setAttribute("font-size", "var(--vl-reference-line-label-font-size, 12px)");
          g.appendChild(newText);
        }
        const t = g.querySelector("text.reference-line-label") as SVGTextElement;
        t.setAttribute("visibility", "");
        t.setAttribute("x", String(xPos + 5));
        t.setAttribute("y", "12");
        t.setAttribute("text-anchor", "start");
        t.textContent = d.label;
      } else if (textEl) {
        textEl.remove();
      }
    }
  });

  // Apply CSS styling to all line elements
  merged
    .select("line.reference-line-stroke")
    .attr("stroke", "var(--vl-reference-line-stroke, #94a3b8)")
    .attr("stroke-width", "var(--vl-reference-line-stroke-width, 1)")
    .attr("stroke-dasharray", "var(--vl-reference-line-dash-array, 6 6)")
    .attr("stroke-linecap", "var(--vl-reference-line-stroke-linecap, round)")
    .attr("shape-rendering", "crispEdges");
};
