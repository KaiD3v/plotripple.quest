import { describe, expect, it } from "vitest";
import { buildRecentDeviceItems } from "@/lib/chronicle/recent-device";
import { migrateHistoryEntryToStoredChronicle } from "@/lib/chronicle/migrate-history-entry";
import { createHistoryEntry } from "@/lib/local-history";
import type { StoredChronicle } from "@/schemas/chronicle-library";
import type { HistoryEntryParsed } from "@/schemas/generator";

const input = {
  eventDescription: "The party spared the captured scout and sent them home.",
  tone: "mysterious" as const,
  intensity: "moderate" as const,
  setting: "fantasy" as const,
  timeframe: "mixed" as const,
  count: 3 as const,
  locale: "pt-br" as const,
};

const result = {
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

const incompatible: HistoryEntryParsed = {
  v: 1,
  id: "legacy-empty",
  createdAt: "2026-08-10T12:00:00.000Z",
  input: { ...input, locale: "en" },
  result: { summary: "", consequences: [] },
};

describe("buildRecentDeviceItems", () => {
  it("shows library chronicles with node counts and keeps incompatible legacy items", () => {
    const entry = createHistoryEntry(
      input,
      result,
      new Date("2026-08-12T12:00:00.000Z"),
    );
    const migrated = migrateHistoryEntryToStoredChronicle(entry);
    expect(migrated).toBeTruthy();
    const libraryItem: StoredChronicle = {
      ...migrated!,
      updatedAt: "2026-08-13T15:00:00.000Z",
    };

    const items = buildRecentDeviceItems([libraryItem], [entry, incompatible]);
    expect(items[0]).toMatchObject({
      kind: "chronicle",
      id: libraryItem.id,
      persisted: true,
      nodeCount: 4,
      locale: "pt-br",
    });
    expect(items.some((item) => item.kind === "legacy" && item.id === incompatible.id)).toBe(
      true,
    );
    expect(items.filter((item) => item.kind === "chronicle")).toHaveLength(1);
  });
});
