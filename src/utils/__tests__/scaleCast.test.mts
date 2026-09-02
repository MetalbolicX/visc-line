import { describe, expect, it } from "vitest";

import {
  asInvertibleScale,
  asScaleNumber,
  asTickable,
} from "../scaleCast.mjs";
import { scaleLinear, scaleLog, scalePow, scaleTime } from "d3";

describe("scaleCast", () => {
  describe("asScaleNumber", () => {
    it("returns the scale cast as (v: unknown) => number for linear scale", () => {
      const linear = scaleLinear().domain([0, 100]).range([0, 800]);
      const cast = asScaleNumber(linear);
      expect(typeof cast).toBe("function");
      expect(cast(50)).toBe(400);
    });

    it("returns the scale cast as (v: unknown) => number for log scale", () => {
      const log = scaleLog().domain([1, 100]).range([0, 400]);
      const cast = asScaleNumber(log);
      expect(typeof cast).toBe("function");
      expect(cast(10)).toBeCloseTo(200, 1);
    });

    it("returns the scale cast as (v: unknown) => number for pow scale", () => {
      const pow = scalePow().domain([0, 100]).range([0, 800]).exponent(0.5);
      const cast = asScaleNumber(pow);
      expect(typeof cast).toBe("function");
      expect(cast(25)).toBeCloseTo(400, 1);
    });

    it("returns the scale cast as (v: unknown) => number for time scale", () => {
      const time = scaleTime()
        .domain([new Date("2023-01-01"), new Date("2023-01-02")])
        .range([0, 800]);
      const cast = asScaleNumber(time);
      expect(typeof cast).toBe("function");
    });
  });

  describe("asInvertibleScale", () => {
    it("returns scale with invert method for linear scale", () => {
      const linear = scaleLinear().domain([0, 100]).range([0, 800]);
      const cast = asInvertibleScale(linear);
      expect(typeof cast.invert).toBe("function");
      expect(cast.invert(400)).toBe(50);
    });

    it("returns scale with invert method for log scale", () => {
      const log = scaleLog().domain([1, 100]).range([0, 400]);
      const cast = asInvertibleScale(log);
      expect(typeof cast.invert).toBe("function");
    });

    it("returns scale with invert method for pow scale", () => {
      const pow = scalePow().domain([0, 100]).range([0, 800]).exponent(0.5);
      const cast = asInvertibleScale(pow);
      expect(typeof cast.invert).toBe("function");
    });

    it("returns scale with invert method for time scale", () => {
      const time = scaleTime()
        .domain([new Date("2023-01-01"), new Date("2023-01-02")])
        .range([0, 800]);
      const cast = asInvertibleScale(time);
      expect(typeof cast.invert).toBe("function");
    });
  });

  describe("asTickable", () => {
    it("returns scale with domain() and ticks() for linear scale", () => {
      const linear = scaleLinear().domain([0, 100]).range([0, 800]);
      const cast = asTickable(linear);
      expect(typeof cast.domain).toBe("function");
      expect(typeof cast.ticks).toBe("function");
      expect(cast.domain()).toEqual([0, 100]);
      expect(Array.isArray(cast.ticks(5))).toBe(true);
    });

    it("returns scale with domain() and ticks() for log scale", () => {
      const log = scaleLog().domain([1, 100]).range([0, 400]);
      const cast = asTickable(log);
      expect(typeof cast.domain).toBe("function");
      expect(typeof cast.ticks).toBe("function");
    });

    it("returns scale with domain() and ticks() for pow scale", () => {
      const pow = scalePow().domain([0, 100]).range([0, 800]).exponent(0.5);
      const cast = asTickable(pow);
      expect(typeof cast.domain).toBe("function");
      expect(typeof cast.ticks).toBe("function");
    });

    it("returns scale with domain() and ticks() for time scale", () => {
      const time = scaleTime()
        .domain([new Date("2023-01-01"), new Date("2023-01-02")])
        .range([0, 800]);
      const cast = asTickable(time);
      expect(typeof cast.domain).toBe("function");
      expect(typeof cast.ticks).toBe("function");
    });
  });

  describe("wrong scale type behavior (current — plan 009 revisits)", () => {
    it("asScaleNumber accepts any AnyScale without throwing", () => {
      const linear = scaleLinear().domain([0, 100]).range([0, 800]);
      // Passing linear where a different type might be expected — no throw
      expect(() => asScaleNumber(linear as Parameters<typeof asScaleNumber>[0])).not.toThrow();
    });

    it("asInvertibleScale accepts any AnyScale without throwing", () => {
      const linear = scaleLinear().domain([0, 100]).range([0, 800]);
      expect(() => asInvertibleScale(linear as Parameters<typeof asInvertibleScale>[0])).not.toThrow();
    });

    it("asTickable accepts any AnyScale without throwing", () => {
      const linear = scaleLinear().domain([0, 100]).range([0, 800]);
      expect(() => asTickable(linear as Parameters<typeof asTickable>[0])).not.toThrow();
    });
  });
});
