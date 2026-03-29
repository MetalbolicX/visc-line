"use strict";
import { bisector, pointer, select } from "d3";

const PAD = 10;
const ROW_H = 18;
const HEADER_H = 22;
const BOX_W = 155;

/**
 * Attach a multi-series tooltip to a bounds group.
 *
 * Renders one cursor dot per series, a vertical cursor line, and a tooltip box
 * with one value row per series. All elements are built idempotently so this
 * function is safe to call on every render cycle.
 *
 * @param {import('d3-selection').Selection} boundsGroup
 * @param {Array<{label: string, stroke: string, accessor: Function, data: Array}>} series
 * @param {Function} xScale
 * @param {Function} yScale
 * @param {Function} xAccessor
 * @param {Object}  [options]
 * @param {number}  [options.innerWidth]
 * @param {number}  [options.innerHeight]
 * @param {Function} [options.formatX]
 * @param {Function} [options.formatY]
 */
export const addTooltip = (
  boundsGroup,
  series,
  xScale,
  yScale,
  xAccessor,
  {
    innerWidth,
    innerHeight,
    formatX = (v) => (v instanceof Date ? v.toLocaleDateString() : String(v)),
    formatY = (v) => (typeof v === "number" ? v.toLocaleString() : String(v)),
  } = {},
) => {
  const referenceData = series[0]?.data ?? [];
  const bisect = bisector(xAccessor).center;
  const BOX_H = HEADER_H + series.length * ROW_H + PAD;

  // ── Layer ────────────────────────────────────────────────────────────────
  const tooltipLayer = boundsGroup
    .selectAll("g.tooltip-layer")
    .data([null])
    .join("g")
    .attr("class", "tooltip-layer");

  // ── Cursor line ──────────────────────────────────────────────────────────
  const cursorLine = tooltipLayer
    .selectAll("line.cursor-line")
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
    .selectAll("circle.cursor-dot")
    .data(series, (d) => d.label)
    .join("circle")
    .attr("class", (d) => `cursor-dot cursor-dot--${d.label}`)
    .attr("r", 5)
    .attr("fill", (d) => d.stroke ?? "steelblue")
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("pointer-events", "none")
    .attr("display", "none");

  // ── Tooltip box ──────────────────────────────────────────────────────────
  const tooltipGroup = tooltipLayer
    .selectAll("g.tooltip-box")
    .data([null])
    .join("g")
    .attr("class", "tooltip-box")
    .attr("pointer-events", "none")
    .attr("display", "none");

  tooltipGroup
    .selectAll("rect.tooltip-bg")
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
    .selectAll("text.tip-header")
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
    .selectAll("g.tip-series-row")
    .data(series, (d) => d.label)
    .join("g")
    .attr("class", (d) => `tip-series-row tip-series-row--${d.label}`)
    .attr("transform", (_, i) => `translate(0,${HEADER_H + i * ROW_H})`);

  seriesRows
    .selectAll("circle.tip-swatch")
    .data((d) => [d])
    .join("circle")
    .attr("class", "tip-swatch")
    .attr("cx", PAD + 4)
    .attr("cy", ROW_H / 2)
    .attr("r", 4)
    .attr("fill", (d) => d.stroke ?? "steelblue");

  const seriesValueTexts = seriesRows
    .selectAll("text.tip-value")
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
    .selectAll("rect.mouse-capture")
    .data([null])
    .join("rect")
    .attr("class", "mouse-capture")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
    .on("mousemove", (event) => {
      const [mx] = pointer(event);
      const xVal = xScale.invert(mx);
      const idx = Math.max(
        0,
        Math.min(bisect(referenceData, xVal), referenceData.length - 1),
      );
      const refDatum = referenceData[idx];
      if (!refDatum) return;

      const cx = xScale(xAccessor(refDatum));
      cursorLine.attr("x1", cx).attr("x2", cx).attr("display", null);

      cursorDots.each(function (serie) {
        if (!serie.data.length) return;
        const si = Math.max(
          0,
          Math.min(bisect(serie.data, xVal), serie.data.length - 1),
        );
        select(this)
          .attr("cx", xScale(xAccessor(serie.data[si])))
          .attr("cy", yScale(serie.accessor(serie.data[si])))
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
          Math.min(bisect(serie.data, xVal), serie.data.length - 1),
        );
        select(this).text(
          `${serie.label}: ${formatY(serie.accessor(serie.data[si]))}`,
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
