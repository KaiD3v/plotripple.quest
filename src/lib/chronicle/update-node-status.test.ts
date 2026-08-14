import { describe, expect, it } from "vitest";
import { updateChronicleNodeStatus } from "@/lib/chronicle/update-node-status";
import type { ChronicleGraph, ChronicleNode } from "@/types/chronicle";

function origin(): ChronicleNode {
  return {
    id: "chr:origin",
    type: "origin",
    title: "The party spared the scout.",
    description: "Mercy leaves a trail.",
    parentId: null,
    depth: 0,
  };
}

function consequence(overrides?: Partial<ChronicleNode>): ChronicleNode {
  return {
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
    ...overrides,
  };
}

function graph(nodes: ChronicleNode[]): ChronicleGraph {
  return { version: 1, id: "chr", title: "Scout mercy", nodes };
}

describe("updateChronicleNodeStatus", () => {
  it("changes pending → active without mutating the original", () => {
    const source = graph([origin(), consequence()]);
    const snapshot = structuredClone(source);
    const result = updateChronicleNodeStatus({
      graph: source,
      nodeId: "chr:c:0",
      status: "active",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.changed).toBe(true);
    expect(source).toEqual(snapshot);
    expect(result.graph.nodes.find((node) => node.id === "chr:c:0")?.status).toBe(
      "active",
    );
    expect(result.graph.id).toBe("chr");
  });

  it("changes active → resolved and resolved → dismissed", () => {
    const active = updateChronicleNodeStatus({
      graph: graph([origin(), consequence({ status: "active" })]),
      nodeId: "chr:c:0",
      status: "resolved",
    });
    expect(active.ok && active.graph.nodes[1]?.status).toBe("resolved");

    const dismissed = updateChronicleNodeStatus({
      graph: graph([origin(), consequence({ status: "resolved" })]),
      nodeId: "chr:c:0",
      status: "dismissed",
    });
    expect(dismissed.ok && dismissed.graph.nodes[1]?.status).toBe("dismissed");
  });

  it("returns the same graph reference when the status is unchanged", () => {
    const source = graph([origin(), consequence({ status: "active" })]);
    const result = updateChronicleNodeStatus({
      graph: source,
      nodeId: "chr:c:0",
      status: "active",
    });
    expect(result).toEqual({ ok: true, graph: source, changed: false });
    expect(result.ok && result.graph).toBe(source);
  });

  it("treats a legacy node without status as pending", () => {
    const source = graph([
      origin(),
      consequence({ status: undefined }),
    ]);
    const noop = updateChronicleNodeStatus({
      graph: source,
      nodeId: "chr:c:0",
      status: "pending",
    });
    expect(noop).toEqual({ ok: true, graph: source, changed: false });

    const changed = updateChronicleNodeStatus({
      graph: source,
      nodeId: "chr:c:0",
      status: "active",
    });
    expect(changed.ok && changed.changed).toBe(true);
  });

  it("rejects a missing node", () => {
    expect(
      updateChronicleNodeStatus({
        graph: graph([origin(), consequence()]),
        nodeId: "missing",
        status: "active",
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_NODE_MISSING" });
  });

  it("rejects status edits on origin or decision", () => {
    expect(
      updateChronicleNodeStatus({
        graph: graph([origin(), consequence()]),
        nodeId: "chr:origin",
        status: "active",
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_STATUS_UNEDITABLE" });

    const withDecision = graph([
      origin(),
      {
        id: "chr:d",
        type: "decision",
        title: "A later choice",
        description: "The party splits.",
        parentId: "chr:origin",
        depth: 1,
      },
      consequence(),
    ]);
    expect(
      updateChronicleNodeStatus({
        graph: withDecision,
        nodeId: "chr:d",
        status: "resolved",
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_STATUS_UNEDITABLE" });
  });

  it("rejects an invalid status value", () => {
    expect(
      updateChronicleNodeStatus({
        graph: graph([origin(), consequence()]),
        nodeId: "chr:c:0",
        status: "occurred" as never,
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_INVALID" });
  });

  it("preserves parentId, depth, and extras", () => {
    const source = graph([
      origin(),
      consequence({
        timeframe: "next_session",
        category: "political",
        trigger: "A report arrives.",
        affectedParties: ["the captain"],
      }),
    ]);
    const result = updateChronicleNodeStatus({
      graph: source,
      nodeId: "chr:c:0",
      status: "resolved",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const node = result.graph.nodes.find((item) => item.id === "chr:c:0");
    expect(node).toMatchObject({
      parentId: "chr:origin",
      depth: 1,
      timeframe: "next_session",
      category: "political",
      trigger: "A report arrives.",
      affectedParties: ["the captain"],
      status: "resolved",
    });
  });

  it("updates a follow_up and validates the resulting graph", () => {
    const source = graph([
      origin(),
      consequence({ status: "active" }),
      {
        id: "chr:c:0:fu:0",
        type: "follow_up",
        title: "A quiet ledger",
        description: "Kin keep a tally.",
        parentId: "chr:c:0",
        depth: 2,
        status: "pending",
      },
    ]);
    const result = updateChronicleNodeStatus({
      graph: source,
      nodeId: "chr:c:0:fu:0",
      status: "dismissed",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.graph.nodes.find((node) => node.id === "chr:c:0:fu:0")?.status).toBe(
      "dismissed",
    );
  });
});
