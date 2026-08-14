import { describe, expect, it } from "vitest";
import {
  normalizeChronicleNodeStatus,
  resolveChronicleNodeStatus,
} from "@/lib/chronicle/node-status";
import { safeParseChronicleGraph } from "@/schemas/chronicle";

describe("normalizeChronicleNodeStatus", () => {
  it("maps legacy occurred to resolved and unknown values to pending", () => {
    expect(normalizeChronicleNodeStatus("occurred")).toBe("resolved");
    expect(normalizeChronicleNodeStatus("active")).toBe("active");
    expect(normalizeChronicleNodeStatus("weird")).toBe("pending");
    expect(normalizeChronicleNodeStatus(undefined)).toBeUndefined();
    expect(resolveChronicleNodeStatus(undefined)).toBe("pending");
  });

  it("accepts legacy occurred inside a persisted chronicle", () => {
    const parsed = safeParseChronicleGraph({
      version: 1,
      id: "chr",
      title: "Mercy",
      nodes: [
        {
          id: "origin",
          type: "origin",
          title: "Origin",
          description: "",
          parentId: null,
          depth: 0,
        },
        {
          id: "c1",
          type: "consequence",
          title: "Debt",
          description: "Favors.",
          parentId: "origin",
          depth: 1,
          status: "occurred",
        },
      ],
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }
    expect(parsed.data.nodes[1]?.status).toBe("resolved");
  });
});
