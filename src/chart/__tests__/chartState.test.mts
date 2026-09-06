import { describe, expect, it } from "vitest";

import { FEATURE_REGISTRY } from "../featureRegistry.mjs";
import type { ChartState, FeatureFlags } from "../chartState.mjs";
import type { ProcessedSeries } from "../../types/index.mjs";

const makeState = (overrides: Partial<ChartState<unknown>> = {}): ChartState<unknown> => ({
  allSeries: [] as unknown as readonly ProcessedSeries<unknown>[],
  allSeriesExtents: { xDomain: [undefined, undefined], yDomain: [undefined, undefined] },
  annotationsOptions: null,
  axesOptions: {},
  currentSeries: [] as unknown as readonly ProcessedSeries<unknown>[],
  customCallback: null,
  customCleanup: null,
  endLabelsOptions: null,
  focusLabels: new Set<string>(),
  gridOptions: {},
  hasAnnotations: false,
  hasAxes: false,
  hasCustom: false,
  hasEndLabels: false,
  hasGrid: false,
  hasLegend: false,
  hasPoints: false,
  hasReferenceLines: false,
  hasTitle: false,
  hasTooltip: false,
  hasZoomPan: false,
  isDisposed: false,
  legendOptions: null,
  referenceLinesOptions: { lines: [] },
  titleOptions: null,
  tooltipOptions: {},
  visibleLabels: new Set(),
  zoomBehavior: null,
  zoomPanOptions: {},
  ...overrides,
});

/** Derive FeatureFlags from state using the same approach as createChart */
const deriveFlags = (state: ChartState<unknown>): FeatureFlags =>
  Object.fromEntries(
    FEATURE_REGISTRY.map((f) => [f.flagKey, Boolean(state[f.flagKey])]),
  ) as FeatureFlags;

describe("chartState", () => {
  describe("registry-driven flags", () => {
    it("maps hasAxes from state", () => {
      const state = makeState({ hasAxes: true });
      const flags = deriveFlags(state);
      expect(flags.hasAxes).toBe(true);
    });

    it("maps hasCustom from state", () => {
      const state = makeState({ hasCustom: true });
      const flags = deriveFlags(state);
      expect(flags.hasCustom).toBe(true);
    });

    it("maps hasEndLabels from state", () => {
      const state = makeState({ hasEndLabels: true });
      const flags = deriveFlags(state);
      expect(flags.hasEndLabels).toBe(true);
    });

    it("maps hasGrid from state", () => {
      const state = makeState({ hasGrid: true });
      const flags = deriveFlags(state);
      expect(flags.hasGrid).toBe(true);
    });

    it("maps hasLegend from state", () => {
      const state = makeState({ hasLegend: true });
      const flags = deriveFlags(state);
      expect(flags.hasLegend).toBe(true);
    });

    it("maps hasPoints from state", () => {
      const state = makeState({ hasPoints: true });
      const flags = deriveFlags(state);
      expect(flags.hasPoints).toBe(true);
    });

    it("maps hasTitle from state", () => {
      const state = makeState({ hasTitle: true });
      const flags = deriveFlags(state);
      expect(flags.hasTitle).toBe(true);
    });

    it("maps hasTooltip from state", () => {
      const state = makeState({ hasTooltip: true });
      const flags = deriveFlags(state);
      expect(flags.hasTooltip).toBe(true);
    });

    it("maps hasZoomPan from state", () => {
      const state = makeState({ hasZoomPan: true });
      const flags = deriveFlags(state);
      expect(flags.hasZoomPan).toBe(true);
    });

    it("returns a plain object with all 10 flag keys", () => {
      const state = makeState();
      const flags = deriveFlags(state);
      const flagKeys = Object.keys(flags) as (keyof FeatureFlags)[];
      expect(flagKeys).toContain("hasAnnotations");
      expect(flagKeys).toContain("hasAxes");
      expect(flagKeys).toContain("hasCustom");
      expect(flagKeys).toContain("hasEndLabels");
      expect(flagKeys).toContain("hasGrid");
      expect(flagKeys).toContain("hasLegend");
      expect(flagKeys).toContain("hasPoints");
      expect(flagKeys).toContain("hasReferenceLines");
      expect(flagKeys).toContain("hasTitle");
      expect(flagKeys).toContain("hasTooltip");
      expect(flagKeys).toContain("hasZoomPan");
      expect(flagKeys.length).toBe(11);
    });

    it("default state has all features off", () => {
      const state = makeState();
      const flags = deriveFlags(state);
      expect(flags.hasAxes).toBe(false);
      expect(flags.hasCustom).toBe(false);
      expect(flags.hasEndLabels).toBe(false);
      expect(flags.hasGrid).toBe(false);
      expect(flags.hasLegend).toBe(false);
      expect(flags.hasPoints).toBe(false);
      expect(flags.hasTitle).toBe(false);
      expect(flags.hasTooltip).toBe(false);
      expect(flags.hasZoomPan).toBe(false);
    });

    it("returns a new object each call", () => {
      const state = makeState({ hasAxes: true });
      const flags1 = deriveFlags(state);
      const flags2 = deriveFlags(state);
      expect(flags1).not.toBe(flags2);
      expect(flags1).toEqual(flags2);
    });
  });
});
