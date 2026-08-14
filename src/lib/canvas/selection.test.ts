import { afterEach, describe, expect, it } from "vitest";
import { getFixture } from "@/lib/canvas/fixtures";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  focusVisibleNode,
  handleCanvasEscape,
  nodeAccessibleName,
  nodeDomId,
  selectionAnnouncement,
} from "@/lib/canvas/selection";
import { MAX_ZOOM, MIN_ZOOM, clampZoom } from "@/lib/canvas/viewport";

describe("canvas selection helpers", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "document");
  });

  it("closes details on Escape and returns the selected node id", () => {
    expect(handleCanvasEscape("Escape", "node-9")).toEqual({
      close: true,
      focusNodeId: "node-9",
    });
    expect(handleCanvasEscape("Escape", null)).toEqual({
      close: false,
      focusNodeId: null,
    });
    expect(handleCanvasEscape("Enter", "node-9")).toEqual({
      close: false,
      focusNodeId: null,
    });
  });

  it("focuses the visible node when restoring focus", () => {
    const focused: string[] = [];
    const hidden = {
      getClientRects: () => [],
      focus() {
        focused.push("hidden");
      },
    };
    const visible = {
      getClientRects: () => [{ width: 12, height: 12 }],
      focus() {
        focused.push("visible");
      },
    };
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        querySelectorAll: () => [hidden, visible],
      },
    });

    expect(focusVisibleNode("fixture-3-en:c1")).toBe(true);
    expect(focused).toEqual(["visible"]);
  });

  it("builds localized accessible names and announcements", () => {
    const graph = getFixture("3", "pt-br");
    const dictionary = getDictionary("pt-br");
    const decision = graph.nodes.find((node) => node.kind === "decision");
    const consequence = graph.nodes.find((node) => node.kind === "consequence");
    expect(decision).toBeDefined();
    expect(consequence).toBeDefined();
    expect(nodeAccessibleName(decision!, dictionary)).toContain(
      dictionary.canvas.decisionLabel,
    );
    expect(nodeAccessibleName(consequence!, dictionary)).toContain(
      dictionary.canvas.consequenceLabel,
    );
    expect(selectionAnnouncement(consequence!, dictionary)).toContain(
      dictionary.canvas.consequenceLabel,
    );
    expect(nodeDomId("g:c:1", "map")).toBe("map-chronicle-node-g-c-1");
  });

  it("clamps zoom to safe limits", () => {
    expect(clampZoom(0.1)).toBe(MIN_ZOOM);
    expect(clampZoom(4)).toBe(MAX_ZOOM);
    expect(clampZoom(1)).toBe(1);
  });
});
