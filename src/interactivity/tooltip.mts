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

// ── Default HTML template ─────────────────────────────────────────────────────
const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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
 * Attach a multi-series tooltip to a bounds group.
 *
 * Renders one cursor dot per series and a vertical cursor line. The tooltip
 * UI is delegated to a `<tip-viz-tooltip>` element (tipviz web component)
 * appended once to `document.body` per chart and reused across re-renders.
 *
 * @param boundsGroup - D3 selection of the bounds group.
 * @param series - Processed series array.
 * @param xScale - D3 scale for the x axis.
 * @param yScale - D3 scale for the y axis.
 * @param xAccessor - Shared x-accessor function.
 * @param options - Optional configuration including dimensions, formatters, and tooltip customisation.
 * @returns The `TipVizTooltip` instance for further customisation (e.g. `setDirection`, `setOffset`).
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

      const rows: TooltipRow[] = [];
      let anchorEl: Element | null = null;

      cursorDots.each(function (serie) {
        if (!serie.data.length) {
          rows.push({
            label: serie.label,
            color: serie.stroke ?? "steelblue",
            value: "—",
          });
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

        rows.push({
          label: serie.label,
          color: serie.stroke ?? "steelblue",
          value: formatY(serie.accessor(serie.data[si]!)),
        });

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
