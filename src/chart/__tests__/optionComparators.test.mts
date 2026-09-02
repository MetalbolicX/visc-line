import { describe, expect, it } from "vitest";

import {
  areAxesOptionsEqual,
  areGridOptionsEqual,
  areLegendOptionsEqual,
  areTitleOptionsEqual,
  areTooltipOptionsEqual,
  areZoomPanOptionsEqual,
} from "../optionComparators.mjs";

describe("optionComparators", () => {
  describe("areAxesOptionsEqual", () => {
    it("returns true when axis options match", () => {
      const xTickFormat = (v: unknown): string => String(v);
      const yTickFormat = (v: unknown): string => String(v);
      expect(
        areAxesOptionsEqual(
          { xTickCount: 6, yTickCount: 4, xTickFormat, yTickFormat },
          { xTickCount: 6, yTickCount: 4, xTickFormat, yTickFormat },
        ),
      ).toBe(true);
    });

    it("returns false when any axis option differs", () => {
      expect(
        areAxesOptionsEqual(
          { xTickCount: 6 },
          { xTickCount: 5 },
        ),
      ).toBe(false);
    });
  });

  describe("areGridOptionsEqual", () => {
    it("treats undefined as true for both directions", () => {
      expect(
        areGridOptionsEqual({}, { showX: true, showY: true }),
      ).toBe(true);
    });

    it("returns false when show flags differ", () => {
      expect(
        areGridOptionsEqual(
          { showX: true, showY: true },
          { showX: false, showY: true },
        ),
      ).toBe(false);
    });
  });

  describe("areTitleOptionsEqual", () => {
    it("returns true when titles match", () => {
      expect(
        areTitleOptionsEqual({ title: "Revenue" }, { title: "Revenue" }),
      ).toBe(true);
    });

    it("returns false when previous is null", () => {
      expect(areTitleOptionsEqual(null, { title: "Revenue" })).toBe(false);
    });

    it("returns false when titles differ", () => {
      expect(
        areTitleOptionsEqual({ title: "Revenue" }, { title: "Cost" }),
      ).toBe(false);
    });
  });

  describe("areLegendOptionsEqual", () => {
    it("returns false when previous is null", () => {
      expect(
        areLegendOptionsEqual(null, {
          items: [{ color: "steelblue", label: "Revenue" }],
        }),
      ).toBe(false);
    });

    it("returns true for equal legend options", () => {
      const previous = {
        items: [
          { color: "steelblue", label: "Revenue" },
          { color: "tomato", label: "Cost" },
        ],
      };
      const next = {
        items: [
          { color: "steelblue", label: "Revenue" },
          { color: "tomato", label: "Cost" },
        ],
      };

      expect(areLegendOptionsEqual(previous, next)).toBe(true);
    });

    it("returns false for different lengths", () => {
      const previous = {
        items: [{ color: "steelblue", label: "Revenue" }],
      };
      const next = {
        items: [
          { color: "steelblue", label: "Revenue" },
          { color: "tomato", label: "Cost" },
        ],
      };

      expect(areLegendOptionsEqual(previous, next)).toBe(false);
    });

    it("returns false for different item content", () => {
      const previous = {
        items: [{ color: "steelblue", label: "Revenue" }],
      };
      const next = {
        items: [{ color: "tomato", label: "Revenue" }],
      };

      expect(areLegendOptionsEqual(previous, next)).toBe(false);
    });

    it("returns false when interactive flag differs", () => {
      const previous = {
        interactive: false,
        items: [{ color: "steelblue", label: "Revenue" }],
      };
      const next = {
        interactive: true,
        items: [{ color: "steelblue", label: "Revenue" }],
      };

      expect(areLegendOptionsEqual(previous, next)).toBe(false);
    });

    it("returns false when onToggle callback reference differs", () => {
      const onToggle = (): void => {};
      const previous = {
        items: [{ color: "steelblue", label: "Revenue" }],
        onToggle,
      };
      const next = {
        items: [{ color: "steelblue", label: "Revenue" }],
        onToggle: (): void => {},
      };

      expect(areLegendOptionsEqual(previous, next)).toBe(false);
    });

    it("returns true when both items are undefined (auto-derived)", () => {
      expect(areLegendOptionsEqual({}, {})).toBe(true);
    });

    it("returns true when both items are undefined with same interactive flag", () => {
      const previous = { interactive: true };
      const next = { interactive: true };
      expect(areLegendOptionsEqual(previous, next)).toBe(true);
    });

    it("returns false when previous items is undefined and next is explicit", () => {
      const previous = {};
      const next = {
        items: [{ color: "steelblue", label: "Revenue" }],
      };
      expect(areLegendOptionsEqual(previous, next)).toBe(false);
    });

    it("returns false when previous items is explicit and next is undefined", () => {
      const previous = {
        items: [{ color: "steelblue", label: "Revenue" }],
      };
      const next = {};
      expect(areLegendOptionsEqual(previous, next)).toBe(false);
    });
  });

  describe("areTooltipOptionsEqual", () => {
    it("returns true when options are equal", () => {
      const formatX = (v: unknown): string => String(v);
      const formatY = (v: unknown): string => String(v);
      expect(
        areTooltipOptionsEqual(
          { formatX, formatY, stylesheetUrl: "a.css" },
          { formatX, formatY, stylesheetUrl: "a.css" },
        ),
      ).toBe(true);
    });

    it("returns false when formatter references differ", () => {
      expect(
        areTooltipOptionsEqual(
          { formatX: (v) => String(v), stylesheetUrl: "a.css" },
          { formatX: (v) => String(v), stylesheetUrl: "a.css" },
        ),
      ).toBe(false);
    });

    it("returns false when stylesheet differs", () => {
      expect(
        areTooltipOptionsEqual(
          { stylesheetUrl: "a.css" },
          { stylesheetUrl: "b.css" },
        ),
      ).toBe(false);
    });

    it("returns false when tooltipHtml differs", () => {
      expect(
        areTooltipOptionsEqual(
          { tooltipHtml: () => "a" },
          { tooltipHtml: () => "b" },
        ),
      ).toBe(false);
    });
  });

  describe("areZoomPanOptionsEqual", () => {
    it("returns true when callback references match", () => {
      const onZoom = (): void => {};
      expect(
        areZoomPanOptionsEqual({ onZoom }, { onZoom }),
      ).toBe(true);
    });

    it("returns false when callback references differ", () => {
      expect(
        areZoomPanOptionsEqual(
          { onZoom: () => {} },
          { onZoom: () => {} },
        ),
      ).toBe(false);
    });

    it("returns true when scaleExtent and onZoom both match", () => {
      const onZoom = (): void => {};
      expect(
        areZoomPanOptionsEqual(
          { onZoom, scaleExtent: [0.5, 8] },
          { onZoom, scaleExtent: [0.5, 8] },
        ),
      ).toBe(true);
    });

    it("returns false when scaleExtent endpoints differ", () => {
      const onZoom = (): void => {};
      expect(
        areZoomPanOptionsEqual(
          { onZoom, scaleExtent: [0.5, 8] },
          { onZoom, scaleExtent: [0.5, 32] },
        ),
      ).toBe(false);
    });

    it("returns true when both scaleExtent are undefined", () => {
      const onZoom = (): void => {};
      expect(
        areZoomPanOptionsEqual(
          { onZoom, scaleExtent: undefined },
          { onZoom, scaleExtent: undefined },
        ),
      ).toBe(true);
    });

    it("returns false when only one scaleExtent is undefined", () => {
      const onZoom = (): void => {};
      expect(
        areZoomPanOptionsEqual(
          { onZoom, scaleExtent: [0.5, 8] },
          { onZoom, scaleExtent: undefined },
        ),
      ).toBe(false);
    });
  });
});
