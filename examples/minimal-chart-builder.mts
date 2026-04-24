import { createMinimalChart } from "../src/index.mjs";
import { examChartConfig } from "./chart-builder-data.mjs";

export const main = (container: HTMLElement): void => {
  createMinimalChart(container, examChartConfig, { xType: "linear" });
};
