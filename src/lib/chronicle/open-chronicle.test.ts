import { describe, expect, it } from "vitest";
import { openChronicleOnCanvas } from "@/lib/chronicle/open-chronicle";
import { saveStoredChronicle } from "@/lib/chronicle/library-repository";
import {
  CHRONICLE_STORAGE_KEY,
  readChronicleGraph,
} from "@/lib/chronicle/session-repository";
import type { ChronicleGraph } from "@/types/chronicle";
import type { HistoryStorage } from "@/lib/local-history";

const graph: ChronicleGraph = {
  version: 1,
  id: "chr-mercy",
  title: "Scout mercy",
  nodes: [
    {
      id: "chr-mercy:origin",
      type: "origin",
      title: "The party spared the scout.",
      description: "Mercy leaves a trail.",
      parentId: null,
      depth: 0,
    },
    {
      id: "chr-mercy:c:0",
      type: "consequence",
      title: "A whispered debt",
      description: "Kin ask quiet favors.",
      parentId: "chr-mercy:origin",
      depth: 1,
      status: "pending",
    },
  ],
  context: { locale: "en" },
};

function memoryStorage(): HistoryStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

describe("openChronicleOnCanvas", () => {
  it("loads a stored chronicle into the active session without calling Gemini", () => {
    const library = memoryStorage();
    const session = memoryStorage();
    saveStoredChronicle(graph, {
      storage: library,
      now: new Date("2026-08-13T12:00:00.000Z"),
    });

    const opened = openChronicleOnCanvas({
      id: "chr-mercy",
      locale: "pt-br",
      libraryStorage: library,
      historyStorage: library,
      sessionStorage: session,
    });

    expect(opened.ok).toBe(true);
    if (!opened.ok) {
      return;
    }
    expect(opened.href).toBe("/pt-br/canvas");
    expect(readChronicleGraph(session)?.nodes).toHaveLength(2);
    expect(session.getItem(CHRONICLE_STORAGE_KEY)).toContain("A whispered debt");
  });

  it("returns not found for an unknown id", () => {
    expect(
      openChronicleOnCanvas({
        id: "missing",
        locale: "en",
        libraryStorage: memoryStorage(),
        historyStorage: memoryStorage(),
        sessionStorage: memoryStorage(),
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_NOT_FOUND" });
  });
});
