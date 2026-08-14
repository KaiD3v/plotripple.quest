import { describe, expect, it } from "vitest";
import { safeParseNarrativeGraph } from "@/schemas/narrative-graph";
import {
  generationResultToNarrativeGraph,
  stableGraphId,
} from "@/lib/canvas/generation-to-graph";
import type { GenerationResult } from "@/types/generator";

const result: GenerationResult = {
  summary: "Mercy leaves a trail of obligations.",
  consequences: [
    {
      title: "A whispered debt",
      description: "The scout’s kin begin asking quiet favors.",
      timeframe: "immediate",
      category: "social",
      trigger: "The scout reports who showed mercy.",
      affectedParties: ["the scout’s kin"],
    },
    {
      title: "Standing orders change",
      description: "The watch is told not to take prisoners.",
      timeframe: "next_session",
      category: "political",
      trigger: "The report reaches the captain.",
      affectedParties: ["the garrison"],
    },
    {
      title: "A rumor becomes a banner",
      description: "Pilgrims start using the party’s name.",
      timeframe: "long_term",
      category: "supernatural",
      trigger: "A chaplain writes the story down.",
      affectedParties: ["border pilgrims"],
    },
  ],
};

const decision =
  "The party spared the captured scout and sent them home with a warning.";

describe("generationResultToNarrativeGraph", () => {
  it("creates a valid decision plus pending consequences without mutating the source", () => {
    const snapshot = structuredClone(result);
    const graph = generationResultToNarrativeGraph({
      result,
      locale: "pt-br",
      decision,
      graphId: "stable-demo",
      createdAt: "2026-02-01T00:00:00.000Z",
      title: "Scout mercy",
    });

    expect(safeParseNarrativeGraph(graph).success).toBe(true);
    expect(graph.locale).toBe("pt-br");
    expect(graph.version).toBe(1);
    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toHaveLength(3);
    expect(graph.nodes.filter((node) => node.kind === "decision")).toHaveLength(1);
    expect(
      graph.nodes.filter((node) => node.kind === "consequence"),
    ).toHaveLength(3);
    expect(
      graph.nodes
        .filter((node) => node.kind === "consequence")
        .every((node) => node.status === "pending"),
    ).toBe(true);
    expect(graph.rootNodeId).toBe("stable-demo:origin");
    expect(graph.edges.every((edge) => edge.source === graph.rootNodeId)).toBe(
      true,
    );

    const firstConsequence = graph.nodes.find(
      (node) => node.kind === "consequence",
    );
    if (firstConsequence?.kind === "consequence") {
      firstConsequence.affectedParties.push("mutated");
    }
    expect(result).toEqual(snapshot);
  });

  it("keeps ids stable for the same conversion inputs", () => {
    const first = generationResultToNarrativeGraph({
      result,
      locale: "en",
      decision,
    });
    const second = generationResultToNarrativeGraph({
      result,
      locale: "en",
      decision,
    });

    expect(first.id).toBe(second.id);
    expect(first.id).toBe(stableGraphId("en", decision, result.summary));
    expect(first.nodes.map((node) => node.id)).toEqual(
      second.nodes.map((node) => node.id),
    );
    expect(first.edges.map((edge) => edge.id)).toEqual(
      second.edges.map((edge) => edge.id),
    );
  });
});
