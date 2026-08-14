import { describe, expect, it } from "vitest";
import {
  getClientHydrationSnapshot,
  getServerHydrationSnapshot,
  resolveChroniclePageState,
} from "@/lib/chronicle/page-state";
import type { ChronicleGraph } from "@/types/chronicle";

const graph: ChronicleGraph = {
  version: 1,
  title: "Scout mercy",
  nodes: [
    {
      id: "origin",
      type: "origin",
      title: "The party spared the scout.",
      description: "Mercy leaves a trail.",
      parentId: null,
      depth: 0,
    },
  ],
};

describe("resolveChroniclePageState", () => {
  it("stays in loading until the client hydrates", () => {
    expect(getServerHydrationSnapshot()).toBe(false);
    expect(getClientHydrationSnapshot()).toBe(true);
    expect(resolveChroniclePageState(false, null)).toBe("loading");
    expect(resolveChroniclePageState(false, graph)).toBe("loading");
  });

  it("shows empty or ready after hydration", () => {
    expect(resolveChroniclePageState(true, null)).toBe("empty");
    expect(resolveChroniclePageState(true, graph)).toBe("ready");
  });
});
