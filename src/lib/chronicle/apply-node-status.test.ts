import { describe, expect, it, vi } from "vitest";
import { applyChronicleNodeStatus } from "@/lib/chronicle/apply-node-status";
import type { ChronicleGraph } from "@/types/chronicle";

const graph: ChronicleGraph = {
  version: 1,
  id: "chr",
  title: "Scout mercy",
  nodes: [
    {
      id: "chr:origin",
      type: "origin",
      title: "Origin",
      description: "",
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

describe("applyChronicleNodeStatus", () => {
  it("persists the session graph and updates the library once", () => {
    const persist = vi.fn((graph: ChronicleGraph) => {
      void graph;
      return true;
    });
    const saveLibrary = vi.fn(() => ({
      ok: true as const,
      created: false,
      chronicle: {
        version: 1 as const,
        id: "chr",
        title: graph.title,
        graph,
        createdAt: "2026-08-13T12:00:00.000Z",
        updatedAt: "2026-08-13T13:00:00.000Z",
      },
    }));

    const result = applyChronicleNodeStatus({
      graph,
      nodeId: "chr:c:0",
      status: "active",
      persist,
      saveLibrary,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.changed).toBe(true);
    expect(result.librarySaved).toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(saveLibrary).toHaveBeenCalledTimes(1);
    expect(persist.mock.calls[0]?.[0].nodes[1]?.status).toBe("active");
  });

  it("keeps the session update when the library save fails", () => {
    const persist = vi.fn(() => true);
    const saveLibrary = vi.fn(() => ({
      ok: false as const,
      code: "CHRONICLE_LIBRARY_UNAVAILABLE" as const,
    }));

    const result = applyChronicleNodeStatus({
      graph,
      nodeId: "chr:c:0",
      status: "resolved",
      persist,
      saveLibrary,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.librarySaved).toBe(false);
    expect(result.libraryCode).toBe("CHRONICLE_LIBRARY_UNAVAILABLE");
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("skips persistence when the status is unchanged", () => {
    const persist = vi.fn(() => true);
    const saveLibrary = vi.fn();
    const result = applyChronicleNodeStatus({
      graph,
      nodeId: "chr:c:0",
      status: "pending",
      persist,
      saveLibrary,
    });
    expect(result).toEqual({
      ok: true,
      graph,
      changed: false,
      librarySaved: true,
    });
    expect(persist).not.toHaveBeenCalled();
    expect(saveLibrary).not.toHaveBeenCalled();
  });
});
