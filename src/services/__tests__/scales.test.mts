import { describe, expect, it, vi } from "vitest";

import { createScales } from "../../services/scales.mjs";

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
      ] as readonly [number, number],
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

  describe("empty / all-invalid domain guard", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it("returns [0, 1] and warns once when xDomain is [undefined, undefined] (linear)", () => {
      const result = createScales({
        innerHeight: 400,
        innerWidth: 800,
        xDomain: [undefined, undefined] as readonly [undefined, undefined],
        yDomain: [0, 100],
      });
      const [d0, d1] = result.xScale.domain();
      expect(Number.isFinite(d0 as number)).toBe(true);
      expect(Number.isFinite(d1 as number)).toBe(true);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/empty|invalid/);
    });

    it("returns [0, 1] and warns once when xDomain is [NaN, NaN] (linear)", () => {
      const result = createScales({
        innerHeight: 400,
        innerWidth: 800,
        xDomain: [NaN, NaN] as unknown as readonly [number, number],
        yDomain: [0, 100],
      });
      const [d0, d1] = result.xScale.domain();
      expect(Number.isFinite(d0 as number)).toBe(true);
      expect(Number.isFinite(d1 as number)).toBe(true);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("returns default domain and warns when xDomain is [undefined, 5] (mixed)", () => {
      const result = createScales({
        innerHeight: 400,
        innerWidth: 800,
        xDomain: [undefined, 5] as unknown as readonly [number, number],
        yDomain: [0, 100],
      });
      const [d0, d1] = result.xScale.domain();
      expect(Number.isFinite(d0 as number)).toBe(true);
      expect(Number.isFinite(d1 as number)).toBe(true);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("returns finite time domain and warns once when xDomain is [undefined, undefined] (time)", () => {
      const result = createScales({
        innerHeight: 400,
        innerWidth: 800,
        xDomain: [undefined, undefined] as readonly [undefined, undefined],
        xType: "time",
        yDomain: [0, 100],
      });
      const [d0, d1] = result.xScale.domain() as [Date, Date];
      expect(d0 instanceof Date).toBe(true);
      expect(d1 instanceof Date).toBe(true);
      // nice() may expand the domain; verify both ends are finite dates
      expect(Number.isFinite(+d0)).toBe(true);
      expect(Number.isFinite(+d1)).toBe(true);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("returns domain unchanged and does NOT warn when xDomain is [0, 10] (linear)", () => {
      const result = createScales({
        innerHeight: 400,
        innerWidth: 800,
        xDomain: [0, 10],
        yDomain: [0, 100],
      });
      expect(result.xScale.domain()).toEqual([0, 10]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("accepts historical Date domains without warning and maps them in range", () => {
      const result = createScales({
        innerHeight: 400,
        innerWidth: 800,
        xDomain: [new Date("2020-02-01"), new Date("2020-06-01")],
        xType: "time",
        yDomain: [0, 100],
      });

      expect(warnSpy).not.toHaveBeenCalled();
      expect(result.xScale(new Date("2020-02-01"))).toBeGreaterThanOrEqual(0);
      expect(result.xScale(new Date("2020-06-01"))).toBeLessThanOrEqual(800);
    });

    it("preserves the year of a historical Date domain", () => {
      const result = createScales({
        innerHeight: 400,
        innerWidth: 800,
        xDomain: [new Date("2020-02-01"), new Date("2020-06-01")],
        xType: "time",
        yDomain: [0, 100],
      });

      expect((result.xScale.domain()[0] as Date).getFullYear()).toBe(2020);
    });

    it("maps dates older than 24 hours to finite in-range pixels", () => {
      const result = createScales({
        innerHeight: 400,
        innerWidth: 800,
        xDomain: [new Date("2020-02-01"), new Date("2020-06-01")],
        xType: "time",
        yDomain: [0, 100],
      });
      const mapped = result.xScale(new Date("2020-03-15"));

      expect(Number.isFinite(mapped)).toBe(true);
      expect(mapped).toBeGreaterThanOrEqual(0);
      expect(mapped).toBeLessThanOrEqual(800);
    });

    it("returns [0, 1] and warns once when yDomain is [undefined, undefined] (linear)", () => {
      const result = createScales({
        innerHeight: 400,
        innerWidth: 800,
        xDomain: [0, 10],
        yDomain: [undefined, undefined] as readonly [undefined, undefined],
      });
      const [d0, d1] = result.yScale.domain();
      expect(Number.isFinite(d0 as number)).toBe(true);
      expect(Number.isFinite(d1 as number)).toBe(true);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/empty|invalid/);
    });

    it("returns [0, 1] and warns once when yDomain is [NaN, NaN] (linear)", () => {
      const result = createScales({
        innerHeight: 400,
        innerWidth: 800,
        xDomain: [0, 10],
        yDomain: [NaN, NaN] as unknown as readonly [number, number],
      });
      const [d0, d1] = result.yScale.domain();
      expect(Number.isFinite(d0 as number)).toBe(true);
      expect(Number.isFinite(d1 as number)).toBe(true);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
