import { afterEach, describe, expect, it } from "vitest";
import {
  CHRONICLE_STORAGE_KEY,
  clearChronicleGraph,
  discardCurrentChronicle,
  getCachedChronicleSnapshot,
  parseChronicleGraphFile,
  persistChronicle,
  readChronicleGraph,
  resetChronicleSnapshotCache,
  serializeChronicleGraph,
  subscribeChronicle,
  writeChronicleGraph,
} from "@/lib/chronicle/session-repository";
import type { HistoryStorage } from "@/lib/local-history";
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
    {
      id: "c1",
      type: "consequence",
      title: "A whispered debt",
      description: "Kin ask quiet favors.",
      parentId: "origin",
      depth: 1,
      status: "pending",
    },
  ],
};

const otherGraph: ChronicleGraph = {
  ...graph,
  title: "The named thief",
};

function memoryStorage(initial?: string): HistoryStorage {
  const map = new Map<string, string>();
  if (initial) {
    map.set(CHRONICLE_STORAGE_KEY, initial);
  }
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
  resetChronicleSnapshotCache();
});

describe("chronicle session repository", () => {
  it("writes a validated graph and reads it back", () => {
    const storage = memoryStorage();
    expect(writeChronicleGraph(storage, graph)).toBe(true);
    expect(readChronicleGraph(storage)).toEqual(graph);
    expect(parseChronicleGraphFile(serializeChronicleGraph(graph))).toEqual(graph);
  });

  it("returns null for invalid or missing session data", () => {
    expect(readChronicleGraph(null)).toBeNull();
    expect(readChronicleGraph(memoryStorage("not-json"))).toBeNull();
    expect(
      readChronicleGraph(
        memoryStorage(JSON.stringify({ v: 1, graph: { title: "broken" } })),
      ),
    ).toBeNull();
    expect(parseChronicleGraphFile(null)).toBeNull();
  });

  it("clears the stored chronicle", () => {
    const storage = memoryStorage();
    writeChronicleGraph(storage, graph);
    expect(clearChronicleGraph(storage)).toBe(true);
    expect(readChronicleGraph(storage)).toBeNull();
  });

  it("does not write an invalid graph", () => {
    const storage = memoryStorage();
    expect(
      writeChronicleGraph(storage, {
        ...graph,
        nodes: [],
      } as ChronicleGraph),
    ).toBe(false);
    expect(storage.getItem(CHRONICLE_STORAGE_KEY)).toBeNull();
  });

  it("returns a stable snapshot when getSnapshot is called twice without changes", () => {
    const storage = memoryStorage();
    persistChronicle(graph, storage);

    const first = getCachedChronicleSnapshot(storage);
    const second = getCachedChronicleSnapshot(storage);
    const third = getCachedChronicleSnapshot(storage);

    expect(first).toEqual(graph);
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it("notifies subscribers exactly once when the chronicle changes or is cleared", () => {
    const storage = memoryStorage();
    let notifications = 0;
    const unsubscribe = subscribeChronicle(() => {
      notifications += 1;
      getCachedChronicleSnapshot(storage);
    });

    expect(persistChronicle(graph, storage)).toBe(true);
    expect(notifications).toBe(1);
    expect(getCachedChronicleSnapshot(storage)?.title).toBe("Scout mercy");

    expect(persistChronicle(graph, storage)).toBe(true);
    expect(notifications).toBe(1);

    expect(persistChronicle(otherGraph, storage)).toBe(true);
    expect(notifications).toBe(2);
    expect(getCachedChronicleSnapshot(storage)?.title).toBe("The named thief");

    expect(discardCurrentChronicle(storage)).toBe(true);
    expect(notifications).toBe(3);
    expect(getCachedChronicleSnapshot(storage)).toBeNull();

    expect(discardCurrentChronicle(storage)).toBe(true);
    expect(notifications).toBe(3);

    unsubscribe();
  });
});
