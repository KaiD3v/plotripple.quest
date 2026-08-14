import { describe, expect, it } from "vitest";
import { fixtureIds, getFixture } from "@/lib/canvas/fixtures";
import { resolveFixture } from "@/lib/canvas/resolve-fixture";
import { narrativeGraphToChronicleGraph } from "@/lib/chronicle/narrative-bridge";
import { safeParseChronicleGraph } from "@/schemas/chronicle";
import { safeParseNarrativeGraph } from "@/schemas/narrative-graph";

describe("canvas fixtures", () => {
  it("builds a three-consequence chronicle", () => {
    const graph = getFixture("3", "en");
    expect(safeParseNarrativeGraph(graph).success).toBe(true);
    expect(graph.nodes).toHaveLength(4);
    expect(graph.nodes.filter((node) => node.kind === "consequence")).toHaveLength(
      3,
    );
  });

  it("builds a five-consequence chronicle", () => {
    const graph = getFixture("5", "pt-br");
    expect(safeParseNarrativeGraph(graph).success).toBe(true);
    expect(graph.nodes).toHaveLength(6);
    expect(graph.locale).toBe("pt-br");
  });

  it("builds a branched chronicle with about ten nodes", () => {
    const graph = getFixture("10", "en");
    expect(safeParseNarrativeGraph(graph).success).toBe(true);
    expect(graph.nodes).toHaveLength(10);
    expect(graph.nodes.some((node) => node.kind === "follow_up")).toBe(true);
    expect(graph.edges.length).toBeGreaterThan(5);
  });

  it("builds a twenty-five-node chronicle", () => {
    const graph = getFixture("25", "en");
    expect(safeParseNarrativeGraph(graph).success).toBe(true);
    expect(graph.nodes).toHaveLength(25);
  });

  it("keeps the long Portuguese fixture in Portuguese", () => {
    const graph = getFixture("long-pt", "en");
    expect(safeParseNarrativeGraph(graph).success).toBe(true);
    expect(graph.locale).toBe("pt-br");
    expect(graph.nodes[0]?.kind === "decision" && graph.nodes[0].label.length).toBeGreaterThan(
      200,
    );
  });

  it("runs every fixture through the chronicle contract", () => {
    for (const id of fixtureIds) {
      const graph = getFixture(id === "long-pt" ? "long-pt" : id, "en");
      const chronicle = narrativeGraphToChronicleGraph(graph);
      expect(safeParseChronicleGraph(chronicle).success).toBe(true);
      expect(chronicle.nodes).toHaveLength(graph.nodes.length);
      expect(chronicle.nodes.some((node) => node.parentId === null)).toBe(true);
    }
  });

  it("resolves fixture query strings and unknown values", () => {
    expect(resolveFixture("en", "25").id).toBe("25");
    expect(resolveFixture("en", ["10"]).graph.nodes).toHaveLength(10);
    expect(resolveFixture("pt-br", "missing").unknown).toBe(true);
    expect(resolveFixture("pt-br", "missing").id).toBe("3");
    expect(resolveFixture("en", undefined).unknown).toBe(false);
  });
});
