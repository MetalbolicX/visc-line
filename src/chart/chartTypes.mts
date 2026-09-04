import type { AxisDomain, CurveFactory } from "d3";

import type { LegendItem } from "@/components/legend.mjs";
import type { ZoomBehaviorWithReset } from "@/interactivity/index.mjs";
import type { TooltipData } from "@/interactivity/tooltip.mjs";
import type {
  AnyScale,
  CurvePreset,
  CustomCallback,
  Margins,
  ProcessedSeries,
  ScaleType,
  SVGSelection,
  Theme,
} from "@/types/index.mjs";

export interface ChartAnnotation {
  /** Pixel offsets from the anchor. Defaults: dx = 8, dy = -8. */
  readonly dx?: number;
  readonly dy?: number;
  /** Draw a leader line from anchor to text. Default: false. */
  readonly showConnector?: boolean;
  readonly text: string;
  /** Data coordinate to anchor to. Date when xType is "time". */
  readonly x: Date | number;
  readonly y: number;
}

/**
 * A live, mounted chart handle returned by createChart.
 */
export interface ChartInstance<T> {
  readonly allSeries: readonly ProcessedSeries<T>[];
  readonly container: HTMLElement;
  readonly dispose: () => void;
  readonly series: readonly ProcessedSeries<T>[];
  readonly svg: SVGSelection;
  readonly update: (newData: readonly T[]) => void;
  readonly updateVisibleSeries: (labels: readonly string[]) => void;
  readonly withAnnotations: (options: WithAnnotationsOptions) => ChartInstance<T>;
  readonly withAxes: (options?: WithAxesOptions) => ChartInstance<T>;
  readonly withCustom: (callback: CustomCallback | null) => ChartInstance<T>;
  readonly withGrid: (options?: WithGridOptions) => ChartInstance<T>;
  readonly withLegend: (options: WithLegendOptions) => ChartInstance<T>;
  readonly withPoints: () => ChartInstance<T>;
  readonly withReferenceLines: (options: WithReferenceLinesOptions) => ChartInstance<T>;
  readonly withTitle: (options: WithTitleOptions) => ChartInstance<T>;
  readonly withTooltip: (options?: WithTooltipOptions) => ChartInstance<T>;
  readonly withVisibleSeries: (labels: readonly string[]) => void;
  readonly withZoomPan: (options?: WithZoomPanOptions) => ChartInstance<T>;
  /** Exposes the internal zoom behavior for testing observation. */
  readonly zoomBehavior: null | ZoomBehaviorWithReset;
}

export interface ChartOptions {
  readonly curve?: CurveFactory | CurvePreset;
  readonly margins?: Margins;
  readonly theme?: Partial<Theme>;
  readonly xType?: ScaleType;
  readonly yLabel?: string;
}

export interface ReferenceLine {
  /** "y" renders a horizontal line at a y-domain value; "x" renders vertical. */
  readonly axis: "x" | "y";
  readonly label?: string;
  readonly value: Date | number;
}

export interface WithAnnotationsOptions {
  readonly annotations: readonly ChartAnnotation[];
}

export interface WithAxesOptions {
  /**
   * Optional tick format for time scales.
   * - `string`: a d3 time-format specifier (e.g., `"%Y"` for year, `"%b %d"` for month-day)
   * - `function`: custom formatter receiving a Date, returning a string label
   * Only applies when `xType: "time"`; ignored for other scale types.
   */
  readonly timeTickFormat?: ((date: Date) => string) | string;
  readonly xTickCount?: number;
  readonly xTickFormat?: (domainValue: AxisDomain, index: number) => string;
  readonly yTickCount?: number;
  readonly yTickFormat?: (domainValue: AxisDomain, index: number) => string;
}

export interface WithGridOptions {
  readonly showX?: boolean;
  readonly showY?: boolean;
}

export interface WithLegendOptions {
  readonly interactive?: boolean;
  readonly items?: readonly LegendItem[];
  readonly onToggle?: (label: string, isVisible: boolean) => void;
}

export interface WithReferenceLinesOptions {
  readonly lines: readonly ReferenceLine[];
}

export interface WithTitleOptions {
  readonly title: string;
}

export interface WithTooltipOptions {
  readonly formatX?: (v: unknown) => string;
  readonly formatY?: (v: unknown) => string;
  readonly stylesheetUrl?: string;
  readonly tooltipHtml?: (data: TooltipData) => string;
}

export interface WithZoomPanOptions {
  readonly onZoom?: (newX: AnyScale, newY: AnyScale) => void;
  /** Minimum and maximum zoom levels (default: [0.5, 32]). */
  readonly scaleExtent?: readonly [number, number];
}
