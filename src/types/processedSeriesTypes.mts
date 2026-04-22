export interface ChartConfig<T> {
  readonly data: readonly T[];
  readonly xSerie: Readonly<{
    readonly accessor: (d: T) => unknown;
    readonly label: string;
  }>;
  readonly ySeries: readonly SeriesDescriptor<T>[];
}

/** A series descriptor with processed data attached. */
export interface ProcessedSeries<T> extends SeriesDescriptor<T> {
  readonly data: readonly T[];
}

/** Describes a single data series with its accessor and rendering properties. */
export interface SeriesDescriptor<T> {
  readonly accessor: (d: T) => number;
  readonly label: string;
  readonly opacity?: number | string;
  readonly pointFill?: string;
  readonly pointRadius?: number;
  readonly pointStroke?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number | string;
}
