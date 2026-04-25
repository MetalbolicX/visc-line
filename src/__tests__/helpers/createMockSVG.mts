import { select } from "d3";

import type { SVGSelection } from "@/types/index.mjs";

export const createMockContainer = (): HTMLDivElement => {
  const el = document.createElement("div");
  Object.defineProperty(el, "clientWidth", { value: 800, writable: true });
  Object.defineProperty(el, "clientHeight", { value: 400, writable: true });
  document.body.appendChild(el);
  return el;
};

export const createMockSVG = (): SVGSelection => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  container.appendChild(svg);
  return select(svg as SVGSVGElement) as unknown as SVGSelection;
};