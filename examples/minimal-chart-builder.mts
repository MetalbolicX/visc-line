import { createChart } from "../src/index.mjs";
import { examChartConfig } from "./chart-builder-data.mjs";

export const main = (container: HTMLElement): void => {
  createChart(container, examChartConfig, { xType: "linear" });
};
