import { describe, expect, it } from "vitest";
import { safeParseChronicleGraph } from "@/schemas/chronicle";
import type { ChronicleGraph } from "@/types/chronicle";

const baseGraph: ChronicleGraph = {
  version: 1,
  title: "Mercy",
  nodes: [
    {
      id: "origin",
      type: "origin",
      title: "The party spared the scout.",
      description: "Mercy leaves a trail.",
      parentId: null,
      depth: 0,
    },
    {
      id: "c1",
      type: "consequence",
      title: "A whispered debt",
      description: "Kin ask quiet favors.",
      parentId: "origin",
      depth: 1,
      timeframe: "immediate",
      category: "social",
      trigger: "The scout reports mercy.",
      affectedParties: ["the scout’s kin"],
      status: "pending",
    },
  ],
};

describe("chronicleGraphSchema", () => {
  it("accepts a valid versioned chronicle", () => {
    expect(safeParseChronicleGraph(baseGraph).success).toBe(true);
    expect(safeParseChronicleGraph({ ...baseGraph, id: "chr-mercy" }).success).toBe(
      true,
    );
  });

  it("rejects duplicate node ids", () => {
    expect(
      safeParseChronicleGraph({
        ...baseGraph,
        nodes: [...baseGraph.nodes, { ...baseGraph.nodes[0], title: "copy" }],
      }).success,
    ).toBe(false);
  });

  it("rejects a missing parent and a wrong depth", () => {
    expect(
      safeParseChronicleGraph({
        ...baseGraph,
        nodes: [
          baseGraph.nodes[0],
          { ...baseGraph.nodes[1], parentId: "ghost" },
        ],
      }).success,
    ).toBe(false);
    expect(
      safeParseChronicleGraph({
        ...baseGraph,
        nodes: [baseGraph.nodes[0], { ...baseGraph.nodes[1], depth: 4 }],
      }).success,
    ).toBe(false);
  });

  it("rejects a chronicle without a root", () => {
    expect(
      safeParseChronicleGraph({
        ...baseGraph,
        nodes: [{ ...baseGraph.nodes[1], parentId: "c1", depth: 1 }],
      }).success,
    ).toBe(false);
  });
});
