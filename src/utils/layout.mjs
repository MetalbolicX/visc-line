"use strict";

/**
 * Compute outer and inner drawing dimensions from a container element and margin values.
 *
 * @param {Element|HTMLElement|SVGElement} container - DOM element used to determine available size via getBoundingClientRect().
 * @param {{top:number, right:number, bottom:number, left:number}} margins - Margins to subtract from the container's width and height.
 * @returns {{width:number, height:number, innerWidth:number, innerHeight:number, margins:{top:number, right:number, bottom:number, left:number}}}
 *   An object containing:
 *   - width: full container width
 *   - height: full container height
 *   - innerWidth: width minus horizontal margins (clamped to >= 0)
 *   - innerHeight: height minus vertical margins (clamped to >= 0)
 *   - margins: the original margins object
 */
export const getDimensions = (container, margins) => {
  const { width, height } = container.getBoundingClientRect();
  return {
    width,
    height,
    innerWidth: Math.max(0, width - margins.left - margins.right),
    innerHeight: Math.max(0, height - margins.top - margins.bottom),
    margins,
  };
};
