import { describe, expect, it } from "vitest";
import { appendFollowUpsToChronicleGraph } from "@/lib/chronicle/append-follow-ups";
import { canExpandChronicleNode } from "@/lib/chronicle/can-expand";
import type { ChronicleGraph, ChronicleNode } from "@/types/chronicle";
import type { GeneratedFollowUpParsed } from "@/schemas/follow-up";

const followUps: [GeneratedFollowUpParsed, GeneratedFollowUpParsed] = [
  {
    title: "A quiet ledger opens",
    description: "Kin start recording favors owed after the mercy.",
    timeframe: "next_session",
    category: "economic",
    trigger: "Anyone asks who spared the scout.",
    affectedParties: ["the scout’s kin"],
  },
  {
    title: "A rival offers shelter",
    description: "A border house invites the party as witnesses, not guests.",
    timeframe: "long_term",
    category: "political",
    trigger: "The story reaches the next market town.",
    affectedParties: ["a border house"],
  },
];

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

function consequence(id = "chr:c:0"): ChronicleNode {
  return {
    id,
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
  };
}

function graph(nodes: ChronicleNode[]): ChronicleGraph {
  return { version: 1, title: "Scout mercy", nodes };
}

describe("appendFollowUpsToChronicleGraph", () => {
  it("expands a consequence with two follow-ups without mutating the original", () => {
    const source = graph([origin(), consequence()]);
    const snapshot = structuredClone(source);
    const result = appendFollowUpsToChronicleGraph({
      graph: source,
      parentNodeId: "chr:c:0",
      generatedFollowUps: followUps,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(source).toEqual(snapshot);
    expect(result.graph.nodes).toHaveLength(4);
    const added = result.graph.nodes.filter((node) => node.type === "follow_up");
    expect(added).toHaveLength(2);
    expect(added.every((node) => node.parentId === "chr:c:0")).toBe(true);
    expect(added.every((node) => node.depth === 2)).toBe(true);
    expect(new Set(result.graph.nodes.map((node) => node.id)).size).toBe(4);
    expect(added[0]?.title).toBe("A quiet ledger opens");
    expect(added[0]?.status).toBe("pending");
  });

  it("expands a follow_up one level deeper", () => {
    const firstWave: ChronicleNode[] = [
      origin(),
      consequence(),
      {
        id: "chr:c:0:fu:0",
        type: "follow_up",
        title: "Kin keep a tally",
        description: "A slate appears in the scout’s house.",
        parentId: "chr:c:0",
        depth: 2,
        status: "pending",
      },
    ];
    const result = appendFollowUpsToChronicleGraph({
      graph: graph(firstWave),
      parentNodeId: "chr:c:0:fu:0",
      generatedFollowUps: followUps,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const added = result.graph.nodes.filter((node) => node.depth === 3);
    expect(added).toHaveLength(2);
    expect(added.every((node) => node.parentId === "chr:c:0:fu:0")).toBe(true);
    expect(added.every((node) => node.type === "follow_up")).toBe(true);
  });

  it("rejects a missing parent", () => {
    expect(
      appendFollowUpsToChronicleGraph({
        graph: graph([origin(), consequence()]),
        parentNodeId: "missing",
        generatedFollowUps: followUps,
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_NODE_MISSING" });
  });

  it("rejects expanding origin or decision nodes", () => {
    expect(
      appendFollowUpsToChronicleGraph({
        graph: graph([origin(), consequence()]),
        parentNodeId: "chr:origin",
        generatedFollowUps: followUps,
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_CANNOT_EXPAND" });

    const withDecision: ChronicleGraph = graph([
      origin(),
      {
        id: "chr:d2",
        type: "decision",
        title: "A later choice",
        description: "The party splits.",
        parentId: "chr:origin",
        depth: 1,
      },
      consequence(),
    ]);
    expect(
      appendFollowUpsToChronicleGraph({
        graph: withDecision,
        parentNodeId: "chr:d2",
        generatedFollowUps: followUps,
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_CANNOT_EXPAND" });
  });

  it("rejects a node that was already expanded", () => {
    const expanded = graph([
      origin(),
      consequence(),
      {
        id: "chr:c:0:fu:0",
        type: "follow_up",
        title: "Already explored",
        description: "A child exists.",
        parentId: "chr:c:0",
        depth: 2,
        status: "pending",
      },
    ]);
    expect(canExpandChronicleNode(expanded, "chr:c:0")).toEqual({
      ok: false,
      code: "CHRONICLE_ALREADY_EXPANDED",
    });
    expect(
      appendFollowUpsToChronicleGraph({
        graph: expanded,
        parentNodeId: "chr:c:0",
        generatedFollowUps: followUps,
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_ALREADY_EXPANDED" });
  });

  it("rejects expansion past maximum depth", () => {
    const deep: ChronicleNode[] = [
      origin(),
      consequence(),
      {
        id: "chr:f2",
        type: "follow_up",
        title: "Depth two",
        description: "Second ripple.",
        parentId: "chr:c:0",
        depth: 2,
        status: "pending",
      },
      {
        id: "chr:f3",
        type: "follow_up",
        title: "Depth three",
        description: "Third ripple.",
        parentId: "chr:f2",
        depth: 3,
        status: "pending",
      },
    ];
    expect(
      appendFollowUpsToChronicleGraph({
        graph: graph(deep),
        parentNodeId: "chr:f3",
        generatedFollowUps: followUps,
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_MAX_DEPTH" });
  });

  it("rejects expansion that would pass 25 nodes", () => {
    const nodes: ChronicleNode[] = [origin()];
    for (let index = 0; index < 23; index += 1) {
      nodes.push({
        id: `chr:c:${index}`,
        type: "consequence",
        title: `Ripple ${index}`,
        description: `Consequence ${index}`,
        parentId: "chr:origin",
        depth: 1,
        status: "pending",
      });
    }
    expect(nodes).toHaveLength(24);
    expect(
      appendFollowUpsToChronicleGraph({
        graph: graph(nodes),
        parentNodeId: "chr:c:0",
        generatedFollowUps: followUps,
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_NODE_LIMIT" });
  });

  it("rejects duplicate generated titles", () => {
    expect(
      appendFollowUpsToChronicleGraph({
        graph: graph([origin(), consequence()]),
        parentNodeId: "chr:c:0",
        generatedFollowUps: [followUps[0], { ...followUps[0], description: "Copy." }],
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_DUPLICATE" });
  });

  it("rejects HTML in generated copy", () => {
    expect(
      appendFollowUpsToChronicleGraph({
        graph: graph([origin(), consequence()]),
        parentNodeId: "chr:c:0",
        generatedFollowUps: [
          followUps[0],
          { ...followUps[1], description: "A <b>banner</b> rises." },
        ],
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_INVALID" });
  });
});
