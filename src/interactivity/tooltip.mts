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
  tooltip: TipVizTooltip;
  loadedStylesheet: string | undefined;
}

const tooltipRegistry = new WeakMap<SVGGElement, TooltipEntry>();

// ── Public data types ─────────────────────────────────────────────────────────

/** One value row in the tooltip body. */
export interface TooltipRow {
  label: string;
  color: string;
  value: string;
}

/** Data passed to tipviz and to the custom {@link AddTooltipOptions.tooltipHtml} renderer. */
export interface TooltipData {
  xLabel: string;
  rows: TooltipRow[];
}

/**
 * Escapes a string for safe insertion into HTML by replacing characters
 * that have special meaning in HTML with their corresponding entities.
 *
 * Replacements performed (in order):
 * - '&' → '&amp;'
 * - '<' → '&lt;'
 * - '>' → '&gt;'
 * - '"' → '&quot;'
 *
 * Note: Ampersands are replaced first to avoid double-escaping existing entities.
 *
 * @param text - The input string to escape.
 * @returns The escaped string safe for use in HTML text content or within double-quoted attributes.
 */
const esc = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Generates the default HTML string for a tooltip given tooltip data.
 *
 * The function produces a small, styled HTML fragment containing a header
 * (derived from xLabel) and a vertical list of rows. Each row displays a
 * colored dot, a label, and a value. All interpolated values are escaped
 * (via the internal esc function) to prevent injection when inserted into the DOM.
 *
 * @param tooltipData - Object containing data used to render the tooltip.
 * @param tooltipData.xLabel - Header label shown at the top of the tooltip.
 * @param tooltipData.rows - Array of row objects to render. Each row should have:
 *   - label: display text for the row
 *   - color: CSS color used for the row's dot indicator
 *   - value: display value for the row
 * @returns A string of HTML representing the fully-formed tooltip, ready for insertion into the document.
 */
const defaultTooltipHtml = ({ xLabel, rows }: TooltipData): string => {
  const rowsHtml = rows
    .map(
      ({ label, color, value }) => /*html*/ `
        <div style="display:flex;align-items:center;gap:6px;height:18px">
        <span style="width:8px;height:8px;border-radius:50%;background:${esc(color)};flex-shrink:0"></span>
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

/** Options for {@link addTooltip}. */
interface AddTooltipOptions<T> {
  innerWidth: number;
  innerHeight: number;
  formatX?: (v: unknown) => string;
  formatY?: (v: unknown) => string;
  /** Custom HTML renderer. Receives resolved {@link TooltipData}. Defaults to an inline-styled template. */
  tooltipHtml?: (data: TooltipData) => string;
  /** URL of an external stylesheet to load into the tooltip shadow root via `loadStylesheet`. */
  stylesheetUrl?: string;
}

/**
 * Adds an interactive tooltip layer to a chart bounds group. The function
 * creates (or reuses) a single DOM tooltip element per chart bounds element,
 * sets up a cursor vertical line, per-series cursor dots, and a transparent
 * mouse-capture rectangle that drives tooltip show/hide and positioning.
 *
 * Behavior:
 * - Reuses a tooltip instance registered for the bounds element, creating one
 *   if missing.
 * - Applies the provided tooltipHtml renderer and optionally loads a
 *   stylesheetUrl into the tooltip element.
 * - Renders a "tooltip-layer" <g> containing:
 *   - A vertical dashed cursor line that spans the inner chart height,
 *   - One cursor dot per series positioned at the nearest datum for the
 *     hovered x,
 *   - A transparent rect sized to innerWidth/innerHeight that captures mouse
 *     events.
 * - On mousemove:
 *   - Converts the mouse x position to a data x via xScale.invert,
 *   - Finds the nearest index in the reference series using a bisector,
 *   - Positions the cursor line at the corresponding x value,
 *   - For each series finds the closest datum and positions the series' dot
 *     and builds the tooltip rows with formatY,
 *   - Calls tooltip.show with { xLabel, rows } where xLabel is produced via
 *     formatX and rows include label/color/value for each series. The tooltip
 *     is anchored to the first visible series dot (if any) or the event
 *     target.
 * - On mouseleave, hides the cursor line/dots and calls tooltip.hide().
 *
 * @template T - Datum type for the series data arrays.
 *
 * @param boundsGroup - D3 selection wrapping the chart bounds <g> element to
 *   receive the tooltip layer and mouse-capture rectangle.
 * @param series - Array of processed series metadata and data. Each series'
 *   `label` is used as the key for binding dots; `accessor` is used to obtain
 *   the y value for positioning and formatting.
 * @param xScale - X scale used for pixel positioning and inversion. The scale
 *   is expected to support calling `(v) => number` for forward mapping and
 *   have an `invert(number) => unknown` method for mapping pixels back to
 *   data space.
 * @param yScale - Y scale used for forward mapping of y values to pixel
 *   positions via `(v) => number`.
 * @param xAccessor - Function that returns the x value for a datum (used for
 *   positioning and formatting).
 * @param options - Optional configuration object.
 * @param options.innerWidth - Inner chart width (pixels) to size the mouse
 *   capture rect. Defaults to 0 when not provided.
 * @param options.innerHeight - Inner chart height (pixels) to size the cursor
 *   line and mouse capture rect. Defaults to 0 when not provided.
 * @param options.formatX - Formatter for the x label shown in the tooltip;
 *   default converts Date to locale date string and otherwise stringifies.
 * @param options.formatY - Formatter for series values shown in rows;
 *   default formats numbers with toLocaleString and otherwise stringifies.
 * @param options.tooltipHtml - Function that receives TooltipData and returns
 *   HTML string (or similar) for the tooltip content. Defaults to
 *   `defaultTooltipHtml`.
 * @param options.stylesheetUrl - Optional URL to a stylesheet to load into the
 *   tooltip element. If provided and different from the previously loaded
 *   stylesheet for the bounds element, the stylesheet will be loaded.
 *
 * @returns The TipVizTooltip instance used to show/hide tooltip content.
 *
 * @remarks
 * - The function relies on a bisector built from the provided xAccessor to
 *   locate nearest indices; it clamps indices within array bounds.
 * - Cursor dots are bound by series label and given classes
 *   `cursor-dot cursor-dot--${label}` so they can be styled per-series.
 * - The tooltip anchor will be the first visible cursor dot or the mouse
 *   capture element if no dot is visible.
 *
 * @example
 * ```ts
 * addTooltip(boundsGroup, processedSeries, xScale, yScale, xAccessor, {
 *   innerWidth: dims.innerWidth,
 *   innerHeight: dims.innerHeight,
 *   formatX: (v) => v instanceof Date ? v.toLocaleDateString() : String(v),
 *   formatY: (v) => typeof v === "number" ? v.toLocaleString() : String(v),
 *   tooltipHtml: ({ xLabel, rows }) => `
 *     <div class="my-tooltip">
 *       <div class="my-tooltip-header">${xLabel}</div>
 *       ${rows.map(r => `
 *         <div class="my-tooltip-row">
 *           <span class="dot" style="background:${r.color}"></span>
 *           <span class="label">${r.label}: ${r.value}</span>
 *         </div>`).join("")}
 *     </div>`,
 *   stylesheetUrl: "path/to/tooltip-styles.css",
 * });
 * ```
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
    tooltipHtml = defaultTooltipHtml,
    stylesheetUrl,
  }: AddTooltipOptions<T> = { innerWidth: 0, innerHeight: 0 },
): TipVizTooltip => {
  const boundsEl = boundsGroup.node()!;
  const referenceData = series[0]?.data ?? [];
  const bisect = bisector(xAccessor).center;

  // ── Tooltip instance (one per chart) ────────────────────────────────────
  let entry = tooltipRegistry.get(boundsEl);

  if (!entry) {
    const el = document.createElement("tip-viz-tooltip") as TipVizTooltip;
    document.body.appendChild(el);
    entry = { tooltip: el, loadedStylesheet: undefined };
    tooltipRegistry.set(boundsEl, entry);
  }

  const { tooltip } = entry;

  tooltip.setHtml((d) => tooltipHtml(d as TooltipData));

  if (stylesheetUrl !== undefined && stylesheetUrl !== entry.loadedStylesheet) {
    tooltip.loadStylesheet(stylesheetUrl);
    entry.loadedStylesheet = stylesheetUrl;
  }

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

      let rows: TooltipRow[] = [];
      let anchorEl: Element | null = null;

      cursorDots.each(function (serie) {
        if (!serie.data.length) {
          rows = [
            ...rows,
            {
              label: serie.label,
              color: serie.stroke ?? "steelblue",
              value: "—",
            },
          ];
          return;
        }

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

        rows = [
          ...rows,
          {
            label: serie.label,
            color: serie.stroke ?? "steelblue",
            value: formatY(serie.accessor(serie.data[si]!)),
          },
        ];

        anchorEl ??= this;
      });

      tooltip.show(
        { xLabel: formatX(xAccessor(refDatum)), rows } satisfies TooltipData,
        anchorEl ?? (event.currentTarget as Element),
      );
    })
    .on("mouseleave", () => {
      cursorLine.attr("display", "none");
      cursorDots.attr("display", "none");
      tooltip.hide();
    });

  return tooltip;
};
