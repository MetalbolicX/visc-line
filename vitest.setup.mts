global.ResizeObserver = class ResizeObserver {
  #callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.#callback = callback;
  }
  observe(_target: Element) {}
  unobserve(_target: Element) {}
  disconnect() {}
};

if (typeof SVGPathElement !== "undefined") {
  Object.defineProperty(SVGPathElement.prototype, "getTotalLength", {
    value: function () {
      return 100;
    },
    writable: true,
    configurable: true,
  });
}
