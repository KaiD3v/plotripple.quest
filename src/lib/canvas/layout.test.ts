import { describe, expect, it } from "vitest";
import { getFixture } from "@/lib/canvas/fixtures";
import { relatedPathIds } from "@/lib/canvas/graph-queries";
import {
  MAX_SUBCOLUMN_NODES,
  layoutNarrativeGraph,
} from "@/lib/canvas/layout";
import { rectsOverlap } from "@/lib/canvas/viewport";

describe("layoutNarrativeGraph", () => {
  it("places the decision to the left of later causal levels", () => {
    const graph = getFixture("10", "en");
    const layout = layoutNarrativeGraph(graph);
    const root = layout.nodes.find((node) => node.id === graph.rootNodeId);
    const deeper = layout.nodes.filter((node) => node.depth > 0);

    expect(root).toBeDefined();
    expect(root?.depth).toBe(0);
    expect(deeper.length).toBeGreaterThan(0);
    expect(deeper.every((node) => (root?.x ?? 0) < node.x)).toBe(true);
    expect(layout.edges.length).toBe(graph.edges.length);
  });

  it("keeps a related path from a deep node back to the decision", () => {
    const graph = getFixture("10", "en");
    const followUp = graph.nodes.find((node) => node.kind === "follow_up");
    expect(followUp).toBeDefined();
    const related = relatedPathIds(graph, followUp!.id);
    expect(related.nodes.has(graph.rootNodeId)).toBe(true);
    expect(related.edges.size).toBeGreaterThan(0);
  });

  it("does not overlap nodes across fixtures", () => {
    for (const id of ["3", "5", "10", "25", "long-pt"] as const) {
      const layout = layoutNarrativeGraph(getFixture(id, "en"));
      for (let i = 0; i < layout.nodes.length; i += 1) {
        for (let j = i + 1; j < layout.nodes.length; j += 1) {
          expect(rectsOverlap(layout.nodes[i]!, layout.nodes[j]!, 1)).toBe(
            false,
          );
        }
      }
    }
  });

  it("wraps tall causal levels instead of stacking every node in one column", () => {
    const layout = layoutNarrativeGraph(getFixture("25", "en"));
    const byDepth = new Map<number, typeof layout.nodes>();
    for (const node of layout.nodes) {
      const bucket = byDepth.get(node.depth) ?? [];
      bucket.push(node);
      byDepth.set(node.depth, bucket);
    }

    const crowded = [...byDepth.values()].find(
      (nodes) => nodes.length > MAX_SUBCOLUMN_NODES,
    );
    expect(crowded).toBeDefined();
    const xs = new Set(crowded!.map((node) => Math.round(node.x)));
    expect(xs.size).toBeGreaterThan(1);
    expect(layout.height).toBeLessThan(1600);
  });

  it("keeps shallow chronicles horizontal and compact", () => {
    const three = layoutNarrativeGraph(getFixture("3", "en"));
    const five = layoutNarrativeGraph(getFixture("5", "en"));
    expect(three.nodes.filter((node) => node.depth === 1)).toHaveLength(3);
    expect(five.nodes.filter((node) => node.depth === 1)).toHaveLength(5);
    expect(three.width).toBeGreaterThan(three.height * 0.6);
  });
});
