import { describe, expect, it } from "vitest";
import { prepareChronicleNavigation } from "@/lib/chronicle/prepare-navigation";
import {
  CHRONICLE_STORAGE_KEY,
  readChronicleGraph,
} from "@/lib/chronicle/session-repository";
import type { HistoryStorage } from "@/lib/local-history";
import type { GenerationResult } from "@/types/generator";

const result: GenerationResult = {
  summary: "Mercy leaves a trail of obligations.",
  consequences: [
    {
      title: "A whispered debt",
      description: "The scout’s kin begin asking quiet favors.",
      timeframe: "immediate",
      category: "social",
      trigger: "The scout reports who showed mercy.",
      affectedParties: ["the scout’s kin"],
    },
    {
      title: "Standing orders change",
      description: "The watch is told not to take prisoners.",
      timeframe: "next_session",
      category: "political",
      trigger: "The report reaches the captain.",
      affectedParties: ["the garrison"],
    },
    {
      title: "A rumor becomes a banner",
      description: "Pilgrims start using the party’s name.",
      timeframe: "long_term",
      category: "supernatural",
      trigger: "A chaplain writes the story down.",
      affectedParties: ["border pilgrims"],
    },
  ],
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

describe("prepareChronicleNavigation", () => {
  it("saves the chronicle and returns the localized canvas href", () => {
    const storage = memoryStorage();
    const navigation = prepareChronicleNavigation(
      result,
      "pt-br",
      "The party spared the captured scout and sent them home with a warning.",
      storage,
    );

    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    expect(navigation.href).toBe("/pt-br/canvas");
    expect(navigation.sessionSaved).toBe(true);
    expect(navigation.librarySaved).toBe(true);
    expect(readChronicleGraph(storage)?.title).toBeTruthy();
    expect(readChronicleGraph(storage)?.id).toBeTruthy();
    expect(storage.getItem(CHRONICLE_STORAGE_KEY)).toContain("A whispered debt");
  });

  it("preserves English locale in the href", () => {
    const navigation = prepareChronicleNavigation(
      result,
      "en",
      "The party spared the captured scout.",
      memoryStorage(),
    );
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    expect(navigation.href).toBe("/en/canvas");
  });

  it("does not navigate when the result cannot become a chronicle", () => {
    const storage = memoryStorage();
    const navigation = prepareChronicleNavigation(
      { consequences: [] },
      "en",
      "A decision without ripples.",
      storage,
    );
    expect(navigation).toEqual({ ok: false, code: "CHRONICLE_EMPTY" });
    expect(storage.getItem(CHRONICLE_STORAGE_KEY)).toBeNull();
  });

  it("still returns the graph when session storage cannot be written", () => {
    const navigation = prepareChronicleNavigation(
      result,
      "en",
      "The party spared the captured scout.",
      null,
    );
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    expect(navigation.sessionSaved).toBe(false);
    expect(navigation.librarySaved).toBe(false);
    expect(navigation.href).toBe("/en/canvas");
    expect(navigation.graph.nodes.length).toBeGreaterThan(0);
  });
});
