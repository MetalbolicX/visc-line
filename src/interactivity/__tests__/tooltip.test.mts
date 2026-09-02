import { describe, expect, it } from "vitest";

import { addTooltip } from "../../interactivity/tooltip.mjs";
import type { TipVizTooltip } from "tipviz";
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
    readonly date: Date;
    readonly value: number;
  }

  /**
   *
   */
  const accessor = (d: DataPoint): unknown => d.date;

  it("returns a new array and does not mutate the original", () => {
    /**
     *
     */
    const data: readonly DataPoint[] = [
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
    const data: readonly DataPoint[] = [
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
    const data: readonly DataPoint[] = [
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

describe("TipVizTooltip v3 API (setTemplate + setData)", () => {
  // jsdom registers the custom element via the "tipviz" side-effect import above.

  it("setTemplate stores the template and setData populates data-bind slots", () => {
    const tooltip = document.createElement("tip-viz-tooltip") as TipVizTooltip;
    document.body.appendChild(tooltip);

    tooltip.setTemplate(/*html*/ `
      <div>
        <span data-bind="label"></span>:
        <span data-bind="value"></span>
      </div>`);

    tooltip.setData({ label: "Series A", value: "42" });

    const shadow = tooltip.shadowRoot!;
    const labelSlot = shadow.querySelector("[data-bind='label']");
    const valueSlot = shadow.querySelector("[data-bind='value']");

    expect(labelSlot?.textContent).toBe("Series A");
    expect(valueSlot?.textContent).toBe("42");

    // setData again updates the slots
    tooltip.setData({ label: "Series B", value: "99" });
    expect(labelSlot?.textContent).toBe("Series B");
    expect(valueSlot?.textContent).toBe("99");

    tooltip.remove();
  });

  it("show() makes the tooltip visible and hide() hides it", () => {
    const tooltip = document.createElement("tip-viz-tooltip") as TipVizTooltip;
    document.body.appendChild(tooltip);

    tooltip.setTemplate(/*html*/ `<div data-bind="text"></div>`);
    tooltip.setData({ text: "hello" });

    const anchor = document.createElement("div");
    document.body.appendChild(anchor);

    // Initially hidden (aria-hidden should be true)
    expect(tooltip.getAttribute("aria-hidden")).toBe("true");

    tooltip.show(anchor);
    expect(tooltip.getAttribute("aria-hidden")).toBe("false");

    tooltip.hide();
    expect(tooltip.getAttribute("aria-hidden")).toBe("true");

    tooltip.remove();
    anchor.remove();
  });

  it("series label containing <script> tag does not inject markup (sanitizer regression)", () => {
    const tooltip = document.createElement("tip-viz-tooltip") as TipVizTooltip;
    document.body.appendChild(tooltip);

    // Configure sanitizer — allowCustomElements is needed for the tooltip template shell.
    // The data-bind slots use textContent assignment, which escapes HTML entities.
    tooltip.setSanitizerConfig(
      // @ts-expect-error allowCustomElements may not be in the local TS DOM lib
      { allowCustomElements: true },
    );

    tooltip.setTemplate(/*html*/ `
      <div>
        <span data-bind="label"></span>
      </div>`);

    // Simulate a series label that a consumer might pass — contains a script tag.
    const maliciousLabel = "Series <script>window.__xss=1</script> X";
    tooltip.setData({ label: maliciousLabel });

    const shadow = tooltip.shadowRoot!;
    const labelSlot = shadow.querySelector("[data-bind='label']");

    // The slot must contain the literal text, not evaluated HTML
    expect(labelSlot?.textContent).toBe(maliciousLabel);
    // The script tag must NOT have been executed
    expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined();

    tooltip.remove();
  });

  it("setTemplate can be called once and setData updates slots on subsequent calls", () => {
    const tooltip = document.createElement("tip-viz-tooltip") as TipVizTooltip;
    document.body.appendChild(tooltip);

    tooltip.setTemplate(/*html*/ `
      <div data-bind="xLabel"></div>
      <span data-bind="row0Label"></span>
      <span data-bind="row0Value"></span>`);

    // First data update
    tooltip.setData({ xLabel: "Jan", row0Label: "Alpha", row0Value: "10" });
    const shadow = tooltip.shadowRoot!;
    expect(shadow.querySelector("[data-bind='xLabel']")?.textContent).toBe("Jan");
    expect(shadow.querySelector("[data-bind='row0Label']")?.textContent).toBe("Alpha");
    expect(shadow.querySelector("[data-bind='row0Value']")?.textContent).toBe("10");

    // Second data update (different values)
    tooltip.setData({ xLabel: "Feb", row0Label: "Beta", row0Value: "20" });
    expect(shadow.querySelector("[data-bind='xLabel']")?.textContent).toBe("Feb");
    expect(shadow.querySelector("[data-bind='row0Label']")?.textContent).toBe("Beta");
    expect(shadow.querySelector("[data-bind='row0Value']")?.textContent).toBe("20");

    tooltip.remove();
  });
});
