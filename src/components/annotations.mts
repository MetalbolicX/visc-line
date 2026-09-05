import type { BoundsSelection } from "@/types/index.mjs";
import type { AnyScale } from "@/types/index.mjs";

// ─── Types (duplicated here for early implementation; will be in chartTypes.mts) ───

export interface ChartAnnotation {
  /** Pixel offsets from the anchor. Defaults: dx = 8, dy = -8. */
  readonly dx?: number;
  readonly dy?: number;
  /** Draw a leader line from anchor to text. Default: false. */
  readonly showConnector?: boolean;
  readonly text: string;
  /** Data coordinate to anchor to. Date when xType is "time". */
  readonly x: Date | number;
  readonly y: number;
}

export interface RenderAnnotationsOptions {
  readonly annotations: readonly ChartAnnotation[];
  readonly xScale: AnyScale;
  readonly yScale: AnyScale;
}

export interface WithAnnotationsOptions {
  readonly annotations: readonly ChartAnnotation[];
}

// ─── Renderer ────────────────────────────────────────────────────────────────

import { asScaleNumber } from "@/utils/scaleCast.mjs";

/**
 * Renders text annotations anchored to data coordinates with optional leader lines.
 *
 * Each annotation is rendered as a `<g class="annotation">` containing:
 * - an optional `<line class="annotation-connector">` when showConnector is true
 * - a `<text class="annotation-text">` for the annotation text
 *
 * Visual appearance is fully controlled by CSS custom properties:
 * - `--vl-annotation-text-fill` — text colour (default: #334155)
 * - `--vl-annotation-text-font-size` — font size (default: 12px)
 * - `--vl-annotation-connector-stroke` — connector colour (default: #94a3b8)
 * - `--vl-annotation-connector-stroke-width` — connector width (default: 1)
 * - `--vl-annotation-connector-dash-array` — connector dash pattern (default: 2 3)
 *
 * @param boundSelection - D3 selection (typically the content group) where annotations are rendered.
 * @param options - Annotation options including scale information.
 */
export const renderAnnotations = (
  boundSelection: BoundsSelection,
  options: RenderAnnotationsOptions,
): void => {
  const { annotations, xScale, yScale } = options;
  const xAsNumber = asScaleNumber(xScale);
  const yAsNumber = asScaleNumber(yScale);

  // Join on g.annotation
  const groups = boundSelection
    .selectAll<SVGGElement, ChartAnnotation>("g.annotation")
    .data(annotations, (d, i) => `${d.x}-${d.y}-${d.text}-${i}`);

  // Remove exited groups
  groups.exit().remove();

  // Enter new groups
  const entered = groups.enter().append("g").attr("class", "annotation");

  // Add connector line element to entered groups (only if showConnector)
  entered
    .filter((d) => d.showConnector === true)
    .append("line")
    .attr("class", "annotation-connector");

  // Add text element to entered groups
  entered.append("text").attr("class", "annotation-text");

  // Merge enter + update
  const merged = entered.merge(groups);

  // Apply properties to all groups
  merged.each(function (d) {
    const g = this as SVGGElement;
    const dx = d.dx ?? 8;
    const dy = d.dy ?? -8;

    // Compute anchor position
    const ax = xAsNumber(d.x);
    const ay = yAsNumber(d.y);

    // Skip if anchor is not finite
    if (!Number.isFinite(ax) || !Number.isFinite(ay)) {
      const lineEl = g.querySelector("line.annotation-connector");
      const textEl = g.querySelector("text.annotation-text");
      if (lineEl) lineEl.setAttribute("visibility", "hidden");
      if (textEl) textEl.setAttribute("visibility", "hidden");
      return;
    }

    // Handle connector
    const lineEl = g.querySelector("line.annotation-connector") as null | SVGLineElement;
    if (d.showConnector === true) {
      if (lineEl) {
        lineEl.setAttribute("visibility", "");
        lineEl.setAttribute("x1", String(ax));
        lineEl.setAttribute("y1", String(ay));
        lineEl.setAttribute("x2", String(ax + dx));
        lineEl.setAttribute("y2", String(ay + dy));
      }
    } else if (lineEl) {
      lineEl.setAttribute("visibility", "hidden");
    }

    // Handle text
    const textEl = g.querySelector("text.annotation-text") as null | SVGTextElement;
    if (textEl) {
      textEl.setAttribute("visibility", "");
      textEl.setAttribute("x", String(ax + dx));
      textEl.setAttribute("y", String(ay + dy));
      textEl.setAttribute("dy", "0.32em");
      textEl.setAttribute("text-anchor", dx >= 0 ? "start" : "end");
      textEl.textContent = d.text;
    }
  });

  // Apply CSS styling to all connector line elements
  merged
    .select("line.annotation-connector")
    .attr("stroke", "var(--vl-annotation-connector-stroke, #94a3b8)")
    .attr("stroke-width", "var(--vl-annotation-connector-stroke-width, 1)")
    .attr("stroke-dasharray", "var(--vl-annotation-connector-dash-array, 2 3)");

  // Apply CSS styling to all text elements
  merged
    .select("text.annotation-text")
    .attr("fill", "var(--vl-annotation-text-fill, #334155)")
    .attr("font-size", "var(--vl-annotation-text-font-size, 12px)");
};
