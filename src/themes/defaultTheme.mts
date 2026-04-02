import type { Theme } from "@/types/index.mjs";

/**
 * Built-in default theme.  Every chart component falls back to these values
 * when no override is provided.  Pass a `ThemeOverride` to `mergeTheme` to
 * customize only the tokens you care about.
 */
export const defaultTheme: Theme = {
  colors: {
    background: "#ffffff",
    text: "#222222",
    axis: "#333333",
    grid: "#e6e6e6",
    palette: [
      "#1f77b4",
      "#ff7f0e",
      "#2ca02c",
      "#d62728",
      "#9467bd",
      "#8c564b",
      "#e377c2",
      "#7f7f7f",
    ],
  },
  axis: {
    fontSize: 12,
    tickSize: 6,
    tickPadding: 8,
    color: "#333333",
  },
  grid: {
    stroke: "#e6e6e6",
    strokeWidth: 1,
    dashArray: null,
  },
  line: {
    strokeWidth: 2,
    opacity: 1,
    curve: "linear",
  },
  points: {
    radius: 3,
    fill: "#ffffff",
    stroke: "#333333",
    strokeWidth: 1,
  },
  legend: {
    fontSize: 12,
    position: "right",
    itemSpacing: 8,
    symbolSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: "#222222",
    padding: 8,
  },
  tooltip: {
    background: "#ffffff",
    border: "1px solid #cccccc",
    borderRadius: 4,
    padding: 8,
    fontSize: 12,
    color: "#222222",
  },
  spacing: {
    small: 4,
    medium: 8,
    large: 16,
  },
  breakpoints: {
    sm: 480,
    md: 768,
    lg: 1024,
  },
  accessibility: {
    reducedMotion: true,
    highContrast: false,
  },
};
