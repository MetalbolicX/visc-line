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
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Per-series visual overrides. Merged over the resolved theme when rendering
 * a specific data series. Only the keys provided will take effect.
 */
export interface SeriesStyle {
  opacity?: number;
  pointFill?: string;
  pointRadius?: number;
  pointStroke?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface Theme {
  accessibility?: { highContrast?: boolean; reducedMotion?: boolean; };
  axis: {
    color?: string;
    fontSize: number;
    tickPadding: number;
    tickSize: number;
  };
  breakpoints?: { lg: number; md: number; sm: number; };
  colors: {
    axis: string;
    background: string;
    grid: string;
    palette: string[]; // series colors
    text: string;
  };
  grid: { dashArray?: null | string; stroke: string; strokeWidth: number; };
  legend: {
    fontSize: number;
    itemSpacing: number;
    position: "bottom" | "left" | "right" | "top";
    symbolSize: number;
  };
  line: { curve: CurvePreset; opacity: number; strokeWidth: number; };
  points: { fill: string; radius: number; stroke: string; strokeWidth: number };
  spacing: { large: number; medium: number; small: number; };
  title: {
    color: string;
    fontSize: number;
    fontWeight: number;
    padding: number;
  };
  tooltip?: {
    background: string;
    border: string;
    borderRadius: number;
    color: string;
    fontSize: number;
    padding: number;
  };
}

/** Shape accepted by the theme parameter — only supply the tokens you want to override. */
export type ThemeOverride = DeepPartial<Theme>;
