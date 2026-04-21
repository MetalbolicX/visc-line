import { describe, expect, it } from "vitest";

import { createScales } from "../../services/scales.mts";

describe("createScales", () => {
  it("creates linear x and y scales by default", () => {
    /**
     *
     */
    const result = createScales({
      innerHeight: 400,
      innerWidth: 800,
      xDomain: [0, 100],
      yDomain: [0, 50],
    });

    expect(result.xScale.domain()).toEqual([0, 100]);
    expect(result.yScale.domain()).toEqual([0, 50]);
    expect(result.xScale.range()).toEqual([0, 800]);
    expect(result.yScale.range()).toEqual([400, 0]);
  });

  it("applies nice() to both scales", () => {
    /**
     *
     */
    const result = createScales({
      innerHeight: 400,
      innerWidth: 800,
      xDomain: [0.1, 99.9],
      yDomain: [0.1, 99.9],
    });
    /**
     *
     */
    const [xMin, xMax] = result.xScale.domain();
    /**
     *
     */
    const [yMin, yMax] = result.yScale.domain();
    expect(Number.isInteger(xMin)).toBe(true);
    expect(Number.isInteger(xMax)).toBe(true);
    expect(Number.isInteger(yMin)).toBe(true);
    expect(Number.isInteger(yMax)).toBe(true);
  });

  it("inverts y range so max domain maps to 0", () => {
    /**
     *
     */
    const result = createScales({
      innerHeight: 100,
      innerWidth: 100,
      xDomain: [0, 10],
      yDomain: [0, 100],
    });
    /**
     *
     */
    const yAtZero = result.yScale(0);
    /**
     *
     */
    const yAtHundred = result.yScale(100);
    expect(yAtZero).toBeGreaterThan(yAtHundred);
  });

  it("creates time scale when xType is 'time'", () => {
    /**
     *
     */
    const result = createScales({
      innerHeight: 400,
      innerWidth: 800,
      xDomain: [
        new Date("2023-01-01").getTime(),
        new Date("2023-12-31").getTime(),
      ] as [unknown, unknown],
      xType: "time",
      yDomain: [0, 100],
    });
    expect(result.xScale.domain().length).toBe(2);
  });

  it("creates pow scale with exponent 0.5", () => {
    /**
     *
     */
    const result = createScales({
      innerHeight: 400,
      innerWidth: 800,
      xDomain: [0, 100],
      yDomain: [0, 100],
      yExponent: 0.5,
      yType: "pow",
    });
    /**
     *
     */
    const mapped = result.yScale(50);
    expect(mapped).toBeGreaterThan(0);
    expect(mapped).toBeLessThan(400);
  });

  it("falls back to linear when unknown xType is given", () => {
    /**
     *
     */
    const result = createScales({
      innerHeight: 400,
      innerWidth: 800,
      xDomain: [0, 100],
      xType: "unknowntype" as Parameters<typeof createScales>[0]["xType"],
      yDomain: [0, 50],
    });
    expect(result.xScale.domain()).toEqual([0, 100]);
  });

  it("maps x domain to full innerWidth range", () => {
    /**
     *
     */
    const result = createScales({
      innerHeight: 200,
      innerWidth: 500,
      xDomain: [0, 10],
      yDomain: [0, 100],
    });
    expect(result.xScale(0)).toBeCloseTo(0, 2);
    expect(result.xScale(10)).toBeCloseTo(500, 2);
  });

  it("maps y domain to full innerHeight range (inverted)", () => {
    /**
     *
     */
    const result = createScales({
      innerHeight: 200,
      innerWidth: 500,
      xDomain: [0, 10],
      yDomain: [0, 100],
    });
    expect(result.yScale(0)).toBeCloseTo(200, 2);
    expect(result.yScale(100)).toBeCloseTo(0, 2);
  });

  it("returns NaN domain values when undefined domains are given", () => {
    /**
     *
     */
    const result = createScales({
      innerHeight: 400,
      innerWidth: 800,
      xDomain: [undefined, undefined] as [unknown, unknown],
      yDomain: [0, 100],
    });
    expect(Number.isNaN(result.xScale.domain()[0] as number)).toBe(true);
    expect(Number.isNaN(result.xScale.domain()[1] as number)).toBe(true);
  });
});