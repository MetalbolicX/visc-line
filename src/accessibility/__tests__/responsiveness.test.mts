import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { observeResize } from "@/accessibility/responsiveness.mjs";

describe("observeResize", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("returns a cleanup function", () => {
    const stop = observeResize(container, () => {});
    expect(typeof stop).toBe("function");
  });

  it("calls renderCallback when ResizeObserver fires", () => {
    const callback = vi.fn();
    observeResize(container, callback);
    const prototype = ResizeObserver.prototype;
    const origObserve = prototype.observe;
    prototype.observe = (el: Element) => {
      callback();
      (origObserve as (el: Element) => void).call(prototype, el);
    };
    observeResize(container, callback);
  });

  it("throttles via requestAnimationFrame when debounceMs is 0", () => {
    const callback = vi.fn();
    let capturedCallback: (() => void) | null = null;
    const orig = ResizeObserver;
    Object.defineProperty(globalThis, "ResizeObserver", {
      value: class MockResizeObserver {
        constructor(cb: () => void) {
          capturedCallback = cb;
        }
        observe() {}
        disconnect() {}
      },
      writable: true,
      configurable: true,
    });
    observeResize(container, callback);
    capturedCallback!();
    vi.advanceTimersByTime(16);
    expect(callback).toHaveBeenCalled();
    Object.defineProperty(globalThis, "ResizeObserver", {
      value: orig,
      writable: true,
      configurable: true,
    });
  });

  it("debounces with setTimeout when debounceMs > 0", () => {
    const callback = vi.fn();
    let capturedCallback: (() => void) | null = null;
    const orig = ResizeObserver;
    Object.defineProperty(globalThis, "ResizeObserver", {
      value: class MockResizeObserver {
        constructor(cb: () => void) {
          capturedCallback = cb;
        }
        observe() {}
        disconnect() {}
      },
      writable: true,
      configurable: true,
    });
    observeResize(container, callback, { debounceMs: 50 });
    capturedCallback!();
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(1);
    Object.defineProperty(globalThis, "ResizeObserver", {
      value: orig,
      writable: true,
      configurable: true,
    });
  });

  it("cleanup disconnects ResizeObserver", () => {
    const disconnectSpy = vi.spyOn(ResizeObserver.prototype, "disconnect");
    const cleanup = observeResize(container, () => {});
    cleanup();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it("cleanup cancels pending animation frame", () => {
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    let capturedCallback: (() => void) | null = null;
    const orig = ResizeObserver;
    Object.defineProperty(globalThis, "ResizeObserver", {
      value: class MockResizeObserver {
        constructor(cb: () => void) {
          capturedCallback = cb;
        }
        observe() {}
        disconnect() {}
      },
      writable: true,
      configurable: true,
    });
    const cleanup = observeResize(container, () => {});
    capturedCallback!();
    cleanup();
    expect(cancelSpy).toHaveBeenCalled();
    Object.defineProperty(globalThis, "ResizeObserver", {
      value: orig,
      writable: true,
      configurable: true,
    });
  });

  it("cleanup clears pending debounce timeout", () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    let capturedCallback: (() => void) | null = null;
    const orig = ResizeObserver;
    Object.defineProperty(globalThis, "ResizeObserver", {
      value: class MockResizeObserver {
        constructor(cb: () => void) {
          capturedCallback = cb;
        }
        observe() {}
        disconnect() {}
      },
      writable: true,
      configurable: true,
    });
    const cleanup = observeResize(container, () => {}, { debounceMs: 100 });
    capturedCallback!();
    cleanup();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    Object.defineProperty(globalThis, "ResizeObserver", {
      value: orig,
      writable: true,
      configurable: true,
    });
  });
});