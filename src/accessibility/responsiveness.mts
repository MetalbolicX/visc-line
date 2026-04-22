/**
 * Options for observeResize.
 *
 * @property debounceMs - Milliseconds to debounce resize notifications. When > 0,
 *   callbacks are delayed until there is a pause in resize events. When 0 (the
 *   default), callbacks are throttled using requestAnimationFrame.
 */
export interface ObserveResizeOptions {
  readonly debounceMs?: number;
}

/**
 * Observe element size changes and schedule a render callback.
 *
 * This sets up a ResizeObserver on the provided container and schedules
 * invocations of renderCallback either debounced (when debounceMs > 0) or
 * throttled via requestAnimationFrame (default). The returned cleanup function
 * disconnects the observer and clears any pending scheduled callback.
 *
 * @param container - The DOM element to observe for size changes.
 * @param renderCallback - Callback invoked when a resize is observed. Should
 *   be idempotent and fast; it may be called frequently during resizes.
 * @param options.debounceMs - Optional debounce interval in milliseconds.
 *   Default: 0 (use requestAnimationFrame throttling).
 * @returns A cleanup function that disconnects the observer and cancels any
 *   pending animation frame or timeout.
 * @example
 * ```ts
 * const stop = observeResize(container, () => render(), { debounceMs: 100 });
 * // later
 * stop();
 * ```
 */
export const observeResize = (
  container: Element,
  renderCallback: () => void,
  { debounceMs = 0 }: ObserveResizeOptions = {},
): (() => void) => {
  // requestAnimationFrame id used when throttling without debounce
  let frameId: null | number = null;
  // Timeout id used when debounceMs > 0
  let timeoutId: null | ReturnType<typeof setTimeout> = null;

  const runCallback = (): void => {
    renderCallback();
  };

  /**
   * Schedule the render callback using either debounce or requestAnimationFrame.
   */
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

  /**
   * Create a ResizeObserver to watch the container element and schedule the render callback.
   */
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
