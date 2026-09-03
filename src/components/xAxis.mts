import type { AxisDomain } from "d3";

import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

import { renderAxis } from "@/components/axisRenderer.mjs";

/** Options for {@link renderXAxis}. */
export interface RenderXAxisOptions {
  /** Preferred number of axis ticks (positive integer). D3 may adjust this value. */
  readonly tickCount?: number;
  /** Optional formatter for tick labels. */
  readonly tickFormat?: (domainValue: AxisDomain, index: number) => string;
}

/**
 * Render or update an X axis inside the provided bounds group.
 *
 * Tick size, tick padding, tick label font size, and tick label colour are
 * driven by CSS custom properties (`--vl-axis-tick-size`, `--vl-axis-tick-padding`,
 * `--vl-axis-font-size`, `--vl-axis-color`) that are written by
 * {@link applyThemeCssVars} and inherited through the SVG element tree.
 * Numeric values are resolved via `readCssNumber` because D3's
 * `.tickSize()` / `.tickPadding()` require actual numbers.
 *
 * @param boundsGroup - D3 selection of the container group for the axis.
 * @param xScale - D3-compatible scale used to generate ticks. Must implement
 *   `copy()` and `range()`.
 * @param innerHeight - Vertical pixel offset at which the x-axis is positioned.
 * @param options.tickCount - Preferred number of ticks; D3 may adjust.
 * @param options.tickFormat - Optional formatter for tick labels.
 */
export const renderXAxis = (
  boundsGroup: BoundsSelection,
  xScale: AnyScale,
  innerHeight: number,
  opts: RenderXAxisOptions = {},
): void => {
  renderAxis("x", boundsGroup, xScale, innerHeight, opts);
};
