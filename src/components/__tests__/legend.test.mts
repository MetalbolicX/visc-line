import { describe, expect, it } from "vitest";

import { select } from "d3";

import { renderLegend } from "@/components/legend.mjs";
import type { LegendItem } from "@/components/legend.mjs";

describe("renderLegend", () => {
  const createMockSvg = () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svg);
    return select(svg as SVGSVGElement);
  };

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a legend group", () => {
    const svg = createMockSvg();
    const items: LegendItem[] = [
      { color: "#1f77b4", label: "Series A" },
      { color: "#ff7f0e", label: "Series B" },
    ];
    renderLegend(svg, { items });
    const legend = svg.select<SVGGElement>("g.legend");
    expect(legend.empty()).toBe(false);
  });

  it("renders correct number of legend entries", () => {
    const svg = createMockSvg();
    const items: LegendItem[] = [
      { color: "#1f77b4", label: "Series A" },
      { color: "#ff7f0e", label: "Series B" },
      { color: "#2ca02c", label: "Series C" },
    ];
    renderLegend(svg, { items });
    const entries = svg.selectAll<SVGGElement, LegendItem>("g.legend-entry");
    expect(entries.size()).toBe(3);
  });

  it("uses color from item for swatch", () => {
    const svg = createMockSvg();
    const items: LegendItem[] = [{ color: "#ff0000", label: "Red Series" }];
    renderLegend(svg, { items });
    const swatch = svg.select<SVGRectElement>("rect.swatch");
    expect(swatch.attr("fill")).toBe("#ff0000");
  });

  it("uses label from item for text", () => {
    const svg = createMockSvg();
    const items: LegendItem[] = [{ color: "#1f77b4", label: "Revenue" }];
    renderLegend(svg, { items });
    const label = svg.select<SVGTextElement>("text.legend-label");
    expect(label.text()).toBe("Revenue");
  });

  it("is idempotent on re-render", () => {
    const svg = createMockSvg();
    const items: LegendItem[] = [{ color: "#1f77b4", label: "Series A" }];
    renderLegend(svg, { items });
    renderLegend(svg, { items });
    expect(svg.selectAll("g.legend").size()).toBe(1);
  });

  it("applies x and y offsets", () => {
    const svg = createMockSvg();
    const items: LegendItem[] = [{ color: "#1f77b4", label: "Series A" }];
    renderLegend(svg, { items, x: 100, y: 50 });
    const legend = svg.select<SVGGElement>("g.legend");
    expect(legend.attr("transform")).toBe("translate(100,50)");
  });
});