/**
 * Observe a DOM element for size changes and invoke a render callback when resizing occurs.
 *
 * @param container - The element to observe for resize events.
 * @param renderCallback - Callback to run when the element is resized.
 * @returns A function that, when called, disconnects the underlying ResizeObserver and stops observing.
 *
 * @remarks
 * This utility uses the browser's ResizeObserver API. Call the returned cleanup function to release resources
 * and stop listening for resize events.
 */
export const observeResize = (
  container: Element,
  renderCallback: () => void,
): (() => void) => {
  const observer = new ResizeObserver(() => renderCallback());
  observer.observe(container);
  return () => observer.disconnect();
};
