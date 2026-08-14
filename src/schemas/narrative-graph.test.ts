import { describe, expect, it } from "vitest";
import { safeParseNarrativeGraph } from "@/schemas/narrative-graph";
import type { NarrativeGraph } from "@/types/narrative-graph";

const baseGraph: NarrativeGraph = {
  id: "g1",
  version: 1,
  locale: "en",
  title: "Mercy",
  createdAt: "2026-03-12T14:00:00.000Z",
  updatedAt: "2026-03-12T14:00:00.000Z",
  rootNodeId: "d1",
  nodes: [
    {
      id: "d1",
      kind: "decision",
      label: "The party spared the scout.",
      summary: "Mercy leaves a trail.",
    },
    {
      id: "c1",
      kind: "consequence",
      title: "A whispered debt",
      description: "Kin ask quiet favors.",
      timeframe: "immediate",
      category: "social",
      trigger: "The scout reports mercy.",
      affectedParties: ["the scout’s kin"],
      status: "pending",
    },
  ],
  edges: [{ id: "e1", source: "d1", target: "c1" }],
};

describe("narrativeGraphSchema", () => {
  it("accepts a valid versioned graph", () => {
    const result = safeParseNarrativeGraph(baseGraph);
    expect(result.success).toBe(true);
  });

  it("rejects a missing root node", () => {
    const result = safeParseNarrativeGraph({
      ...baseGraph,
      rootNodeId: "missing",
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate node ids", () => {
    const result = safeParseNarrativeGraph({
      ...baseGraph,
      nodes: [...baseGraph.nodes, { ...baseGraph.nodes[0], summary: "copy" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an edge whose target does not exist", () => {
    const result = safeParseNarrativeGraph({
      ...baseGraph,
      edges: [{ id: "e-bad", source: "d1", target: "ghost" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a self-referential edge", () => {
    const result = safeParseNarrativeGraph({
      ...baseGraph,
      edges: [{ id: "e-loop", source: "d1", target: "d1" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a root that is not a decision", () => {
    const result = safeParseNarrativeGraph({
      ...baseGraph,
      rootNodeId: "c1",
    });
    expect(result.success).toBe(false);
  });
});
