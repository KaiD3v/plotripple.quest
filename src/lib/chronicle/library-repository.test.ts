import { afterEach, describe, expect, it } from "vitest";
import { CHRONICLE_LIBRARY_MAX_ITEMS } from "@/lib/chronicle/limits";
import {
  CHRONICLE_LIBRARY_STORAGE_KEY,
  PLOTRIPPLE_LOCAL_STORAGE_KEYS,
  clearChronicleLibrary,
  clearPlotRippleLocalStorage,
  deleteStoredChronicle,
  getCachedChronicleLibrarySnapshot,
  getServerChronicleLibrarySnapshot,
  listStoredChronicles,
  parseChronicleLibrary,
  resetChronicleLibraryCache,
  saveStoredChronicle,
  serializeChronicleLibrary,
} from "@/lib/chronicle/library-repository";
import { HISTORY_STORAGE_KEY, type HistoryStorage } from "@/lib/local-history";
import type { ChronicleGraph, ChronicleNode } from "@/types/chronicle";

function origin(id = "chr-mercy"): ChronicleNode {
  return {
    id: `${id}:origin`,
    type: "origin",
    title: "The party spared the scout.",
    description: "Mercy leaves a trail.",
    parentId: null,
    depth: 0,
  };
}

function consequence(graphId = "chr-mercy", index = 0): ChronicleNode {
  return {
    id: `${graphId}:c:${index}`,
    type: "consequence",
    title: `Ripple ${index}`,
    description: `Consequence ${index}`,
    parentId: `${graphId}:origin`,
    depth: 1,
    status: "pending",
  };
}

function graph(id: string, extra: ChronicleNode[] = []): ChronicleGraph {
  return {
    version: 1,
    id,
    title: `Chronicle ${id}`,
    nodes: [origin(id), consequence(id), ...extra],
  };
}

function memoryStorage(initial?: Record<string, string>): HistoryStorage {
  const map = new Map<string, string>(Object.entries(initial ?? {}));
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

afterEach(() => {
  resetChronicleLibraryCache();
});

describe("chronicle library repository", () => {
  it("saves a new chronicle", () => {
    const storage = memoryStorage();
    const saved = saveStoredChronicle(graph("chr-a"), {
      storage,
      now: new Date("2026-08-13T12:00:00.000Z"),
    });

    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    expect(saved.created).toBe(true);
    expect(saved.chronicle.id).toBe("chr-a");
    expect(saved.chronicle.createdAt).toBe("2026-08-13T12:00:00.000Z");
    expect(saved.chronicle.updatedAt).toBe("2026-08-13T12:00:00.000Z");
    expect(listStoredChronicles(storage)).toHaveLength(1);
  });

  it("updates the same graph.id without duplicating and preserves createdAt", () => {
    const storage = memoryStorage();
    saveStoredChronicle(graph("chr-a"), {
      storage,
      now: new Date("2026-08-13T12:00:00.000Z"),
    });
    const expanded = graph("chr-a", [
      {
        id: "chr-a:c:0:fu:0",
        type: "follow_up",
        title: "A quiet ledger",
        description: "Kin keep a tally.",
        parentId: "chr-a:c:0",
        depth: 2,
        status: "pending",
      },
    ]);
    const updated = saveStoredChronicle(expanded, {
      storage,
      now: new Date("2026-08-13T13:00:00.000Z"),
    });

    expect(updated.ok).toBe(true);
    if (!updated.ok) {
      return;
    }
    expect(updated.created).toBe(false);
    expect(updated.chronicle.createdAt).toBe("2026-08-13T12:00:00.000Z");
    expect(updated.chronicle.updatedAt).toBe("2026-08-13T13:00:00.000Z");
    expect(listStoredChronicles(storage)).toHaveLength(1);
    expect(listStoredChronicles(storage)[0]?.graph.nodes).toHaveLength(3);
  });

  it("orders chronicles by updatedAt descending", () => {
    const storage = memoryStorage();
    saveStoredChronicle(graph("chr-old"), {
      storage,
      now: new Date("2026-08-13T10:00:00.000Z"),
    });
    saveStoredChronicle(graph("chr-new"), {
      storage,
      now: new Date("2026-08-13T12:00:00.000Z"),
    });
    saveStoredChronicle(graph("chr-old"), {
      storage,
      now: new Date("2026-08-13T13:00:00.000Z"),
    });

    expect(listStoredChronicles(storage).map((item) => item.id)).toEqual([
      "chr-old",
      "chr-new",
    ]);
  });

  it("deletes only the selected chronicle", () => {
    const storage = memoryStorage();
    saveStoredChronicle(graph("chr-a"), { storage });
    saveStoredChronicle(graph("chr-b"), { storage });
    expect(deleteStoredChronicle("chr-a", storage)).toBe(true);
    expect(listStoredChronicles(storage).map((item) => item.id)).toEqual([
      "chr-b",
    ]);
  });

  it("clears only PlotRipple local keys", () => {
    const storage = memoryStorage({
      [CHRONICLE_LIBRARY_STORAGE_KEY]: serializeChronicleLibrary([
        {
          version: 1,
          id: "chr-a",
          title: "A",
          graph: graph("chr-a"),
          createdAt: "2026-08-13T12:00:00.000Z",
          updatedAt: "2026-08-13T12:00:00.000Z",
        },
      ]),
      [HISTORY_STORAGE_KEY]: JSON.stringify({ v: 1, entries: [] }),
      theme: "dark",
    });

    expect(clearPlotRippleLocalStorage(storage)).toBe(true);
    expect(storage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
    expect(storage.getItem("theme")).toBe("dark");
    expect(PLOTRIPPLE_LOCAL_STORAGE_KEYS).not.toContain("theme");
  });

  it("does not use localStorage.clear when clearing the library alone", () => {
    const storage = memoryStorage({
      [CHRONICLE_LIBRARY_STORAGE_KEY]: serializeChronicleLibrary([
        {
          version: 1,
          id: "chr-a",
          title: "A",
          graph: graph("chr-a"),
          createdAt: "2026-08-13T12:00:00.000Z",
          updatedAt: "2026-08-13T12:00:00.000Z",
        },
      ]),
      theme: "dark",
    });
    expect(clearChronicleLibrary(storage)).toBe(true);
    expect(storage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY)).toBeNull();
    expect(storage.getItem("theme")).toBe("dark");
  });

  it("rejects a twenty-first new chronicle without deleting older ones", () => {
    const storage = memoryStorage();
    for (let index = 0; index < CHRONICLE_LIBRARY_MAX_ITEMS; index += 1) {
      const saved = saveStoredChronicle(graph(`chr-${index}`), { storage });
      expect(saved.ok).toBe(true);
    }
    const overflow = saveStoredChronicle(graph("chr-overflow"), { storage });
    expect(overflow).toEqual({ ok: false, code: "CHRONICLE_LIBRARY_FULL" });
    expect(listStoredChronicles(storage)).toHaveLength(20);
  });

  it("still updates an existing chronicle when the library is full", () => {
    const storage = memoryStorage();
    for (let index = 0; index < CHRONICLE_LIBRARY_MAX_ITEMS; index += 1) {
      saveStoredChronicle(graph(`chr-${index}`), { storage });
    }
    const updated = saveStoredChronicle(
      graph("chr-0", [
        {
          id: "chr-0:c:0:fu:0",
          type: "follow_up",
          title: "Later ripple",
          description: "The branch grows.",
          parentId: "chr-0:c:0",
          depth: 2,
          status: "pending",
        },
      ]),
      { storage },
    );
    expect(updated.ok).toBe(true);
    expect(listStoredChronicles(storage)).toHaveLength(20);
  });

  it("returns unavailable when localStorage cannot be used", () => {
    expect(saveStoredChronicle(graph("chr-a"), { storage: null })).toEqual({
      ok: false,
      code: "CHRONICLE_LIBRARY_UNAVAILABLE",
    });
  });

  it("returns unavailable when quota is exceeded", () => {
    const storage: HistoryStorage = {
      getItem: () => null,
      setItem: () => {
        const error = new Error("quota");
        error.name = "QuotaExceededError";
        throw error;
      },
      removeItem: () => undefined,
    };
    expect(saveStoredChronicle(graph("chr-a"), { storage })).toEqual({
      ok: false,
      code: "CHRONICLE_LIBRARY_UNAVAILABLE",
    });
  });

  it("returns an empty library for corrupted JSON without throwing", () => {
    expect(parseChronicleLibrary("{not json")).toEqual({
      version: 1,
      chronicles: [],
    });
  });

  it("skips an invalid individual record without dropping valid ones", () => {
    const parsed = parseChronicleLibrary(
      JSON.stringify({
        version: 1,
        chronicles: [
          {
            version: 1,
            id: "chr-a",
            title: "Valid",
            graph: graph("chr-a"),
            createdAt: "2026-08-13T12:00:00.000Z",
            updatedAt: "2026-08-13T12:00:00.000Z",
          },
          { version: 1, id: "broken" },
        ],
      }),
    );
    expect(parsed.chronicles).toHaveLength(1);
    expect(parsed.chronicles[0]?.id).toBe("chr-a");
  });

  it("keeps useSyncExternalStore snapshots referentially stable", () => {
    const storage = memoryStorage();
    saveStoredChronicle(graph("chr-a"), { storage });
    const first = getCachedChronicleLibrarySnapshot(storage);
    const second = getCachedChronicleLibrarySnapshot(storage);
    expect(first).toBe(second);
    expect(getServerChronicleLibrarySnapshot()).toBe(
      getServerChronicleLibrarySnapshot(),
    );
  });
});
