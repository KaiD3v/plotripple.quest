import { describe, expect, it } from "vitest";
import { getFixture } from "@/lib/canvas/fixtures";
import {
  chronicleGraphToNarrativeGraph,
  narrativeGraphThroughChronicle,
  narrativeGraphToChronicleGraph,
} from "@/lib/chronicle/narrative-bridge";
import { safeParseChronicleGraph } from "@/schemas/chronicle";
import { safeParseNarrativeGraph } from "@/schemas/narrative-graph";

describe("chronicle narrative bridge", () => {
  it("round-trips fixtures through the chronicle contract", () => {
    const graph = getFixture("10", "en");
    const chronicle = narrativeGraphToChronicleGraph(graph);
    const parsed = safeParseChronicleGraph(chronicle);
    const back = chronicleGraphToNarrativeGraph(chronicle, graph.locale);

    expect(parsed.success).toBe(true);
    expect(chronicle.nodes).toHaveLength(graph.nodes.length);
    expect(chronicle.nodes.some((node) => node.type === "origin")).toBe(true);
    expect(back.nodes).toHaveLength(graph.nodes.length);
    expect(back.edges).toHaveLength(graph.edges.length);
    expect(safeParseNarrativeGraph(back).success).toBe(true);
    expect(back.nodes.map((node) => node.id)).toEqual(
      graph.nodes.map((node) => node.id),
    );
  });

  it("keeps fixture graphs valid after the shared pipeline", () => {
    const original = getFixture("25", "pt-br");
    const again = narrativeGraphThroughChronicle(original);
    expect(safeParseNarrativeGraph(again).success).toBe(true);
    expect(again.nodes).toHaveLength(25);
    expect(again.locale).toBe("pt-br");
    expect(again.id).toBe(original.id);
  });
});
