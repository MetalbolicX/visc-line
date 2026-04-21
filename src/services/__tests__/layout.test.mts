import { describe, expect, it } from "vitest";

import { getDimensions } from "../../services/layout.mjs";

describe("getDimensions", () => {
  it("computes correct outer dimensions from container", () => {
    /**
     *
     */
    const container = {
      /**
       *
       */
      getBoundingClientRect: () => ({ height: 400, width: 800 }),
    } as Element;

    /**
     *
     */
    const result = getDimensions(container, {
      bottom: 50,
      left: 60,
      right: 60,
      top: 50,
    });

    expect(result.width).toBe(800);
    expect(result.height).toBe(400);
  });

  it("computes innerWidth and innerHeight by subtracting margins", () => {
    /**
     *
     */
    const container = {
      /**
       *
       */
      getBoundingClientRect: () => ({ height: 400, width: 800 }),
    } as Element;

    /**
     *
     */
    const result = getDimensions(container, {
      bottom: 50,
      left: 60,
      right: 60,
      top: 50,
    });

    expect(result.innerWidth).toBe(680);
    expect(result.innerHeight).toBe(300);
  });

  it("returns the provided margins in the result", () => {
    /**
     *
     */
    const container = {
      /**
       *
       */
      getBoundingClientRect: () => ({ height: 400, width: 800 }),
    } as Element;

    /**
     *
     */
    const margins = { bottom: 40, left: 10, right: 20, top: 30 };
    /**
     *
     */
    const result = getDimensions(container, margins);

    expect(result.margins).toEqual(margins);
  });

  it("returns zero innerWidth when margins exceed container width", () => {
    /**
     *
     */
    const container = {
      /**
       *
       */
      getBoundingClientRect: () => ({ height: 400, width: 100 }),
    } as Element;

    /**
     *
     */
    const result = getDimensions(container, {
      bottom: 0,
      left: 200,
      right: 0,
      top: 0,
    });

    expect(result.innerWidth).toBeLessThanOrEqual(0);
  });

  it("returns zero innerHeight when margins exceed container height", () => {
    /**
     *
     */
    const container = {
      /**
       *
       */
      getBoundingClientRect: () => ({ height: 50, width: 800 }),
    } as Element;

    /**
     *
     */
    const result = getDimensions(container, {
      bottom: 30,
      left: 0,
      right: 0,
      top: 30,
    });

    expect(result.innerHeight).toBeLessThanOrEqual(0);
  });

  it("uses Math.max to prevent negative inner dimensions", () => {
    /**
     *
     */
    const container = {
      /**
       *
       */
      getBoundingClientRect: () => ({ height: 50, width: 50 }),
    } as Element;

    /**
     *
     */
    const result = getDimensions(container, {
      bottom: 50,
      left: 50,
      right: 50,
      top: 50,
    });

    expect(result.innerWidth).toBe(0);
    expect(result.innerHeight).toBe(0);
  });

  it("handles zero margins correctly", () => {
    /**
     *
     */
    const container = {
      /**
       *
       */
      getBoundingClientRect: () => ({ height: 480, width: 640 }),
    } as Element;

    /**
     *
     */
    const result = getDimensions(container, {
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
    });

    expect(result.innerWidth).toBe(640);
    expect(result.innerHeight).toBe(480);
  });
});
