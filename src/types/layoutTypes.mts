/** Margin values for a chart's drawing area. */
export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Computed outer and inner dimensions for a chart. */
export interface Dimensions {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margins: Margins;
}
