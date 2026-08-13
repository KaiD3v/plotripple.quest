import { describe, expect, it } from "vitest";
import {
  createHistoryEntry,
  getServerHistorySnapshot,
  parseHistory,
  prependHistoryEntry,
  readHistory,
  serializeHistory,
  writeHistory,
  type HistoryStorage,
} from "@/lib/local-history";

const input = {
  eventDescription: "The party opened the sealed well against local advice.",
  tone: "dark" as const,
  intensity: "severe" as const,
  setting: "horror" as const,
  timeframe: "immediate" as const,
  count: 3 as const,
  locale: "en" as const,
};

const result = {
  summary: "The well remembers who unsealed it.",
  consequences: [
    {
      title: "Night water",
      description: "The town cistern tastes of iron by dawn.",
      timeframe: "immediate" as const,
      category: "environmental" as const,
      trigger: "Anyone drinks from the well after dusk.",
      affectedParties: ["the town", "the party"],
    },
    {
      title: "A silent watcher",
      description: "Something below starts matching the party's route.",
      timeframe: "next_session" as const,
      category: "supernatural" as const,
      trigger: "The party camps within a day's walk of the well.",
      affectedParties: ["the party"],
    },
    {
      title: "Closed gates",
      description: "Neighboring hamlets refuse trade until the well is sealed.",
      timeframe: "long_term" as const,
      category: "economic" as const,
      trigger: "Merchants hear that the seal was broken.",
      affectedParties: ["local traders", "the council"],
    },
  ],
};

function memoryStorage(initial?: string): HistoryStorage {
  const map = new Map<string, string>();
  if (initial) {
    map.set("plotripple.history.v1", initial);
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

describe("local history", () => {
  it("serializes and reads valid entries", () => {
    const entry = createHistoryEntry(input, result, new Date("2026-08-13T12:00:00.000Z"));
    const raw = serializeHistory([entry]);
    const parsed = parseHistory(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.input.eventDescription).toBe(input.eventDescription);
    expect(parsed[0]?.result.summary).toBe(result.summary);
    expect(parsed[0]?.v).toBe(1);
  });

  it("returns an empty list for invalid JSON", () => {
    expect(parseHistory("{not json")).toEqual([]);
    expect(parseHistory(null)).toEqual([]);
  });

  it("keeps only the latest five entries", () => {
    const first = createHistoryEntry(input, result);
    let entries = [first];
    for (let index = 0; index < 6; index += 1) {
      entries = prependHistoryEntry(
        entries,
        createHistoryEntry(input, result),
      );
    }
    expect(entries).toHaveLength(5);
  });

  it("writes through a storage adapter", () => {
    const storage = memoryStorage();
    const entry = createHistoryEntry(input, result);
    writeHistory(storage, [entry]);
    expect(readHistory(storage)).toHaveLength(1);
  });

  it("returns a cached server snapshot for useSyncExternalStore", () => {
    expect(getServerHistorySnapshot()).toBe(getServerHistorySnapshot());
  });
});
