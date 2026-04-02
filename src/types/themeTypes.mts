export type Theme = {
  colors: {
    background: string;
    text: string;
    axis: string;
    grid: string;
    palette: string[]; // series colors
  };
  axis: {
    fontSize: number;
    tickSize: number;
    tickPadding: number;
    color?: string;
  };
  grid: { stroke: string; strokeWidth: number; dashArray?: string | null };
  line: { strokeWidth: number; opacity: number; curve: string };
  points: { radius: number; fill: string; stroke: string; strokeWidth: number };
  legend: {
    fontSize: number;
    position: "right" | "top" | "bottom" | "left";
    itemSpacing: number;
    symbolSize: number;
  };
  title: {
    fontSize: number;
    fontWeight: number;
    color: string;
    padding: number;
  };
  spacing: { small: number; medium: number; large: number };
  breakpoints?: { sm: number; md: number; lg: number };
  accessibility?: { reducedMotion?: boolean; highContrast?: boolean };
  tooltip?: {
    background: string;
    border: string;
    borderRadius: number;
    padding: number;
    fontSize: number;
    color: string;
  };
};

/** Makes every key in T (and nested objects) optional for partial overrides. */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Shape accepted by the theme parameter — only supply the tokens you want to override. */
export type ThemeOverride = DeepPartial<Theme>;

/**
 * Per-series visual overrides. Merged over the resolved theme when rendering
 * a specific data series. Only the keys provided will take effect.
 */
export type SeriesStyle = {
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  pointFill?: string;
  pointRadius?: number;
  pointStroke?: string;
};
