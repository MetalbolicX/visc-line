import { afterEach, describe, expect, it, vi } from "vitest";
import type { ScalePower } from "d3";
import { createScales } from "@/utils/scales.mjs";
import { getDimensions } from "@/utils/layout.mjs";
import { observeResize } from "@/utils/responsiveness.mjs";
import {
  getMultiSeriesExtents,
  processAllSeries,
  processNumericData,
} from "@/utils/dataUtils.mjs";
import type { Margins } from "@/types/layoutTypes.mts";
import type {
  ProcessedSeries,
  SeriesDescriptor,
} from "@/types/processedSeriesTypes.mts";

const createFakeElement = (width: number, height: number): Element =>
  ({
    getBoundingClientRect: () =>
      ({
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}) as DOMRectReadOnly,
      }) as DOMRectReadOnly,
  }) as Element;

type RawRecord = {
  x: number;
  a?: number;
  b?: number;
};

const createSampleRawData = (): RawRecord[] => [
  { x: 0, a: 10, b: 100 },
  { x: 1, a: undefined, b: 110 },
  { x: 2, a: 15, b: 120 },
  { x: 3, a: 20, b: Number.NaN },
];

describe("data utils", () => {
  it("filters out non-numeric x or y values", () => {
    const data = [
      { x: "1", y: 10 },
      { x: "bad", y: 5 },
      { x: 2, y: null },
      { x: 3, y: 20 },
    ];
    const filtered = processNumericData(
      data,
      ({ x }) => x,
      ({ y }) => y,
    );
    expect(filtered).toEqual([data[0], data[3]]);
  });

  it("attaches filtered data to each series descriptor", () => {
    const rawData = createSampleRawData();
    const ySeries: SeriesDescriptor<RawRecord>[] = [
      {
        accessor: ({ a }) => a ?? Number.NaN,
        label: "alpha",
        stroke: "red",
      },
      {
        accessor: ({ b }) => b ?? Number.NaN,
        label: "beta",
        stroke: "blue",
      },
    ];
    const processed = processAllSeries(rawData, ({ x }) => x, ySeries);
    expect(processed[0].data).toEqual([rawData[0], rawData[2], rawData[3]]);
    expect(processed[1].data).toEqual([rawData[0], rawData[1], rawData[2]]);
  });

  it("computes shared x and y extents across multiple series", () => {
    type Datum = { x: number; y: number };
    const series: ProcessedSeries<Datum>[] = [
      {
        accessor: ({ y }) => y,
        label: "primary",
        stroke: "red",
        data: [
          { x: -3, y: -5 },
          { x: 1, y: 0 },
        ],
      },
      {
        accessor: ({ y }) => y,
        label: "secondary",
        stroke: "blue",
        data: [
          { x: -1, y: 25 },
          { x: 4, y: 15 },
        ],
      },
    ];
    const extents = getMultiSeriesExtents(series, ({ x }) => x);
    expect(extents.xDomain).toEqual([-3, 4]);
    expect(extents.yDomain).toEqual([-5, 25]);
  });
});

describe("layout utils", () => {
  it("derives outer and inner dimensions from container size", () => {
    const container = createFakeElement(300, 200);
    const margins: Margins = { top: 10, right: 20, bottom: 30, left: 40 };
    const dimensions = getDimensions(container, margins);
    expect(dimensions.width).toBe(300);
    expect(dimensions.height).toBe(200);
    expect(dimensions.innerWidth).toBe(240);
    expect(dimensions.innerHeight).toBe(160);
    expect(dimensions.margins).toBe(margins);
  });

  it("never produces negative inner widths or heights", () => {
    const container = createFakeElement(30, 20);
    const margins: Margins = { top: 20, right: 25, bottom: 20, left: 25 };
    const dimensions = getDimensions(container, margins);
    expect(dimensions.innerWidth).toBe(0);
    expect(dimensions.innerHeight).toBe(0);
  });
});

describe("responsiveness utils", () => {
  const originalResizeObserver = globalThis.ResizeObserver;

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    vi.restoreAllMocks();
  });

  it("observes resize events and exposes a cleanup callback", () => {
    const instances: MockResizeObserver[] = [];

    class MockResizeObserver {
      callback: ResizeObserverCallback;
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        instances.push(this);
      }

      observe = vi.fn((target: Element) => target);
      unobserve = vi.fn((target: Element) => target);
      disconnect = vi.fn();

      trigger() {
        this.callback([], this as unknown as ResizeObserver);
      }
    }

    globalThis.ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;
    const container = document.createElement("div");
    const renderCallback = vi.fn();
    const cleanup = observeResize(container, renderCallback);
    const instance = instances.at(0);

    expect(instance).toBeDefined();
    expect(instance?.observe).toHaveBeenCalledWith(container);
    instance?.trigger();
    expect(renderCallback).toHaveBeenCalledTimes(1);
    cleanup();
    expect(instance?.disconnect).toHaveBeenCalled();
  });
});

describe("scales utils", () => {
  it("builds linear scales that map domain to the available range", () => {
    const { xScale, yScale } = createScales({
      xDomain: [0, 10],
      yDomain: [0, 20],
      innerWidth: 200,
      innerHeight: 100,
    });
    expect(xScale(0)).toBeCloseTo(0);
    expect(xScale(10)).toBeCloseTo(200);
    expect(yScale(0)).toBeCloseTo(100);
    expect(yScale(20)).toBeCloseTo(0);
  });

  it("respects power scale exponents when configured", () => {
    const { xScale } = createScales({
      xDomain: [0, 1],
      yDomain: [0, 1],
      innerWidth: 50,
      innerHeight: 50,
      xType: "pow",
      xExponent: 3,
    });
    const powerScale = xScale as ScalePower<number, number>;
    expect(powerScale.exponent()).toBe(3);
  });
});
