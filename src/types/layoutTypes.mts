/** Computed outer and inner dimensions for a chart. */
export interface Dimensions {
  height: number;
  innerHeight: number;
  innerWidth: number;
  margins: Margins;
  width: number;
}

/** Margin values for a chart's drawing area. */
export interface Margins {
  bottom: number;
  left: number;
  right: number;
  top: number;
}
