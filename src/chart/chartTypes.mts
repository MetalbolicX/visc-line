import type { CurveFactory, AxisDomain } from "d3";

import type {
  AnyScale,
  CustomCallback,
  CurvePreset,
  Margins,
  ProcessedSeries,
  ScaleType,
  SVGSelection,
  Theme,
} from "@/types/index.mjs";
import type { LegendItem } from "@/components/legend.mjs";
import type { TooltipData } from "@/interactivity/tooltip.mjs";

export interface WithTooltipOptions {
  readonly formatX?: (v: unknown) => string;
  readonly formatY?: (v: unknown) => string;
  readonly stylesheetUrl?: string;
  readonly tooltipHtml?: (data: TooltipData) => string;
}

export interface WithTitleOptions {
  readonly title: string;
}

export interface WithLegendOptions {
  readonly items: readonly LegendItem[];
}

export interface WithZoomPanOptions {
  readonly onZoom?: (newX: AnyScale, newY: AnyScale) => void;
  /** Minimum and maximum zoom levels (default: [0.5, 32]). */
  readonly scaleExtent?: readonly [number, number];
}

export interface WithAxesOptions {
  readonly xTickCount?: number;
  readonly xTickFormat?: (domainValue: AxisDomain, index: number) => string;
  readonly yTickCount?: number;
  readonly yTickFormat?: (domainValue: AxisDomain, index: number) => string;
}

export interface WithGridOptions {
  readonly showX?: boolean;
  readonly showY?: boolean;
}

/**
 * A live, mounted chart handle returned by createChart.
 */
export interface ChartInstance<T> {
  readonly container: HTMLElement;
  readonly dispose: () => void;
  readonly series: readonly ProcessedSeries<T>[];
  readonly svg: SVGSelection;
  readonly update: (newData: readonly T[]) => void;
  readonly withAxes: (options?: WithAxesOptions) => ChartInstance<T>;
  readonly withCustom: (callback: null | CustomCallback) => ChartInstance<T>;
  readonly withGrid: (options?: WithGridOptions) => ChartInstance<T>;
  readonly withLegend: (options: WithLegendOptions) => ChartInstance<T>;
  readonly withPoints: () => ChartInstance<T>;
  readonly withTitle: (options: WithTitleOptions) => ChartInstance<T>;
  readonly withTooltip: (options?: WithTooltipOptions) => ChartInstance<T>;
  readonly withZoomPan: (options?: WithZoomPanOptions) => ChartInstance<T>;
}

export interface ChartOptions {
  readonly curve?: CurveFactory | CurvePreset;
  readonly margins?: Margins;
  readonly theme?: Partial<Theme>;
  readonly xType?: ScaleType;
  readonly yLabel?: string;
}
