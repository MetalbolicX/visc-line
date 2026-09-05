import { select } from "d3";
import type { Selection } from "d3";

import type { AnyScale, BoundsSelection, ProcessedSeries } from "@/types/index.mjs";

export interface RenderEndLabelsOptions {
  readonly collision?: "hide" | "legend" | "nudge";
  readonly format?: (label: string, lastValue: number) => string;
  readonly offset?: number;
}

interface LabelRect<S extends Selection<SVGTextElement, unknown, null, undefined>> {
  readonly node: S;
  readonly y: number;
  readonly height: number;
  readonly label: string;
}

/** Pure collision resolution — testable without getBBox. */
export const resolveCollisions = <S extends Selection<SVGTextElement, unknown, null, undefined>>(
  labels: ReadonlyArray<LabelRect<S>>,
  policy: "hide" | "legend" | "nudge",
  bounds: { minY: number; maxY: number; lineHeight: number },
): { kept: ReadonlyArray<{ node: S; y: number; height: number }>; dropped: readonly string[] } => {
  if (labels.length === 0) return { kept: [], dropped: [] };

  const sorted = [...labels].sort((a, b) => a.y - b.y);
  const requiredGap = (a: LabelRect<S>, b: LabelRect<S>): number =>
    Math.max(bounds.lineHeight, a.height, b.height);
  const hasCollision = sorted.some((label, index) =>
    index > 0 && label.y - sorted[index - 1].y < requiredGap(sorted[index - 1], label),
  );

  if (policy === "legend") {
    return hasCollision
      ? { kept: [], dropped: sorted.map(({ label }) => label) }
      : { kept: sorted.map(({ node, y, height }) => ({ node, y, height })), dropped: [] };
  }

  if (policy === "hide") {
    const kept: Array<{ node: S; y: number; height: number }> = [];
    const dropped: string[] = [];
    for (const label of sorted) {
      const previous = kept.at(-1);
      if (previous && label.y - previous.y < Math.max(bounds.lineHeight, label.height, previous.height)) {
        dropped.push(label.label);
      } else {
        kept.push({ node: label.node, y: label.y, height: label.height });
      }
    }
    return { kept, dropped };
  }

  const kept: Array<{ node: S; y: number; height: number }> = [];
  const dropped: string[] = [];
  for (const label of sorted) {
    const previous = kept.at(-1);
    const y = previous === undefined
      ? Math.max(bounds.minY, label.y)
      : Math.max(label.y, previous.y + Math.max(bounds.lineHeight, previous.height, label.height));
    if (y > bounds.maxY) {
      dropped.push(label.label);
    } else {
      kept.push({ node: label.node, y, height: label.height });
    }
  }
  return { kept, dropped };
};

export const renderEndLabels = <T,>(
  content: BoundsSelection,
  series: readonly ProcessedSeries<T>[],
  xScale: AnyScale,
  yScale: AnyScale,
  xAccessor: (d: T) => unknown,
  options: RenderEndLabelsOptions,
): void => {
  const { collision = "nudge", format, offset = 8 } = options;
  const labelsPerSeries = series.map((serie) => {
    let last = serie.data[0];
    let maxX = -Infinity;
    for (const datum of serie.data) {
      const xValue = Number(xAccessor(datum));
      if (Number.isFinite(xValue) && xValue > maxX) {
        maxX = xValue;
        last = datum;
      }
    }
    if (last === undefined) return null;
    const lastValue = serie.accessor(last);
    return {
      label: serie.label,
      text: format ? format(serie.label, Number(lastValue as number)) : serie.label,
      x: xScale(xAccessor(last) as number) as number,
      y: yScale(lastValue as number) as number,
    };
  }).filter((value): value is { label: string; text: string; x: number; y: number } => value !== null);

  const selection = content.selectAll<SVGTextElement, (typeof labelsPerSeries)[number]>("text.end-label")
    .data(labelsPerSeries, (datum) => datum.label);
  const enter = selection.enter().append("text")
    .attr("class", (datum) => `end-label end-label--${datum.label}`)
    .attr("dominant-baseline", "middle")
    .style("fill", "var(--vl-label-color, currentColor)")
    .style("font-size", "var(--vl-label-font-size, 12px)")
    .style("font-weight", "var(--vl-label-font-weight, 600)");
  const merged = selection.merge(enter)
    .attr("x", (datum) => datum.x + offset)
    .attr("y", (datum) => datum.y)
    .text((datum) => datum.text);
  selection.exit().remove();

  if (typeof (content.node() as unknown as { getBBox?: unknown }).getBBox !== "function" && collision === "nudge") return;

  const measured = merged.nodes().map((node, index) => {
    const rect = (node as unknown as SVGGraphicsElement).getBBox();
    return { height: rect.height, label: labelsPerSeries[index].label, node: select(node), y: labelsPerSeries[index].y };
  });
  const contentBox = (content.node() as SVGGElement).getBBox();
  const { kept, dropped } = resolveCollisions(measured, collision, {
    lineHeight: 16,
    maxY: contentBox.y + contentBox.height,
    minY: contentBox.y,
  });

  if (kept.length === 0 && collision === "legend") {
    console.warn("visc-line: endLabels collision=\"legend\" policy and overlap detected; rendering no labels. Consider chart.withLegend() instead.");
    merged.remove();
    return;
  }

  if (dropped.length > 0) {
    console.warn(`visc-line: endLabels dropped ${dropped.length} label(s) due to collision: ${dropped.join(", ")}`);
  }
  const keptByNode = new Map(kept.map((item) => [item.node.node(), item]));
  merged.filter(function () { return !keptByNode.has(this); }).remove();
  merged.each(function () {
    const keptLabel = keptByNode.get(this);
    if (keptLabel) select(this).attr("y", keptLabel.y);
  });
};
