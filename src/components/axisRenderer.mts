import type { AxisDomain, AxisScale } from "d3";

import { axisBottom, axisLeft } from "d3";

import { asAxisScale } from "@/utils/axisScale.mjs";
import { readCssNumber } from "@/utils/cssVariables.mjs";
import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

// ── Internal shared axis renderer ─────────────────────────────────────────────
// NOT exported from the package index. Use renderXAxis / renderYAxis instead.

/** Shared options shape for axis rendering. */
interface AxisRenderOptions {
  readonly tickCount?: number;
  readonly tickFormat?: (domainValue: AxisDomain, index: number) => string;
}

type AxisGenerator = typeof axisBottom | typeof axisLeft;

interface OrientationConfig {
  readonly axis: AxisGenerator;
  readonly className: "x-axis" | "y-axis";
  /**
   * Transform to apply to the axis <g> element, or null if no transform needed.
   * Receives innerHeight so the x-axis can be positioned at the bottom.
   */
  readonly applyTransform: ((innerHeight: number) => string) | null;
}

const ORIENTATION_CONFIG: Record<"x" | "y", OrientationConfig> = {
  x: {
    axis: axisBottom,
    className: "x-axis",
    applyTransform: (innerHeight) => `translate(0,${String(innerHeight)})`,
  },
  y: {
    axis: axisLeft,
    className: "y-axis",
    applyTransform: null,
  },
} as const;

/**
 * Shared axis renderer parameterized by orientation.
 *
 * All visual attributes (tick size, tick padding, font size, colour) are read
 * from CSS custom properties via `readCssNumber` so they correctly reflect the
 * active theme without hardcoded fallbacks.
 *
 * The `.data([null]).join("g")` pattern ensures idempotent rendering — the
 * axis group is created once and updated on subsequent calls.
 */
const renderAxis = (
  orientation: "x" | "y",
  boundsGroup: BoundsSelection,
  scale: AnyScale,
  innerHeight: number,
  { tickCount = 5, tickFormat }: AxisRenderOptions = {},
): void => {
  const node = boundsGroup.node();
  const config = ORIENTATION_CONFIG[orientation];

  const tickSize = node ? readCssNumber(node, "--vl-axis-tick-size", 6) : 6;
  const tickPadding = node ? readCssNumber(node, "--vl-axis-tick-padding", 8) : 8;

  const axisFn = config.axis;
  const axisInstance = axisFn(asAxisScale(scale) as AxisScale<AxisDomain>)
    .ticks(tickCount)
    .tickSize(tickSize)
    .tickPadding(tickPadding);
  if (tickFormat) axisInstance.tickFormat(tickFormat);

  const g = boundsGroup
    .selectAll<SVGGElement, null>(`g.${config.className}`)
    .data([null])
    .join("g")
    .attr("class", config.className)
    .attr(
      "transform",
      config.applyTransform ? config.applyTransform(innerHeight) : null,
    )
    .call(axisInstance);

  g.selectAll<SVGTextElement, unknown>("text")
    .style("fill", "var(--vl-axis-color, #333333)")
    .style("font-size", "var(--vl-axis-font-size, 12px)");
};

export { renderAxis };
