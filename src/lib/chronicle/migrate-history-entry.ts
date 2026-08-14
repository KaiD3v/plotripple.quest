import { mapGeneratedConsequencesToChronicleGraph } from "@/lib/chronicle/map-generated-consequences";
import { CHRONICLE_LIBRARY_MAX_ITEMS } from "@/lib/chronicle/limits";
import {
  getStoredChronicle,
  listStoredChronicles,
  saveStoredChronicle,
} from "@/lib/chronicle/library-repository";
import { resolveChronicleGraphId } from "@/lib/chronicle/resolve-graph-id";
import { CHRONICLE_LIBRARY_FILE_VERSION } from "@/schemas/chronicle-library";
import type { StoredChronicle } from "@/schemas/chronicle-library";
import type { HistoryEntryParsed } from "@/schemas/generator";
import {
  readHistory,
  saveHistory,
  type HistoryStorage,
} from "@/lib/local-history";

export function migrateHistoryEntryToStoredChronicle(
  entry: HistoryEntryParsed,
): StoredChronicle | null {
  const mapped = mapGeneratedConsequencesToChronicleGraph(entry.result, {
    decision: entry.input.eventDescription,
    locale: entry.input.locale,
    tone: entry.input.tone,
    intensity: entry.input.intensity,
    setting: entry.input.setting,
  });
  if (!mapped.ok) {
    return null;
  }

  const id = resolveChronicleGraphId(mapped.graph);
  if (!id) {
    return null;
  }

  const graph = mapped.graph.id ? mapped.graph : { ...mapped.graph, id };
  return {
    version: CHRONICLE_LIBRARY_FILE_VERSION,
    id,
    title: graph.title,
    graph,
    createdAt: entry.createdAt,
    updatedAt: entry.createdAt,
  };
}

export function hydrateLegacyHistoryIntoLibrary(
  storage: HistoryStorage | null,
): { migrated: number; remaining: number } {
  if (!storage) {
    return { migrated: 0, remaining: 0 };
  }

  const history = readHistory(storage);
  if (history.length === 0) {
    return { migrated: 0, remaining: 0 };
  }

  const remaining: HistoryEntryParsed[] = [];
  let migrated = 0;

  for (const entry of history) {
    const chronicle = migrateHistoryEntryToStoredChronicle(entry);
    if (!chronicle) {
      remaining.push(entry);
      continue;
    }
    if (getStoredChronicle(chronicle.id, storage)) {
      migrated += 1;
      continue;
    }
    if (listStoredChronicles(storage).length >= CHRONICLE_LIBRARY_MAX_ITEMS) {
      remaining.push(entry);
      continue;
    }
    const saved = saveStoredChronicle(chronicle.graph, {
      storage,
      now: new Date(chronicle.createdAt),
    });
    if (!saved.ok) {
      remaining.push(entry);
      continue;
    }
    migrated += 1;
  }

  if (remaining.length !== history.length) {
    saveHistory(remaining, storage);
  }

  return { migrated, remaining: remaining.length };
}
