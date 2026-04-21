import { describe, expect, it } from "vitest";

import {
  safeColor,
  sortDataByX,
  toComparableX,
} from "../../interactivity/tooltip.mjs";

describe("toComparableX", () => {
  it("converts Date to Unix timestamp (number)", () => {
    /**
     *
     */
    const date = new Date("2023-01-01T00:00:00Z");
    expect(toComparableX(date)).toBe(date.getTime());
  });

  it("returns numbers as-is", () => {
    expect(toComparableX(42)).toBe(42);
    expect(toComparableX(-3.14)).toBe(-3.14);
  });

  it("converts bigint to Number", () => {
    expect(toComparableX(BigInt(100))).toBe(100);
  });

  it("converts strings as-is", () => {
    expect(toComparableX("foo")).toBe("foo");
    expect(toComparableX("")).toBe("");
  });

  it("handles null and undefined as strings", () => {
    expect(toComparableX(null)).toBe("null");
    expect(toComparableX(undefined)).toBe("undefined");
  });

  it("handles boolean values", () => {
    expect(toComparableX(true)).toBe("true");
    expect(toComparableX(false)).toBe("false");
  });
});

describe("safeColor", () => {
  it("accepts valid hex colors", () => {
    expect(safeColor("#fff")).toBe("#fff");
    expect(safeColor("#cfd8dc")).toBe("#cfd8dc");
    expect(safeColor("#1f77b4")).toBe("#1f77b4");
    expect(safeColor("#CFDAE3")).toBe("#CFDAE3");
  });

  it("accepts 8-digit hex colors with alpha", () => {
    expect(safeColor("#1f77b4ff")).toBe("#1f77b4ff");
  });

  it("accepts rgb and rgba colors", () => {
    expect(safeColor("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    expect(safeColor("rgba(0, 128, 255, 0.5)")).toBe("rgba(0, 128, 255, 0.5)");
  });

  it("accepts hsl and hsla colors", () => {
    expect(safeColor("hsl(120, 100%, 50%)")).toBe("hsl(120, 100%, 50%)");
    expect(safeColor("hsla(240, 100%, 50%, 0.5)")).toBe("hsla(240, 100%, 50%, 0.5)");
  });

  it("accepts CSS var references", () => {
    expect(safeColor("var(--vl-palette-0)")).toBe("var(--vl-palette-0)");
    expect(safeColor("var(--vl-axis-color)")).toBe("var(--vl-axis-color)");
  });

  it("accepts named CSS colors", () => {
    expect(safeColor("steelblue")).toBe("steelblue");
    expect(safeColor("tomato")).toBe("tomato");
    expect(safeColor("currentColor")).toBe("currentColor");
  });

  it("rejects injection attempts with CSS function breakout", () => {
    expect(safeColor("red;display:none")).toBe("#999");
    expect(safeColor("url('javascript:alert(1)')")).toBe("#999");
    expect(safeColor("expression(alert(1))")).toBe("#999");
  });

  it("rejects empty string with fallback", () => {
    expect(safeColor("")).toBe("#999");
  });

  it("trims whitespace before testing", () => {
    expect(safeColor("  #fff  ")).toBe("#fff");
  });

  it("rejects bogus values", () => {
    expect(safeColor("../../../etc/passwd")).toBe("#999");
    expect(safeColor("<script>alert(1)</script>")).toBe("#999");
  });
});

describe("sortDataByX", () => {
  interface DataPoint {
    date: Date;
    value: number;
  }

  /**
   *
   */
  const accessor = (d: DataPoint): unknown => d.date;

  it("returns a new array and does not mutate the original", () => {
    /**
     *
     */
    const data: DataPoint[] = [
      { date: new Date("2023-01-03"), value: 3 },
      { date: new Date("2023-01-01"), value: 1 },
    ];
    /**
     *
     */
    const sorted = sortDataByX(data, accessor);
    expect(data[0].date).toEqual(new Date("2023-01-03"));
    expect(sorted[0].date).toEqual(new Date("2023-01-01"));
  });

  it("sorts ascending by x value (Date)", () => {
    /**
     *
     */
    const data: DataPoint[] = [
      { date: new Date("2023-01-05"), value: 5 },
      { date: new Date("2023-01-01"), value: 1 },
      { date: new Date("2023-01-03"), value: 3 },
    ];
    /**
     *
     */
    const sorted = sortDataByX(data, accessor);
    expect(sorted.map((d) => d.date.getTime())).toEqual([
      new Date("2023-01-01").getTime(),
      new Date("2023-01-03").getTime(),
      new Date("2023-01-05").getTime(),
    ]);
  });

  it("sorts ascending by numeric x value", () => {
    /**
     *
     */
    const data = [{ x: 5 }, { x: 1 }, { x: 3 }];
    /**
     *
     */
    const sorted = sortDataByX(data, (d) => d.x);
    expect(sorted.map((d) => d.x)).toEqual([1, 3, 5]);
  });

  it("sorts ascending by string x value", () => {
    /**
     *
     */
    const data = [{ label: "c" }, { label: "a" }, { label: "b" }];
    /**
     *
     */
    const sorted = sortDataByX(data, (d) => d.label);
    expect(sorted.map((d) => d.label)).toEqual(["a", "b", "c"]);
  });

  it("returns a new array even when already sorted", () => {
    /**
     *
     */
    const data: DataPoint[] = [
      { date: new Date("2023-01-01"), value: 1 },
      { date: new Date("2023-01-02"), value: 2 },
    ];
    /**
     *
     */
    const sorted = sortDataByX(data, accessor);
    expect(sorted).not.toBe(data);
    expect(sorted.map((d) => d.value)).toEqual([1, 2]);
  });

  it("returns empty array when given empty input", () => {
    /**
     *
     */
    const sorted = sortDataByX([], accessor);
    expect(sorted).toEqual([]);
  });

  it("sorts correctly with negative numbers", () => {
    /**
     *
     */
    const data = [{ x: -5 }, { x: 1 }, { x: -1 }];
    /**
     *
     */
    const sorted = sortDataByX(data, (d) => d.x);
    expect(sorted.map((d) => d.x)).toEqual([-5, -1, 1]);
  });

  it("sorts correctly with mixed types (Date, number, string)", () => {
    /**
     *
     */
    const data = [
      { x: new Date("2023-01-02") },
      { x: new Date("2023-01-01") },
      { x: new Date("2023-01-03") },
    ];
    /**
     *
     */
    const sorted = sortDataByX(data, (d) => d.x);
    expect(sorted[0].x).toEqual(new Date("2023-01-01"));
    expect(sorted[1].x).toEqual(new Date("2023-01-02"));
    expect(sorted[2].x).toEqual(new Date("2023-01-03"));
  });
});
