"use strict";

/**
 * Observes a DOM element for size changes and calls the provided render callback on each change.
 *
 * @param {Element} container - The DOM element to observe for resize events.
 * @param {() => void} renderCallback - Function invoked whenever the container's size changes.
 * @returns {() => void} A cleanup function that disconnects the ResizeObserver when called.
 */
export const observeResize = (container, renderCallback) => {
  const observer = new ResizeObserver(() => renderCallback());
  observer.observe(container);
  return () => observer.disconnect();
};
