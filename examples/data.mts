import type { ChartConfig } from "../src/index.mjs";

/** A single data record for the chart. */
export interface DataRecord {
  cost: number;
  date: Date;
  revenue: number;
}

/** Sample dataset used by the example. */
export const data: DataRecord[] = [
  { cost: 10, date: new Date("2023-01-01"), revenue: 100 },
  { cost: 5, date: new Date("2023-01-02"), revenue: 120 },
  { cost: 15, date: new Date("2023-01-03"), revenue: 80 },
  { cost: 30, date: new Date("2023-01-04"), revenue: 95 },
  { cost: 22, date: new Date("2023-01-05"), revenue: 140 },
  { cost: 18, date: new Date("2023-01-06"), revenue: 110 },
  { cost: 12, date: new Date("2023-01-07"), revenue: 130 },
];

/** Configuration for the chart including data, x-series, and y-series definitions. */
/** Example chart configuration including dataset and series definitions. */
export const chartConfig: ChartConfig<DataRecord> = {
  data,
  xSerie: {
    /** Accessor that returns the x value (date) for a record. */
    accessor: (d) => d.date,
    label: "Date",
  },
  ySeries: [
    {
      /** Accessor that returns the y value for the revenue series. */
      accessor: (d) => d.revenue,
      label: "Revenue",
      stroke: "steelblue",
    },
    {
      /** Accessor that returns the y value for the cost series. */
      accessor: (d) => d.cost,
      label: "Cost",
      stroke: "tomato",
    },
  ],
};
