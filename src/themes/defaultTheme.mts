import type { Theme } from "@/types/index.mjs";

/**
 * Built-in default theme.  Every chart component falls back to these values
 * when no override is provided.  Pass a `ThemeOverride` to `mergeTheme` to
 * customize only the tokens you care about.
 */
export const defaultTheme: Theme = {
  accessibility: {
    highContrast: false,
    reducedMotion: false,
  },
  axis: {
    color: "#333333",
    fontSize: 12,
    tickPadding: 8,
    tickSize: 6,
  },
  colors: {
    axis: "#333333",
    background: "#ffffff",
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
    text: "#222222",
  },
  grid: {
    dashArray: "4 7",
    opacity: 0.65,
    stroke: "#e6e6e6",
    strokeLinecap: "round",
    strokeWidth: 1,
  },
  label: {
    color: "#222222",
    fontSize: 12,
    fontWeight: 400,
    padding: 8,
  },
  legend: {
    fontSize: 12,
    itemSpacing: 8,
    position: "right",
    symbolSize: 12,
  },
  line: {
    curve: "linear",
    opacity: 1,
    strokeWidth: 2,
  },
  points: {
    fill: "#ffffff",
    opacity: 0.85,
    radius: 3,
    stroke: "#333333",
    strokeWidth: 1,
  },
  title: {
    color: "#222222",
    fontSize: 16,
    fontWeight: 600,
    padding: 8,
  },
  tooltip: {
    background: "#ffffff",
    border: "1px solid #cccccc",
    borderRadius: 4,
    color: "#222222",
    fontSize: 12,
    padding: 8,
  },
};
