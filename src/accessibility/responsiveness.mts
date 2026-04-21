/**
 * Observe a DOM element for size changes and invoke a render callback when resizing occurs.
 *
 * @param container - The element to observe for resize events.
 * @param renderCallback - Callback to run when the element is resized.
 * @param options - Optional scheduling configuration.
 * @param options.debounceMs - Debounce delay in milliseconds. If provided and greater than 0,
 * callbacks are coalesced with a timeout; otherwise requestAnimationFrame throttling is used.
 * @returns A function that, when called, disconnects the underlying ResizeObserver and stops observing.
 *
 * @remarks
 * This utility uses the browser's ResizeObserver API. Call the returned cleanup function to release resources
 * and stop listening for resize events.
 */
export interface ObserveResizeOptions {
  debounceMs?: number;
}

export const observeResize = (
  container: Element,
  renderCallback: () => void,
  { debounceMs = 0 }: ObserveResizeOptions = {},
): (() => void) => {
  let frameId: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const runCallback = (): void => {
    renderCallback();
  };

  const scheduleRender = (): void => {
    if (debounceMs > 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        runCallback();
      }, debounceMs);
      return;
    }

    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }

    frameId = requestAnimationFrame(() => {
      frameId = null;
      runCallback();
    });
  };

  const observer = new ResizeObserver(() => {
    scheduleRender();
  });

  observer.observe(container);

  return () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    observer.disconnect();
  };
};
