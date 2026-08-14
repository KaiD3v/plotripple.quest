import { describe, expect, it } from "vitest";
import { resolveChronicleGraphId } from "@/lib/chronicle/resolve-graph-id";
import type { ChronicleGraph } from "@/types/chronicle";

const graph: ChronicleGraph = {
  version: 1,
  title: "Mercy",
  nodes: [
    {
      id: "chr-mercy:origin",
      type: "origin",
      title: "The party spared the scout.",
      description: "Mercy leaves a trail.",
      parentId: null,
      depth: 0,
    },
  ],
};

describe("resolveChronicleGraphId", () => {
  it("prefers the explicit graph id", () => {
    expect(resolveChronicleGraphId({ ...graph, id: "chr-explicit" })).toBe(
      "chr-explicit",
    );
  });

  it("derives an id from the origin prefix for older graphs", () => {
    expect(resolveChronicleGraphId(graph)).toBe("chr-mercy");
  });
});
