export interface ChartConfig<T> {
  data: T[];
  xSerie: {
    accessor: (d: T) => unknown;
    label: string;
  };
  ySeries: SeriesDescriptor<T>[];
}

/** A series descriptor with processed data attached. */
export interface ProcessedSeries<T> extends SeriesDescriptor<T> {
  data: T[];
}

/** Describes a single data series with its accessor and rendering properties. */
export interface SeriesDescriptor<T> {
  [key: string]: unknown;
  accessor: (d: T) => number;
  label: string;
  stroke: string;
}
