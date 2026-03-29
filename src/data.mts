import type { SeriesDescriptor } from "@/types/index.mjs";

/** A single data record for the chart. */
export interface DataRecord {
  date: Date;
  revenue: number;
  cost: number;
}

export const data: DataRecord[] = [
  { date: new Date("2023-01-01"), revenue: 100, cost: 10 },
  { date: new Date("2023-01-02"), revenue: 120, cost: 5 },
  { date: new Date("2023-01-03"), revenue: 80, cost: 15 },
  { date: new Date("2023-01-04"), revenue: 95, cost: 30 },
  { date: new Date("2023-01-05"), revenue: 140, cost: 22 },
  { date: new Date("2023-01-06"), revenue: 110, cost: 18 },
  { date: new Date("2023-01-07"), revenue: 130, cost: 12 },
];

/** Configuration for the chart including data, x-series, and y-series definitions. */
export interface ChartConfig<T> {
  data: T[];
  xSerie: {
    accessor: (d: T) => unknown;
    label: string;
  };
  ySeries: SeriesDescriptor<T>[];
}

export const chartConfig: ChartConfig<DataRecord> = {
  data,
  xSerie: {
    accessor: (d) => d.date,
    label: "Date",
  },
  ySeries: [
    { accessor: (d) => d.revenue, label: "Revenue", stroke: "steelblue" },
    { accessor: (d) => d.cost, label: "Cost", stroke: "tomato" },
  ],
};
