export type CurvePreset =
  | "basis"
  | "basisClosed"
  | "basisOpen"
  | "bumpX"
  | "bumpY"
  | "cardinal"
  | "cardinalClosed"
  | "cardinalOpen"
  | "catmullRom"
  | "catmullRomClosed"
  | "catmullRomOpen"
  | "linear"
  | "monotoneX"
  | "monotoneY"
  | "natural"
  | "step"
  | "stepAfter"
  | "stepBefore";

/** Makes every key in T (and nested objects) optional for partial overrides. */
export type DeepPartial<T> = { readonly
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Per-series visual overrides. Merged over the resolved theme when rendering
 * a specific data series. Only the keys provided will take effect.
 */
export interface SeriesStyle {
  readonly opacity?: number;
  readonly pointFill?: string;
  readonly pointRadius?: number;
  readonly pointStroke?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
}

export interface Theme {
  readonly accessibility?: Readonly<{ readonly highContrast?: boolean; readonly reducedMotion?: boolean; }>;
  readonly axis: Readonly<{
    readonly color?: string;
    readonly fontSize: number;
    readonly tickPadding: number;
    readonly tickSize: number;
  }>;
  readonly colors: Readonly<{
    readonly axis: string;
    readonly background: string;
    readonly grid: string;
    readonly palette: readonly string[]; // series colors
    readonly text: string;
  }>;
  readonly focus: Readonly<{ readonly dimOpacity: number }>;
  readonly grid: Readonly<{
    readonly dashArray: string;
    readonly opacity: number;
    readonly stroke: string;
    readonly strokeLinecap: string;
    readonly strokeWidth: number;
  }>;
  readonly label: Readonly<{
    readonly color: string;
    readonly fontSize: number;
    readonly fontWeight: number;
    readonly padding: number;
  }>;
  readonly legend: Readonly<{
    readonly fontSize: number;
    readonly itemSpacing: number;
    /** @deprecated Not used by renderLegend — position is controlled via chartRender.mts coordinates. */
    readonly position: "bottom" | "left" | "right" | "top";
    readonly symbolSize: number;
  }>;
  readonly line: Readonly<{ readonly curve: CurvePreset; readonly opacity: number; readonly strokeWidth: number; }>;
  readonly points: Readonly<{
    readonly fill: string;
    readonly opacity: number;
    readonly radius: number;
    readonly stroke: string;
    readonly strokeWidth: number;
  }>;
  readonly title: Readonly<{
    readonly color: string;
    readonly fontSize: number;
    readonly fontWeight: number;
    readonly padding: number;
  }>;
  readonly tooltip?: Readonly<{
    readonly background: string;
    readonly border: string;
    readonly borderRadius: number;
    readonly color: string;
    readonly cursor: Readonly<{
      readonly color: string;
      readonly dashArray: string;
      readonly dotRadius: number;
      readonly dotStroke: string;
      readonly dotStrokeWidth: number;
      readonly lineStrokeWidth: number;
    }>;
    readonly fontSize: number;
    readonly padding: number;
  }>;
}

/** Shape accepted by the theme parameter — only supply the tokens you want to override. */
export type ThemeOverride = DeepPartial<Theme>;
