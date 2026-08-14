import { describe, expect, it } from "vitest";
import {
  hydrateLegacyHistoryIntoLibrary,
  migrateHistoryEntryToStoredChronicle,
} from "@/lib/chronicle/migrate-history-entry";
import { listStoredChronicles } from "@/lib/chronicle/library-repository";
import {
  HISTORY_STORAGE_KEY,
  createHistoryEntry,
  serializeHistory,
  type HistoryStorage,
} from "@/lib/local-history";
import type { HistoryEntryParsed } from "@/schemas/generator";

const validInput = {
  eventDescription: "The party spared the captured scout and sent them home.",
  tone: "mysterious" as const,
  intensity: "moderate" as const,
  setting: "fantasy" as const,
  timeframe: "mixed" as const,
  count: 3 as const,
  locale: "en" as const,
};

const validResult = {
  summary: "Mercy leaves a trail of obligations.",
  consequences: [
    {
      title: "A whispered debt",
      description: "Kin ask quiet favors.",
      timeframe: "immediate" as const,
      category: "social" as const,
      trigger: "The scout talks.",
      affectedParties: ["the kin"],
    },
    {
      title: "Standing orders change",
      description: "The watch stops taking prisoners.",
      timeframe: "next_session" as const,
      category: "political" as const,
      trigger: "The captain reads the report.",
      affectedParties: ["the garrison"],
    },
    {
      title: "A rumor becomes a banner",
      description: "Pilgrims borrow the party’s name.",
      timeframe: "long_term" as const,
      category: "supernatural" as const,
      trigger: "A chaplain writes it down.",
      affectedParties: ["pilgrims"],
    },
  ],
};

const incompatibleEntry: HistoryEntryParsed = {
  v: 1,
  id: "legacy-empty",
  createdAt: "2026-08-10T12:00:00.000Z",
  input: validInput,
  result: {
    summary: "",
    consequences: [],
  },
};

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

describe("legacy history migration", () => {
  it("migrates a compatible generation into a ChronicleGraph", () => {
    const entry = createHistoryEntry(
      validInput,
      validResult,
      new Date("2026-08-11T12:00:00.000Z"),
    );
    const migrated = migrateHistoryEntryToStoredChronicle(entry);
    expect(migrated).toBeTruthy();
    expect(migrated?.graph.nodes.length).toBe(4);
    expect(migrated?.graph.context?.locale).toBe("en");
    expect(migrated?.createdAt).toBe(entry.createdAt);
    expect(migrated?.updatedAt).toBe(entry.createdAt);
  });

  it("returns null for an incompatible legacy item", () => {
    expect(migrateHistoryEntryToStoredChronicle(incompatibleEntry)).toBeNull();
  });

  it("hydrates compatible history into the library without duplicating", () => {
    const compatible = createHistoryEntry(
      validInput,
      validResult,
      new Date("2026-08-11T12:00:00.000Z"),
    );
    const duplicate = {
      ...compatible,
      id: "legacy-duplicate",
    };
    const storage = memoryStorage({
      [HISTORY_STORAGE_KEY]: serializeHistory([compatible, duplicate]),
    });

    const result = hydrateLegacyHistoryIntoLibrary(storage);
    expect(result.migrated).toBe(2);
    expect(result.remaining).toBe(0);
    expect(listStoredChronicles(storage)).toHaveLength(1);

    const again = hydrateLegacyHistoryIntoLibrary(storage);
    expect(again.migrated).toBe(0);
    expect(listStoredChronicles(storage)).toHaveLength(1);
  });
});
