"use strict";
import { scaleLinear, scalePow, scaleLog, scaleTime } from "d3";

const SCALE_FACTORIES = {
  linear: () => scaleLinear(),
  pow: (exp = 2) => scalePow().exponent(exp),
  log: () => scaleLog(),
  time: () => scaleTime(),
};

/**
 * Create and configure x and y scales for a cartesian line chart.
 *
 * @param {Object} options - Configuration options.
 * @param {[number, number]} options.xDomain - The input domain for the x scale.
 * @param {[number, number]} options.yDomain - The input domain for the y scale.
 * @param {number} options.innerWidth - The width of the drawable inner area (pixels).
 * @param {number} options.innerHeight - The height of the drawable inner area (pixels).
 * @param {string} [options.xType="linear"] - The x scale type key to select from SCALE_FACTORIES (e.g. "linear", "pow").
 * @param {string} [options.yType="linear"] - The y scale type key to select from SCALE_FACTORIES.
 * @param {number} [options.xExponent=2] - Exponent used for power-type x scales.
 * @param {number} [options.yExponent=2] - Exponent used for power-type y scales.
 * @returns {{ xScale: Function, yScale: Function }} An object containing configured xScale and yScale. Each scale is a factory instance with domain, range, and niceness applied; xScale maps domain to [0, innerWidth], yScale maps domain to [innerHeight, 0].
 */
export const createScales = ({
  xDomain,
  yDomain,
  innerWidth,
  innerHeight,
  xType = "linear",
  yType = "linear",
  xExponent = 2,
  yExponent = 2,
}) => {
  const xScale = (SCALE_FACTORIES[xType] ?? SCALE_FACTORIES.linear)(xExponent)
    .domain(xDomain)
    .range([0, innerWidth])
    .nice();

  const yScale = (SCALE_FACTORIES[yType] ?? SCALE_FACTORIES.linear)(yExponent)
    .domain(yDomain)
    .range([innerHeight, 0])
    .nice();

  return { xScale, yScale };
};
