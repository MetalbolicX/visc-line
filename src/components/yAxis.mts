import type { AxisDomain } from "d3";

import { renderAxis } from "@/components/axisRenderer.mjs";
import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

/** Options for {@link renderYAxis}. */
export interface RenderYAxisOptions {
  /** Preferred number of ticks to request from the axis generator. */
  readonly tickCount?: number;
  /** Optional formatter for tick labels. */
  readonly tickFormat?: (domainValue: AxisDomain, index: number) => string;
}

/**
 * Render a left-oriented Y axis into the provided bounds group.
 *
 * Tick size, tick padding, tick label font size, and tick label colour are
 * driven by CSS custom properties (`--vl-axis-tick-size`, `--vl-axis-tick-padding`,
 * `--vl-axis-font-size`, `--vl-axis-color`) written by {@link applyThemeCssVars}.
 * Numeric values are resolved via `readCssNumber` because D3's
 * `.tickSize()` / `.tickPadding()` require actual numbers.
 *
 * @param boundsGroup - D3 selection of the container group where the axis is rendered.
 * @param yScale - D3 scale used to generate the axis. Must implement `copy()` and `range()`.
 * @param options.tickCount - Preferred number of ticks (default 5).
 * @param options.tickFormat - Optional formatter for tick labels.
 * @example
 * ```ts
 * renderYAxis(boundsG, yScale, { tickCount: 6, tickFormat: (v) => `${v}%` });
 * ```
 */
export const renderYAxis = (
  boundsGroup: BoundsSelection,
  yScale: AnyScale,
  opts: RenderYAxisOptions = {},
): void => {
  renderAxis("y", boundsGroup, yScale, 0, opts);
};
