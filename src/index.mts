// ── Chart Options & Instance Types ──────────────────────────────────
export type {
  ChartInstance,
  ChartOptions,
  WithAxesOptions,
  WithGridOptions,
  WithLegendOptions,
  WithTitleOptions,
  WithTooltipOptions,
  WithZoomPanOptions,
} from "./chart/chartTypes.mjs";

// ── Builder — Primary Public API ─────────────────────────────────────
export { createChart } from "./chart/createChart.mjs";

// ── Legend (needed by WithLegendOptions) ─────────────────────────────
export type { LegendItem } from "./components/legend.mjs";

// ── Theme ───────────────────────────────────────────────────────────
export { defaultTheme } from "./themes/defaultTheme.mjs";

// ── Custom Callback Types (exposed via withCustom escape hatch) ─────
export type { CustomCallback, CustomContext } from "./types/customContextTypes.mjs";

export type { Dimensions, Margins } from "./types/layoutTypes.mjs";
// ── Data Types ──────────────────────────────────────────────────────
export type {
  ChartConfig,
  ProcessedSeries,
  SeriesDescriptor,
} from "./types/processedSeriesTypes.mjs";
// ── Scale & Layout Types (exposed via ChartOptions, CustomContext) ──
export type { AnyScale, ScaleType } from "./types/scalesTypes.mjs";

export type { BoundsSelection, SVGSelection } from "./types/selectionTypes.mjs";

export type {
  CurvePreset,
  DeepPartial,
  SeriesStyle,
  Theme,
  ThemeOverride,
} from "./types/themeTypes.mjs";

// ── Curve Utilities ─────────────────────────────────────────────────
export { CURVE_PRESETS, resolveCurve } from "./utils/curveMap.mjs";
