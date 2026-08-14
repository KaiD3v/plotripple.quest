import { describe, expect, it, vi } from "vitest";
import { exploreRippleOnChronicle } from "@/lib/chronicle/explore-ripple";
import type { ChronicleGraph } from "@/types/chronicle";

const graph: ChronicleGraph = {
  version: 1,
  title: "Scout mercy",
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
      status: "pending",
    },
  ],
};

const followUps = {
  followUps: [
    {
      title: "A quiet ledger opens",
      description: "Kin start recording favors.",
    },
    {
      title: "A rival offers shelter",
      description: "A border house invites the party as witnesses.",
    },
  ],
};

describe("exploreRippleOnChronicle", () => {
  it("appends two follow-ups and persists once", async () => {
    const persist = vi.fn(() => true);
    const saveLibrary = vi.fn(() => ({
      ok: true as const,
      created: false,
      chronicle: {
        version: 1 as const,
        id: "chr",
        title: graph.title,
        graph,
        createdAt: "2026-08-13T12:00:00.000Z",
        updatedAt: "2026-08-13T12:00:00.000Z",
      },
    }));
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => followUps,
    })) as unknown as typeof fetch;

    const result = await exploreRippleOnChronicle({
      graph,
      parentNodeId: "chr:c:0",
      locale: "en",
      fetchImpl,
      persist,
      saveLibrary,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.graph.nodes).toHaveLength(4);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(saveLibrary).toHaveBeenCalledTimes(1);
    expect(graph.nodes).toHaveLength(2);
  });

  it("keeps the original graph when Gemini fails", async () => {
    const persist = vi.fn(() => true);
    const saveLibrary = vi.fn();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: { code: "AI_UNAVAILABLE", message: "down" },
      }),
    })) as unknown as typeof fetch;

    const result = await exploreRippleOnChronicle({
      graph,
      parentNodeId: "chr:c:0",
      locale: "en",
      fetchImpl,
      persist,
      saveLibrary,
    });

    expect(result).toEqual({ ok: false, code: "AI_UNAVAILABLE" });
    expect(persist).not.toHaveBeenCalled();
    expect(saveLibrary).not.toHaveBeenCalled();
    expect(graph.nodes).toHaveLength(2);
  });

  it("does not call Gemini when the node cannot be expanded", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const result = await exploreRippleOnChronicle({
      graph,
      parentNodeId: "chr:origin",
      locale: "en",
      fetchImpl,
      persist: vi.fn(() => true),
    });
    expect(result).toEqual({ ok: false, code: "CHRONICLE_CANNOT_EXPAND" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
