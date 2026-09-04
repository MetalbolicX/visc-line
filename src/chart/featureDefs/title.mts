/**
 * Title feature definition.
 *
 * - Options: WithTitleOptions { title }
 * - Comparator: areTitleOptionsEqual
 * - Zoom-path: excluded (title does not re-render on zoom)
 * - DOM cleanup: text.chart-title
 *
 * @module featureDefs/title
 * @internal
 */

import type { FeatureDefinition } from "@/chart/featureContext.mjs";

import { areTitleOptionsEqual } from "@/chart/featureComparators.mjs";
import { renderTitle } from "@/components/title.mjs";

export const titleDef: FeatureDefinition<"title"> = {
  clearSelectors: ["text.chart-title"],
  flagKey: "hasTitle",
  isEqual: areTitleOptionsEqual,
  key: "title",
  optionsKey: "titleOptions",
  render: (ctx, dims) => {
    if (!ctx.flags.hasTitle || !ctx.state.titleOptions) return;
    ctx.svg.call(renderTitle, {
      margins: dims.margins,
      title: ctx.state.titleOptions.title,
      width: dims.width,
    });
  },
};
