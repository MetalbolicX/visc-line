/** Computed outer and inner dimensions for a chart. */
export interface Dimensions {
  readonly height: number;
  readonly innerHeight: number;
  readonly innerWidth: number;
  readonly margins: Margins;
  readonly width: number;
}

/** Margin values for a chart's drawing area. */
export interface Margins {
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
}
