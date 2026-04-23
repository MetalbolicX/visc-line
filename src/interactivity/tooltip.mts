import "tipviz";
import type { TipVizTooltip } from "tipviz";

import { bisector, pointer, select } from "d3";

import type {
  AnyScale,
  BoundsSelection,
  ProcessedSeries,
} from "@/types/index.mjs";

// ── Per-chart tooltip instances ───────────────────────────────────────────────

interface TooltipEntry {
  readonly loadedStylesheet: string | undefined;
  readonly tooltip: TipVizTooltip;
}

const tooltipRegistry = new WeakMap<SVGGElement, TooltipEntry>();

// ── Sorting utilities ─────────────────────────────────────────────────────────

type ComparableX = number | string;

/**
 * Normalizes any x-axis value into a comparison-friendly form.
 * Dates become Unix timestamps, numbers stay as-is, bigints become numbers,
 * and everything else becomes a string.
 *
 * @param value - Any x-axis value.
 * @returns A number or string that can be compared with localeCompare or numeric subtraction.
 */
const toComparableX = (value: unknown): ComparableX => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return String(value);
};

/**
 * Compares two ComparableX values for ascending sort order.
 *
 * @param a - Left-hand side of the comparison.
 * @param b - Right-hand side of the comparison.
 * @returns A negative number if a < b, positive if a > b, 0 if equal.
 */
const compareComparableX = (a: ComparableX, b: ComparableX): number => {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
};

/**
 * Returns a new array sorted in ascending order by the x-accessor.
 * Does not mutate the original array.
 *
 * @param data - Array of data items.
 * @param xAccessor - Function returning the x value for each item.
 * @returns A new sorted copy.
 */
const sortDataByX = <T,>(
  data: readonly T[],
  xAccessor: (d: T) => unknown,
): readonly T[] =>
  data.toSorted((a, b) =>
    compareComparableX(
      toComparableX(xAccessor(a)),
      toComparableX(xAccessor(b)),
    ),
  );

// ── Public data types ─────────────────────────────────────────────────────────

/** Data passed to the tooltip renderer. */
export interface TooltipData {
  readonly rows: readonly TooltipRow[];
  readonly xLabel: string;
}

/** One value row in the tooltip body. */
export interface TooltipRow {
  readonly color: string;
  readonly label: string;
  readonly value: string;
}

// ── HTML utilities ────────────────────────────────────────────────────────────

/**
 * Escapes HTML special characters in a string for safe interpolation into
 * HTML text content or double-quoted attributes.
 *
 * @param text - The raw string to escape.
 * @returns A string safe for HTML insertion.
 */
const esc = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Regular expression matching a conservative subset of CSS color values that are
 * considered safe for interpolation into inline style attributes.
 *
 * Supported forms:
 * - Hex colors: #rgb, #rrggbb, and with alpha channel (#rrggbbaa).
 * - Functional colors: rgb(...), rgba(...), hsl(...), hsla(...) with numbers,
 *   percentages, spaces, commas, slashes and decimal alpha values.
 * - CSS custom properties: var(--name) (no fallback syntax is parsed here).
 * - Named colors: simple identifiers like "red", "blue", etc.
 *
 * This pattern is intentionally conservative to reduce the risk of style
 * injection; values that do not match are replaced with a safe fallback.
 */
const safeColorPattern =
  /^(#[0-9a-fA-F]{3,8}|(rgb|hsl)a?\([0-9.%\s,/-]+\)|var\(--[a-zA-Z0-9-_]+\)|[a-zA-Z]+)$/;

/**
 * Validates and sanitizes a CSS color string for safe inline style use.
 * Returns the trimmed value if it matches a recognized CSS color pattern,
 * otherwise falls back to `#999`.
 *
 * @param text - A color value to sanitize.
 * @returns A safe color string.
 */
const safeColor = (text: string): string =>
  safeColorPattern.test(text.trim()) ? text.trim() : "#999";

/**
 * Generates the default tooltip HTML from a TooltipData object.
 *
 * @param data - Object containing xLabel and rows for the tooltip.
 * @param data.xLabel - Header text for the tooltip.
 * @param data.rows - Array of color/label/value rows to display.
 * @returns An HTML string safe for tooltip insertion.
 */
const defaultTooltipHtml = ({ rows, xLabel }: TooltipData): string => {
  const rowsHtml = rows
    .map(
      ({ color, label, value }) => /*html*/ `
        <div style="display:flex;align-items:center;gap:6px;height:18px">
        <span style="width:8px;height:8px;border-radius:50%;background:${safeColor(color)};flex-shrink:0"></span>
        <span style="font-size:11px;color:#222">${esc(label)}: ${esc(value)}</span>
        </div>`,
    )
    .join("");

  return /*html*/ `
    <div style="font-family:sans-serif;padding:8px 10px;min-width:140px;background:#fff;border:1px solid #ddd;border-radius:4px;filter:drop-shadow(0 1px 4px rgba(0,0,0,.12))">
    <div style="font-size:11px;font-weight:bold;color:#555;margin-bottom:4px">${esc(xLabel)}</div>
    ${rowsHtml}
    </div>`;
};

// ── Options ─────────────────────────────────────────────────────────────────

/** Options for the {@link addTooltip} function. */
interface AddTooltipOptions {
  readonly formatX?: (v: unknown) => string;
  readonly formatY?: (v: unknown) => string;
  readonly innerHeight: number;
  readonly innerWidth: number;
  readonly stylesheetUrl?: string;
  readonly tooltipHtml?: (data: TooltipData) => string;
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Adds a reactive tooltip layer over a chart's bounds group.
 *
 * Creates (or reuses) one TipVizTooltip instance per bounds element, renders
 * a cursor line and per-series dots, and responds to mouse hover by showing
 * a tooltip anchored to the nearest data point.
 *
 * Data series are sorted by x-value before bisecting so unsorted input works.
 * Color values in tooltips are sanitized via {@link safeColor}.
 *
 * @template T - The data point type.
 *
 * @param boundsGroup - D3 selection of the chart's bounds `<g>` element.
 * @param series - All series (labels, accessors, data) to display.
 * @param xScale - X scale used for pixel ↔ data inversion.
 * @param yScale - Y scale used for cursor dot positioning.
 * @param xAccessor - Returns the x value from a data point.
 * @param options - innerWidth, innerHeight, and optional formatters / renderer.
 * @returns The TipVizTooltip instance for this bounds element.
 */
export const addTooltip = <T,>(
  boundsGroup: BoundsSelection,
  series: readonly ProcessedSeries<T>[],
  xScale: AnyScale,
  yScale: AnyScale,
  xAccessor: (d: T) => unknown,
  {
    formatX = (v) => (v instanceof Date ? v.toLocaleDateString() : String(v)),
    formatY = (v) => (typeof v === "number" ? v.toLocaleString() : String(v)),
    innerHeight,
    innerWidth,
    stylesheetUrl,
    tooltipHtml = defaultTooltipHtml,
  }: AddTooltipOptions = { innerHeight: 0, innerWidth: 0 },
): TipVizTooltip => {
  const boundsEl = boundsGroup.node()!;
  const referenceData = sortDataByX(series[0]?.data ?? [], xAccessor);
  const sortedSeriesByLabel = new Map(
    series.map((serie) => [serie.label, sortDataByX(serie.data, xAccessor)]),
  );
  const bisect = bisector((d: T) => toComparableX(xAccessor(d))).center;
  let entry = tooltipRegistry.get(boundsEl);

  if (!entry) {
    const el = document.createElement("tip-viz-tooltip") as TipVizTooltip;
    document.body.appendChild(el);
    entry = { loadedStylesheet: undefined, tooltip: el };
    tooltipRegistry.set(boundsEl, entry);
  }

  const { tooltip } = entry;

  tooltip.setHtml((d) => tooltipHtml(d as TooltipData));

  if (stylesheetUrl !== undefined && stylesheetUrl !== entry.loadedStylesheet) {
    tooltip.loadStylesheet(stylesheetUrl);
    entry.loadedStylesheet = stylesheetUrl;
  }

  // ── Cursor layer ───────────────
  const tooltipLayer = boundsGroup
    .selectAll<SVGGElement, null>("g.tooltip-layer")
    .data([null])
    .join("g")
    .attr("class", "tooltip-layer");
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

  // ── Mouse capture rectangle ──────────────────────────────────────────────
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
        xScale as unknown as Readonly<{
          readonly invert: (v: number) => unknown;
        }>
      ).invert(mx);
      const comparableXVal = toComparableX(xVal);
      const idx = Math.max(
        0,
        Math.min(
          bisect(referenceData, comparableXVal),
          referenceData.length - 1,
        ),
      );
      const refDatum = referenceData[idx];
      if (!refDatum) return;

      const cx = (xScale as (v: unknown) => number)(xAccessor(refDatum));
      cursorLine.attr("x1", cx).attr("x2", cx).attr("display", null);

      const rows: TooltipRow[] = [];
      let firstDot: SVGCircleElement | null = null;

      cursorDots.each(function (serie) {
        const sortedSeries = sortedSeriesByLabel.get(serie.label) ?? [];

        if (!sortedSeries.length) {
          rows.push({
            color: serie.stroke ?? "steelblue",
            label: serie.label,
            value: "—",
          });
          return;
        }

        const si = Math.max(
          0,
          Math.min(
            bisect(sortedSeries, comparableXVal),
            sortedSeries.length - 1,
          ),
        );

        const datum = sortedSeries[si];
        if (!datum) return;

        const dot = select(this)
          .attr("cx", (xScale as (v: unknown) => number)(xAccessor(datum)))
          .attr("cy", (yScale as (v: unknown) => number)(serie.accessor(datum)))
          .attr("display", null)
          .node();

        rows.push({
          color: serie.stroke ?? "steelblue",
          label: serie.label,
          value: formatY(serie.accessor(datum)),
        });

        firstDot ??= dot;
      });

      tooltip.show(
        { rows, xLabel: formatX(xAccessor(refDatum)) } satisfies TooltipData,
        firstDot ?? (event.currentTarget as Element),
      );
    })
    .on("mouseleave", () => {
      cursorLine.attr("display", "none");
      cursorDots.attr("display", "none");
      tooltip.hide();
    });

  return tooltip;
};

export { safeColor, sortDataByX, toComparableX };
