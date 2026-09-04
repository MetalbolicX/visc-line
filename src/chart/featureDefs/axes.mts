/**
 * Axes feature definition.
 *
 * - Options: WithAxesOptions { xTickCount?, xTickFormat?, yTickCount?, yTickFormat?, timeTickFormat? }
 * - Comparator: areAxesOptionsEqual
 * - Zoom-path: participates (re-renders on zoom)
 * - DOM cleanup: g.x-axis, g.y-axis, text.x-axis-label, text.y-axis-label
 *
 * @module featureDefs/axes
 * @internal
 */

import { timeFormat } from "d3";

import type { WithAxesOptions } from "@/chart/chartTypes.mjs";
import type { FeatureDefinition } from "@/chart/featureContext.mjs";
import type { ScaleType } from "@/types/index.mjs";

import { areAxesOptionsEqual } from "@/chart/featureComparators.mjs";
import { renderXAxisLabel, renderYAxisLabel } from "@/components/axisLabel.mjs";
import { renderXAxis } from "@/components/xAxis.mjs";
import { renderYAxis } from "@/components/yAxis.mjs";

// ─── File-local helpers ───────────────────────────────────────────────────────

type TickFormat = (domainValue: import("d3").AxisDomain, index: number) => string;

const resolveEffectiveXTickFormat = (
  xType: ScaleType,
  axesOptions: WithAxesOptions,
): TickFormat | undefined =>
  xType === "time" && axesOptions.timeTickFormat !== undefined
    ? typeof axesOptions.timeTickFormat === "string"
      ? (timeFormat(axesOptions.timeTickFormat) as TickFormat)
      : (axesOptions.timeTickFormat as TickFormat)
    : axesOptions.xTickFormat;

// ─── Feature definition ───────────────────────────────────────────────────────

export const axesDef: FeatureDefinition<"axes"> = {
  clearSelectors: ["g.x-axis, g.y-axis", "text.x-axis-label, text.y-axis-label"],
  flagKey: "hasAxes",
  isEqual: areAxesOptionsEqual,
  key: "axes",
  onZoomRedraw: (ctx, dims, newX, newY) => {
    if (!ctx.flags.hasAxes) return;
    const { xTickCount, yTickCount, yTickFormat } = ctx.state.axesOptions;
    const effectiveXTickFormat = resolveEffectiveXTickFormat(ctx.xType, ctx.state.axesOptions);
    ctx.bounds.call(renderXAxis, newX, dims.innerHeight, {
      tickCount: xTickCount,
      tickFormat: effectiveXTickFormat,
    });
    ctx.bounds.call(renderYAxis, newY, {
      tickCount: yTickCount,
      tickFormat: yTickFormat,
    });
  },

  optionsKey: "axesOptions",

  render: (ctx, dims) => {
    if (!ctx.flags.hasAxes) return;
    const { xTickCount, yTickCount, yTickFormat } = ctx.state.axesOptions;
    const effectiveXTickFormat = resolveEffectiveXTickFormat(ctx.xType, ctx.state.axesOptions);
    ctx.bounds
      .call(renderXAxis, ctx.xScale, dims.innerHeight, {
        tickCount: xTickCount,
        tickFormat: effectiveXTickFormat,
      })
      .call(renderYAxis, ctx.yScale, {
        tickCount: yTickCount,
        tickFormat: yTickFormat,
      });
    ctx.svg
      .call(renderXAxisLabel, {
        innerHeight: dims.innerHeight,
        innerWidth: dims.innerWidth,
        label: ctx.config.xSerie.label,
        margins: dims.margins,
      })
      .call(renderYAxisLabel, {
        innerHeight: dims.innerHeight,
        innerWidth: dims.innerWidth,
        label: ctx.yLabel ?? ctx.config.ySeries[0]?.label ?? "Value",
        margins: dims.margins,
      });
  },
};
