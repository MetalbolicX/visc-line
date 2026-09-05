/**
 * Per-feature option comparators for change detection.
 *
 * Each comparator is used as the `isEqual` field in a FeatureDefinition.
 * They implement shallow value equality for the feature's options object.
 *
 * @module featureComparators
 * @internal
 */

import type { WithAxesOptions, WithEndLabelsOptions, WithGridOptions, WithLegendOptions, WithTitleOptions, WithTooltipOptions, WithZoomPanOptions } from "@/chart/chartTypes.mjs";

/**
 * Shallow equality for WithAxesOptions.
 * Compares xTickCount, xTickFormat, yTickCount, yTickFormat.
 */
export const areAxesOptionsEqual = (a: unknown, b: unknown): boolean => {
  const pa = a as WithAxesOptions;
  const pb = b as WithAxesOptions;
  const prevX = pa.xTickCount ?? 5;
  const prevY = pa.yTickCount ?? 5;
  const nextX = pb.xTickCount ?? 5;
  const nextY = pb.yTickCount ?? 5;
  return (
    prevX === nextX &&
    pa.xTickFormat === pb.xTickFormat &&
    prevY === nextY &&
    pa.yTickFormat === pb.yTickFormat
  );
};

/**
 * Shallow equality for WithGridOptions.
 * Compares showX, showY.
 */
export const areGridOptionsEqual = (a: unknown, b: unknown): boolean => {
  const pa = a as WithGridOptions;
  const pb = b as WithGridOptions;
  return (
    (pa.showX ?? true) === (pb.showX ?? true) &&
    (pa.showY ?? true) === (pb.showY ?? true)
  );
};

/**
 * Shallow equality for WithTitleOptions.
 * Compares title string.
 */
export const areTitleOptionsEqual = (a: unknown, b: unknown): boolean => {
  const pa = a as null | WithTitleOptions;
  const pb = b as WithTitleOptions;
  return pa?.title === pb.title;
};

/**
 * Shallow equality for WithEndLabelsOptions.
 * Compares collision, format, and offset.
 */
export const areEndLabelsOptionsEqual = (a: unknown, b: unknown): boolean => {
  const pa = a as null | WithEndLabelsOptions;
  const pb = b as WithEndLabelsOptions;
  if (pa == null) return false;
  if ((pa.collision ?? "nudge") !== (pb.collision ?? "nudge")) return false;
  if (pa.format !== pb.format) return false;
  if ((pa.offset ?? 8) !== (pb.offset ?? 8)) return false;
  return true;
};

/**
 * Shallow equality for WithLegendOptions.
 * Compares interactive flag, onToggle callback reference, and items array.
 */
export const areLegendOptionsEqual = (a: unknown, b: unknown): boolean => {
  const pa = a as null | WithLegendOptions;
  const pb = b as WithLegendOptions;
  if (!pa) return false;
  if ((pa.interactive ?? false) !== (pb.interactive ?? false)) return false;
  if (pa.onToggle !== pb.onToggle) return false;
  const prevItems = pa.items;
  const nextItems = pb.items;
  if (prevItems == null && nextItems == null) return true;
  if (prevItems == null || nextItems == null) return false;
  if (prevItems.length !== nextItems.length) return false;
  for (const [index, prevItem] of prevItems.entries()) {
    const nextItem = nextItems[index];
    if (!nextItem) return false;
    if (prevItem.color !== nextItem.color || prevItem.label !== nextItem.label) return false;
  }
  return true;
};

/**
 * Shallow equality for WithTooltipOptions.
 * Compares formatX, formatY, stylesheetUrl, tooltipHtml.
 */
export const areTooltipOptionsEqual = (a: unknown, b: unknown): boolean => {
  const pa = a as WithTooltipOptions;
  const pb = b as WithTooltipOptions;
  return (
    pa.formatX === pb.formatX &&
    pa.formatY === pb.formatY &&
    pa.stylesheetUrl === pb.stylesheetUrl &&
    pa.tooltipHtml === pb.tooltipHtml
  );
};

/**
 * Shallow equality for WithZoomPanOptions.
 * Compares onZoom callback reference and scaleExtent tuple.
 */
export const areZoomPanOptionsEqual = (a: unknown, b: unknown): boolean => {
  const pa = a as WithZoomPanOptions;
  const pb = b as WithZoomPanOptions;
  if (pa.onZoom !== pb.onZoom) return false;
  const prevExtent = pa.scaleExtent;
  const nextExtent = pb.scaleExtent;
  if (prevExtent === nextExtent) return true;
  if (prevExtent === undefined || nextExtent === undefined) return false;
  return prevExtent[0] === nextExtent[0] && prevExtent[1] === nextExtent[1];
};
