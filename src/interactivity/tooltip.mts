import { bisector, pointer, select } from "d3";
import type {
  AnyScale,
  BoundsSelection,
  ProcessedSeries,
} from "@/types/index.mjs";

const PAD = 10;
const ROW_H = 18;
const HEADER_H = 22;
const BOX_W = 155;

/** Options for {@link addTooltip}. */
interface AddTooltipOptions<T> {
  innerWidth: number;
  innerHeight: number;
  formatX?: (v: unknown) => string;
  formatY?: (v: unknown) => string;
}

/**
 * Attach a multi-series tooltip to a bounds group.
 *
 * Renders one cursor dot per series, a vertical cursor line, and a tooltip box
 * with one value row per series. All elements are built idempotently so this
 * function is safe to call on every render cycle.
 *
 * @param boundsGroup - D3 selection of the bounds group.
 * @param series - Processed series array.
 * @param xScale - D3 scale for the x axis.
 * @param yScale - D3 scale for the y axis.
 * @param xAccessor - Shared x-accessor function.
 * @param options - Optional configuration including dimensions and formatters.
 */
export const addTooltip = <T,>(
  boundsGroup: BoundsSelection,
  series: ProcessedSeries<T>[],
  xScale: AnyScale,
  yScale: AnyScale,
  xAccessor: (d: T) => unknown,
  {
    innerWidth,
    innerHeight,
    formatX = (v) => (v instanceof Date ? v.toLocaleDateString() : String(v)),
    formatY = (v) => (typeof v === "number" ? v.toLocaleString() : String(v)),
  }: AddTooltipOptions<T> = { innerWidth: 0, innerHeight: 0 },
): void => {
  const referenceData = series[0]?.data ?? [];
  const bisect = bisector(xAccessor).center;
  const BOX_H = HEADER_H + series.length * ROW_H + PAD;

  // ── Layer ────────────────────────────────────────────────────────────────
  const tooltipLayer = boundsGroup
    .selectAll<SVGGElement, null>("g.tooltip-layer")
    .data([null])
    .join("g")
    .attr("class", "tooltip-layer");

  // ── Cursor line ──────────────────────────────────────────────────────────
  const cursorLine = tooltipLayer
    .selectAll<SVGLineElement, null>("line.cursor-line")
    .data([null])
    .join("line")
    .attr("class", "cursor-line")
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", "#aaa")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4 3")
    .attr("pointer-events", "none")
    .attr("display", "none");

  // ── One dot per series ───────────────────────────────────────────────────
  const cursorDots = tooltipLayer
    .selectAll<SVGCircleElement, ProcessedSeries<T>>("circle.cursor-dot")
    .data(series, ({ label }) => label)
    .join("circle")
    .attr("class", ({ label }) => `cursor-dot cursor-dot--${label}`)
    .attr("r", 5)
    .attr("fill", ({ stroke }) => stroke ?? "steelblue")
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("pointer-events", "none")
    .attr("display", "none");

  // ── Tooltip box ──────────────────────────────────────────────────────────
  const tooltipGroup = tooltipLayer
    .selectAll<SVGGElement, null>("g.tooltip-box")
    .data([null])
    .join("g")
    .attr("class", "tooltip-box")
    .attr("pointer-events", "none")
    .attr("display", "none");

  tooltipGroup
    .selectAll<SVGRectElement, null>("rect.tooltip-bg")
    .data([null])
    .join("rect")
    .attr("class", "tooltip-bg")
    .attr("width", BOX_W)
    .attr("height", BOX_H)
    .attr("rx", 4)
    .attr("fill", "white")
    .attr("stroke", "#ddd")
    .attr("stroke-width", 1)
    .style("filter", "drop-shadow(0 1px 4px rgba(0,0,0,0.12))");

  // Header: x value
  const headerText = tooltipGroup
    .selectAll<SVGTextElement, null>("text.tip-header")
    .data([null])
    .join("text")
    .attr("class", "tip-header")
    .attr("x", PAD)
    .attr("y", HEADER_H - 6)
    .attr("font-size", 11)
    .attr("font-weight", "bold")
    .attr("fill", "#555");

  // One row per series
  const seriesRows = tooltipGroup
    .selectAll<SVGGElement, ProcessedSeries<T>>("g.tip-series-row")
    .data(series, ({ label }) => label)
    .join("g")
    .attr("class", ({ label }) => `tip-series-row tip-series-row--${label}`)
    .attr("transform", (_, i) => `translate(0,${HEADER_H + i * ROW_H})`);

  seriesRows
    .selectAll<SVGCircleElement, ProcessedSeries<T>>("circle.tip-swatch")
    .data((d) => [d])
    .join("circle")
    .attr("class", "tip-swatch")
    .attr("cx", PAD + 4)
    .attr("cy", ROW_H / 2)
    .attr("r", 4)
    .attr("fill", ({ stroke }) => stroke ?? "steelblue");

  const seriesValueTexts = seriesRows
    .selectAll<SVGTextElement, ProcessedSeries<T>>("text.tip-value")
    .data((d) => [d])
    .join("text")
    .attr("class", "tip-value")
    .attr("x", PAD + 14)
    .attr("y", ROW_H / 2 + 1)
    .attr("dominant-baseline", "middle")
    .attr("font-size", 11)
    .attr("fill", "#222");

  // ── Mouse capture ────────────────────────────────────────────────────────
  boundsGroup
    .selectAll<SVGRectElement, null>("rect.mouse-capture")
    .data([null])
    .join("rect")
    .attr("class", "mouse-capture")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
    .on("mousemove", (event: MouseEvent) => {
      const [mx] = pointer(event);
      const xVal = (
        xScale as unknown as { invert: (v: number) => unknown }
      ).invert(mx);
      const idx = Math.max(
        0,
        Math.min(
          bisect(referenceData as never[], xVal as never),
          referenceData.length - 1,
        ),
      );
      const refDatum = referenceData[idx];
      if (!refDatum) return;

      const cx = (xScale as (v: unknown) => number)(xAccessor(refDatum));
      cursorLine.attr("x1", cx).attr("x2", cx).attr("display", null);

      cursorDots.each(function (serie) {
        if (!serie.data.length) return;
        const si = Math.max(
          0,
          Math.min(
            bisect(serie.data as never[], xVal as never),
            serie.data.length - 1,
          ),
        );
        select(this)
          .attr(
            "cx",
            (xScale as (v: unknown) => number)(xAccessor(serie.data[si]!)),
          )
          .attr(
            "cy",
            (yScale as (v: unknown) => number)(serie.accessor(serie.data[si]!)),
          )
          .attr("display", null);
      });

      headerText.text(formatX(xAccessor(refDatum)));

      seriesValueTexts.each(function (serie) {
        if (!serie.data.length) {
          select(this).text(`${serie.label}: —`);
          return;
        }
        const si = Math.max(
          0,
          Math.min(
            bisect(serie.data as never[], xVal as never),
            serie.data.length - 1,
          ),
        );
        select(this).text(
          `${serie.label}: ${formatY(serie.accessor(serie.data[si]!))}`,
        );
      });

      const bx = cx + 10 + BOX_W > innerWidth ? cx - BOX_W - 10 : cx + 10;
      const by = Math.max(0, Math.min(20, innerHeight - BOX_H));
      tooltipGroup
        .attr("transform", `translate(${bx},${by})`)
        .attr("display", null);
    })
    .on("mouseleave", () => {
      cursorLine.attr("display", "none");
      cursorDots.attr("display", "none");
      tooltipGroup.attr("display", "none");
    });
};
