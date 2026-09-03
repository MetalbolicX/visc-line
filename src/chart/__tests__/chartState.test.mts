import { describe, expect, it } from "vitest";

import { getFeatureFlags } from "../chartState.mjs";
import type { ChartState, FeatureFlags } from "../chartState.mjs";
import type { ProcessedSeries } from "../../types/index.mjs";

const makeState = (overrides: Partial<ChartState<unknown>> = {}): ChartState<unknown> => ({
  allSeries: [] as unknown as readonly ProcessedSeries<unknown>[],
  allSeriesExtents: { xDomain: [undefined, undefined], yDomain: [undefined, undefined] },
  currentSeries: [] as unknown as readonly ProcessedSeries<unknown>[],
  customCallback: null,
  customCleanup: null,
  hasAxes: false,
  hasCustom: false,
  hasGrid: false,
  hasLegend: false,
  hasPoints: false,
  hasTitle: false,
  hasTooltip: false,
  hasZoomPan: false,
  isDisposed: false,
  axesOptions: {},
  gridOptions: {},
  legendOptions: null,
  titleOptions: null,
  tooltipOptions: {},
  visibleLabels: new Set(),
  zoomBehavior: null,
  zoomPanOptions: {},
  ...overrides,
});

describe("chartState", () => {
  describe("getFeatureFlags", () => {
    it("maps hasAxes from state", () => {
      const state = makeState({ hasAxes: true });
      const flags = getFeatureFlags(state);
      expect(flags.hasAxes).toBe(true);
    });

    it("maps hasCustom from state", () => {
      const state = makeState({ hasCustom: true });
      const flags = getFeatureFlags(state);
      expect(flags.hasCustom).toBe(true);
    });

    it("maps hasGrid from state", () => {
      const state = makeState({ hasGrid: true });
      const flags = getFeatureFlags(state);
      expect(flags.hasGrid).toBe(true);
    });

    it("maps hasLegend from state", () => {
      const state = makeState({ hasLegend: true });
      const flags = getFeatureFlags(state);
      expect(flags.hasLegend).toBe(true);
    });

    it("maps hasPoints from state", () => {
      const state = makeState({ hasPoints: true });
      const flags = getFeatureFlags(state);
      expect(flags.hasPoints).toBe(true);
    });

    it("maps hasTitle from state", () => {
      const state = makeState({ hasTitle: true });
      const flags = getFeatureFlags(state);
      expect(flags.hasTitle).toBe(true);
    });

    it("maps hasTooltip from state", () => {
      const state = makeState({ hasTooltip: true });
      const flags = getFeatureFlags(state);
      expect(flags.hasTooltip).toBe(true);
    });

    it("maps hasZoomPan from state", () => {
      const state = makeState({ hasZoomPan: true });
      const flags = getFeatureFlags(state);
      expect(flags.hasZoomPan).toBe(true);
    });

    it("returns a plain object with all 8 flag keys", () => {
      const state = makeState();
      const flags = getFeatureFlags(state);
      const flagKeys = Object.keys(flags) as (keyof FeatureFlags)[];
      expect(flagKeys).toContain("hasAxes");
      expect(flagKeys).toContain("hasCustom");
      expect(flagKeys).toContain("hasGrid");
      expect(flagKeys).toContain("hasLegend");
      expect(flagKeys).toContain("hasPoints");
      expect(flagKeys).toContain("hasTitle");
      expect(flagKeys).toContain("hasTooltip");
      expect(flagKeys).toContain("hasZoomPan");
      expect(flagKeys.length).toBe(8);
    });

    it("does not mutate the original state", () => {
      const state = makeState({ hasAxes: true });
      getFeatureFlags(state);
      expect(state.hasAxes).toBe(true);
    });

    it("default state has all features off", () => {
      const state = makeState();
      const flags = getFeatureFlags(state);
      expect(flags.hasAxes).toBe(false);
      expect(flags.hasCustom).toBe(false);
      expect(flags.hasGrid).toBe(false);
      expect(flags.hasLegend).toBe(false);
      expect(flags.hasPoints).toBe(false);
      expect(flags.hasTitle).toBe(false);
      expect(flags.hasTooltip).toBe(false);
      expect(flags.hasZoomPan).toBe(false);
    });

    it("returns a new object each call", () => {
      const state = makeState({ hasAxes: true });
      const flags1 = getFeatureFlags(state);
      const flags2 = getFeatureFlags(state);
      expect(flags1).not.toBe(flags2);
      expect(flags1).toEqual(flags2);
    });
  });
});
