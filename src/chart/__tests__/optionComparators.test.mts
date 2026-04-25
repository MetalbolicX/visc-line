import { describe, expect, it } from "vitest";

import {
  areLegendOptionsEqual,
  areTitleOptionsEqual,
  areTooltipOptionsEqual,
  areZoomPanOptionsEqual,
} from "../optionComparators.mjs";

describe("optionComparators", () => {
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
  });
});
