import { describe, expect, it } from "vitest";
import { buildExpandRippleRequest } from "@/lib/chronicle/expand-context";
import type { ChronicleGraph } from "@/types/chronicle";

const graph: ChronicleGraph = {
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

describe("buildExpandRippleRequest", () => {
  it("sends a minimal path without ids, depth, or coordinates", () => {
    const built = buildExpandRippleRequest(graph, "chr:c:0", "en");
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
});
