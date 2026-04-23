import type { ChartConfig } from "../src/index.mjs";

export interface ExamRecord {
  hours: number;
  aliceScore: number;
  bobScore: number;
}

export const examData: ExamRecord[] = [
  { hours: 1, aliceScore: 45, bobScore: 30 },
  { hours: 2, aliceScore: 52, bobScore: 48 },
  { hours: 3, aliceScore: 61, bobScore: 55 },
  { hours: 4, aliceScore: 70, bobScore: 63 },
  { hours: 5, aliceScore: 78, bobScore: 71 },
  { hours: 6, aliceScore: 85, bobScore: 80 },
  { hours: 7, aliceScore: 91, bobScore: 88 },
  { hours: 8, aliceScore: 95, bobScore: 94 },
];

export const examChartConfig: ChartConfig<ExamRecord> = {
  data: examData,
  xSerie: {
    accessor: (d) => d.hours,
    label: "Study Hours",
  },
  ySeries: [
    {
      accessor: (d) => d.aliceScore,
      label: "Alice",
      stroke: "steelblue",
    },
    {
      accessor: (d) => d.bobScore,
      label: "Bob",
      stroke: "tomato",
    },
  ],
};