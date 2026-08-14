import { describe, expect, it, vi } from "vitest";
import {
  buildExpandRippleRequest,
  normalizeExpandExistingTitles,
} from "@/lib/chronicle/expand-context";
import {
  EXPAND_EXISTING_TITLE_MAX,
  EXPAND_EXISTING_TITLES_MAX,
} from "@/lib/chronicle/limits";
import { expandRippleRequestSchema } from "@/schemas/follow-up";
import type { ChronicleGraph } from "@/types/chronicle";

const baseGraph: ChronicleGraph = {
  version: 1,
  title: "Scout mercy",
  context: {
    tone: "mysterious",
    intensity: "moderate",
    setting: "fantasy",
    locale: "en",
  },
  nodes: [
    {
      id: "chr:origin",
      type: "origin",
      title: "The party spared the scout.",
      description: "Mercy leaves a trail.",
      parentId: null,
      depth: 0,
    },
    {
      id: "chr:c:0",
      type: "consequence",
      title: "A whispered debt",
      description: "Kin ask quiet favors.",
      parentId: "chr:origin",
      depth: 1,
      timeframe: "immediate",
      category: "social",
      trigger: "The scout talks.",
      affectedParties: ["the kin"],
      status: "pending",
    },
    {
      id: "chr:c:1",
      type: "consequence",
      title: "Standing orders change",
      description: "The watch is told not to take prisoners.",
      parentId: "chr:origin",
      depth: 1,
      status: "pending",
    },
  ],
};

describe("normalizeExpandExistingTitles", () => {
  it("clips, dedupes after clipping, then caps the list", () => {
    const prefix = "P".repeat(EXPAND_EXISTING_TITLE_MAX + 40);
    const titles = [
      `${prefix}alpha`,
      `${prefix}beta`,
      ...Array.from({ length: 30 }, (_, index) => `Title ${index + 1}`),
    ];
    const normalized = normalizeExpandExistingTitles(titles);
    expect(normalized).toHaveLength(EXPAND_EXISTING_TITLES_MAX);
    expect(
      normalized.every((title) => title.length <= EXPAND_EXISTING_TITLE_MAX),
    ).toBe(true);
    expect(normalized.filter((title) => title.startsWith("P"))).toHaveLength(1);
  });
});

describe("buildExpandRippleRequest", () => {
  it("sends a minimal path without ids, depth, or coordinates", () => {
    const built = buildExpandRippleRequest(baseGraph, "chr:c:0", "en");
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    expect(built.request.originTitle).toBe("The party spared the scout.");
    expect(built.request.selected.title).toBe("A whispered debt");
    expect(built.request.path.map((item) => item.title)).toEqual([
      "The party spared the scout.",
      "A whispered debt",
    ]);
    expect(built.request.existingTitles).toContain("Standing orders change");
    expect(JSON.stringify(built.request)).not.toContain("chr:c:0");
    expect(JSON.stringify(built.request)).not.toContain('"depth"');
    expect(built.request.tone).toBe("mysterious");
  });

  it("clips a 1000-character origin title inside existingTitles and stays schema-valid", () => {
    const longDecision = "D".repeat(1000);
    const graph: ChronicleGraph = {
      ...baseGraph,
      nodes: [
        { ...baseGraph.nodes[0]!, title: longDecision },
        baseGraph.nodes[1]!,
        baseGraph.nodes[2]!,
      ],
    };

    const built = buildExpandRippleRequest(graph, "chr:c:0", "en");
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    expect(built.request.originTitle).toHaveLength(1000);
    expect(
      built.request.existingTitles.every(
        (title) => title.length <= EXPAND_EXISTING_TITLE_MAX,
      ),
    ).toBe(true);
    expect(
      built.request.existingTitles.find((title) => title.startsWith("D")),
    ).toHaveLength(EXPAND_EXISTING_TITLE_MAX);
    expect(expandRippleRequestSchema.safeParse(built.request).success).toBe(
      true,
    );
  });

  it("clips sibling titles longer than the expand title max", () => {
    const longSibling = `Sibling ${"S".repeat(250)}`;
    const graph: ChronicleGraph = {
      ...baseGraph,
      nodes: [
        baseGraph.nodes[0]!,
        baseGraph.nodes[1]!,
        { ...baseGraph.nodes[2]!, title: longSibling },
      ],
    };

    const built = buildExpandRippleRequest(graph, "chr:c:0", "en");
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const clipped = built.request.existingTitles.find((title) =>
      title.startsWith("Sibling"),
    );
    expect(clipped).toBeTruthy();
    expect(clipped!.length).toBeLessThanOrEqual(EXPAND_EXISTING_TITLE_MAX);
    expect(built.request.existingTitles).not.toContain(longSibling);
  });

  it("dedupes titles that collide after clipping", () => {
    const prefix = "P".repeat(EXPAND_EXISTING_TITLE_MAX + 40);
    const graph: ChronicleGraph = {
      ...baseGraph,
      nodes: [
        baseGraph.nodes[0]!,
        baseGraph.nodes[1]!,
        { ...baseGraph.nodes[2]!, id: "chr:c:1", title: `${prefix}alpha` },
        {
          id: "chr:c:2",
          type: "consequence",
          title: `${prefix}beta`,
          description: "Another sibling.",
          parentId: "chr:origin",
          depth: 1,
          status: "pending",
        },
      ],
    };

    const built = buildExpandRippleRequest(graph, "chr:c:0", "en");
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const clippedSiblings = built.request.existingTitles.filter((title) =>
      title.startsWith("P"),
    );
    expect(clippedSiblings).toHaveLength(1);
  });

  it("returns VALIDATION_ERROR without claiming success when the payload cannot be prepared", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const graph: ChronicleGraph = {
      ...baseGraph,
      title: "T".repeat(200),
    };

    const built = buildExpandRippleRequest(graph, "chr:c:0", "en");
    expect(built).toEqual({ ok: false, code: "VALIDATION_ERROR" });
    expect(errorSpy).toHaveBeenCalledWith(
      "expand_request_invalid",
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: expect.any(String),
            code: expect.any(String),
          }),
        ]),
      }),
    );
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).not.toContain("T".repeat(50));
    errorSpy.mockRestore();
  });
});
