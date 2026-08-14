import { describe, expect, it } from "vitest";
import { getFixture } from "@/lib/canvas/fixtures";
import { layoutNarrativeGraph } from "@/lib/canvas/layout";
import {
  DEFAULT_INSETS,
  DEFAULT_ZOOM,
  FIT_PADDING_RATIO,
  MAX_ZOOM,
  MIN_ZOOM,
  centerSelected,
  clampPan,
  clampZoom,
  commitViewState,
  contentBounds,
  fitChronicle,
  isAtMaxZoom,
  isAtMinZoom,
  nextFocusIndex,
  nodeIsVisible,
  resetZoom,
  viewStatesEqual,
  zoomPercent,
} from "@/lib/canvas/viewport";

const VIEWPORT = { width: 1280, height: 720 };
const COMPACT = { width: 900, height: 620 };

describe("viewport camera", () => {
  it("clamps zoom to safe limits", () => {
    expect(clampZoom(0.1)).toBe(MIN_ZOOM);
    expect(clampZoom(4)).toBe(MAX_ZOOM);
    expect(clampZoom(1)).toBe(1);
    expect(isAtMinZoom(MIN_ZOOM)).toBe(true);
    expect(isAtMaxZoom(MAX_ZOOM)).toBe(true);
    expect(zoomPercent(1)).toBe(100);
  });

  it("fits every fixture inside the desktop viewport with padding", () => {
    for (const id of ["3", "5", "10", "25"] as const) {
      const layout = layoutNarrativeGraph(getFixture(id, "en"));
      const bounds = contentBounds(layout.nodes);
      const view = fitChronicle(bounds, VIEWPORT);

      expect(view.scale).toBeGreaterThanOrEqual(MIN_ZOOM);
      expect(view.scale).toBeLessThanOrEqual(MAX_ZOOM);

      if (view.scale > MIN_ZOOM) {
        const usableWidth =
          VIEWPORT.width - DEFAULT_INSETS.left - DEFAULT_INSETS.right;
        const usableHeight =
          VIEWPORT.height - DEFAULT_INSETS.top - DEFAULT_INSETS.bottom;
        expect(bounds.width * view.scale).toBeLessThanOrEqual(
          usableWidth * (1 - FIT_PADDING_RATIO * 2) + 1,
        );
        expect(bounds.height * view.scale).toBeLessThanOrEqual(
          usableHeight * (1 - FIT_PADDING_RATIO * 2) + 1,
        );
      }

      for (const node of layout.nodes) {
        expect(nodeIsVisible(node, view, VIEWPORT)).toBe(true);
      }
    }
  });

  it("keeps the 25-node chronicle visible in a compact desktop viewport", () => {
    const layout = layoutNarrativeGraph(getFixture("25", "en"));
    const bounds = contentBounds(layout.nodes);
    const view = fitChronicle(bounds, COMPACT);
    const visibleCount = layout.nodes.filter((node) =>
      nodeIsVisible(node, view, COMPACT),
    ).length;

    expect(view.y).toBeGreaterThan(-layout.height * view.scale);
    expect(visibleCount).toBe(layout.nodes.length);
    expect(visibleCount).toBeGreaterThan(8);
  });

  it("centers a deep follow-up without covering it and without changing selection math", () => {
    const graph = getFixture("25", "en");
    const layout = layoutNarrativeGraph(graph);
    const followUp = layout.nodes.find((node) => node.kind === "follow_up");
    expect(followUp).toBeDefined();

    const view = centerSelected(followUp!, VIEWPORT, DEFAULT_INSETS, 0.5);
    expect(view.scale).toBeGreaterThanOrEqual(0.78);
    expect(nodeIsVisible(followUp!, view, VIEWPORT)).toBe(true);
  });

  it("reset zoom returns a coherent view that is not empty", () => {
    const layout = layoutNarrativeGraph(getFixture("10", "en"));
    const bounds = contentBounds(layout.nodes);
    const view = resetZoom(bounds, VIEWPORT);
    expect(view.scale).toBeLessThanOrEqual(DEFAULT_ZOOM);
    expect(
      layout.nodes.some((node) => nodeIsVisible(node, view, VIEWPORT)),
    ).toBe(true);
  });

  it("clampPan keeps part of the chronicle inside the viewport", () => {
    const layout = layoutNarrativeGraph(getFixture("5", "en"));
    const bounds = contentBounds(layout.nodes);
    const lost = clampPan(
      { x: -8000, y: -8000, scale: 1 },
      bounds,
      VIEWPORT,
    );
    expect(
      layout.nodes.some((node) => nodeIsVisible(node, lost, VIEWPORT)),
    ).toBe(true);
  });

  it("commitViewState is idempotent when the camera did not move", () => {
    const layout = layoutNarrativeGraph(getFixture("5", "en"));
    const bounds = contentBounds(layout.nodes);
    const fitted = fitChronicle(bounds, VIEWPORT);
    const again = commitViewState(fitted, fitted, bounds, VIEWPORT);
    const clampedSame = commitViewState(
      fitted,
      clampPan(fitted, bounds, VIEWPORT),
      bounds,
      VIEWPORT,
    );

    expect(viewStatesEqual(fitted, fitted)).toBe(true);
    expect(again.changed).toBe(false);
    expect(again.view).toBe(fitted);
    expect(clampedSame.changed).toBe(false);
    expect(clampedSame.view).toBe(fitted);
  });

  it("cycles focus trap indexes", () => {
    expect(nextFocusIndex(0, 3, false)).toBe(1);
    expect(nextFocusIndex(2, 3, false)).toBe(0);
    expect(nextFocusIndex(0, 3, true)).toBe(2);
  });
});
