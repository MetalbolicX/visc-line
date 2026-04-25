import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { select } from "d3";

import { renderSVG } from "@/components/SVG.mjs";

describe("renderSVG", () => {
  const createMockContainer = () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "clientWidth", { value: 800, writable: true });
    Object.defineProperty(el, "clientHeight", { value: 400, writable: true });
    document.body.appendChild(el);
    return el;
  };

  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query.includes("reduce"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      }),
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates exactly one svg element", () => {
    const container = createMockContainer();
    const svg = renderSVG(container);
    const allSvgs = select(container).selectAll<SVGSVGElement, null>("svg");
    expect(allSvgs.size()).toBe(1);
  });

  it("sets width from container clientWidth", () => {
    const container = createMockContainer();
    const svg = renderSVG(container);
    expect(svg.attr("width")).toBe("800");
  });

  it("sets height from container clientHeight", () => {
    const container = createMockContainer();
    const svg = renderSVG(container);
    expect(svg.attr("height")).toBe("400");
  });

  it("sets background style from CSS variable", () => {
    const container = createMockContainer();
    const svg = renderSVG(container);
    expect(svg.style("background")).toBe("var(--vl-background, white)");
  });

  it("sets overflow visible", () => {
    const container = createMockContainer();
    const svg = renderSVG(container);
    expect(svg.style("overflow")).toBe("visible");
  });

  it("sets role img", () => {
    const container = createMockContainer();
    const svg = renderSVG(container);
    expect(svg.attr("role")).toBe("img");
  });

  it("sets aria-label when provided", () => {
    const container = createMockContainer();
    const svg = renderSVG(container, "Revenue over time");
    expect(svg.attr("aria-label")).toBe("Revenue over time");
  });

  it("omits aria-label when not provided", () => {
    const container = createMockContainer();
    const svg = renderSVG(container);
    expect(svg.attr("aria-label")).toBeNull();
  });

  it("is idempotent on re-render", () => {
    const container = createMockContainer();
    renderSVG(container);
    renderSVG(container);
    expect(select(container).selectAll("svg").size()).toBe(1);
  });
});