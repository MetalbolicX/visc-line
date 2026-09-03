import { describe, expect, it } from "vitest";

import { asAxisScale } from "../axisScale.mjs";
import { scaleLinear, scaleTime } from "d3";

describe("axisScale", () => {
  describe("asAxisScale", () => {
    it("returns the scale as AxisCompatibleScale for linear scale", () => {
      const linear = scaleLinear().domain([0, 100]).range([0, 800]);
      const cast = asAxisScale(linear);
      expect(typeof cast.copy).toBe("function");
      expect(typeof cast.range).toBe("function");
      expect(Array.isArray(cast.range())).toBe(true);
    });

    it("returns the scale as AxisCompatibleScale for time scale", () => {
      const time = scaleTime()
        .domain([new Date("2023-01-01"), new Date("2023-01-02")])
        .range([0, 800]);
      const cast = asAxisScale(time);
      expect(typeof cast.copy).toBe("function");
      expect(typeof cast.range).toBe("function");
      expect(Array.isArray(cast.range())).toBe(true);
    });

    it("copy() returns an unknown (axis clone)", () => {
      const linear = scaleLinear().domain([0, 100]).range([0, 800]);
      const cast = asAxisScale(linear);
      const copied = cast.copy();
      // copy() exists and returns something
      expect(copied).toBeDefined();
    });

    it("range() returns the current range", () => {
      const linear = scaleLinear().domain([0, 100]).range([0, 800]);
      const cast = asAxisScale(linear);
      expect(cast.range()).toEqual([0, 800]);
    });

    it("accepts scaleLinear result without throwing", () => {
      const linear = scaleLinear().domain([0, 100]).range([0, 800]);
      expect(() => asAxisScale(linear)).not.toThrow();
    });

    it("accepts scaleTime result without throwing", () => {
      const time = scaleTime()
        .domain([new Date("2023-01-01"), new Date("2023-01-02")])
        .range([0, 800]);
      expect(() => asAxisScale(time)).not.toThrow();
    });
  });
});
