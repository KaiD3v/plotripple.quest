import { migrateHistoryEntryToStoredChronicle } from "@/lib/chronicle/migrate-history-entry";
import {
  CHRONICLE_LIBRARY_STORAGE_KEY,
  getBrowserLibraryStorage,
  parseChronicleLibrary,
  subscribeChronicleLibrary,
} from "@/lib/chronicle/library-repository";
import type { StoredChronicle } from "@/schemas/chronicle-library";
import type { HistoryEntryParsed } from "@/schemas/generator";
import type { Locale } from "@/i18n/config";
import {
  HISTORY_STORAGE_KEY,
  getBrowserHistoryStorage,
  parseHistory,
  subscribeHistory,
} from "@/lib/local-history";

export type RecentChronicleItem = {
  kind: "chronicle";
  id: string;
  title: string;
  locale: Locale;
  nodeCount: number;
  updatedAt: string;
  persisted: boolean;
  sourceHistoryId?: string;
};

export type RecentLegacyItem = {
  kind: "legacy";
  id: string;
  title: string;
  locale: Locale;
  updatedAt: string;
  entry: HistoryEntryParsed;
};

export type RecentDeviceItem = RecentChronicleItem | RecentLegacyItem;

const EMPTY_RECENT: RecentDeviceItem[] = [];

let snapshotLibraryRaw: string | null | undefined;
let snapshotHistoryRaw: string | null | undefined;
let snapshotItems: RecentDeviceItem[] = EMPTY_RECENT;

export function buildRecentDeviceItems(
  chronicles: StoredChronicle[],
  history: HistoryEntryParsed[],
): RecentDeviceItem[] {
  const seen = new Set<string>();
  const items: RecentDeviceItem[] = [];

  for (const chronicle of chronicles) {
    seen.add(chronicle.id);
    items.push({
      kind: "chronicle",
      id: chronicle.id,
      title: chronicle.title,
      locale: chronicle.graph.context?.locale ?? "en",
      nodeCount: chronicle.graph.nodes.length,
      updatedAt: chronicle.updatedAt,
      persisted: true,
    });
  }

  for (const entry of history) {
    const migrated = migrateHistoryEntryToStoredChronicle(entry);
    if (migrated) {
      if (seen.has(migrated.id)) {
        continue;
      }
      seen.add(migrated.id);
      items.push({
        kind: "chronicle",
        id: migrated.id,
        title: migrated.title,
        locale: migrated.graph.context?.locale ?? entry.input.locale ?? "en",
        nodeCount: migrated.graph.nodes.length,
        updatedAt: migrated.updatedAt,
        persisted: false,
        sourceHistoryId: entry.id,
      });
      continue;
    }

    items.push({
      kind: "legacy",
      id: entry.id,
      title: entry.input.eventDescription,
      locale: entry.input.locale ?? "en",
      updatedAt: entry.createdAt,
      entry,
    });
  }

  return items.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export function subscribeRecentDevice(listener: () => void): () => void {
  const unsubscribeLibrary = subscribeChronicleLibrary(listener);
  const unsubscribeHistory = subscribeHistory(listener);
  return () => {
    unsubscribeLibrary();
    unsubscribeHistory();
  };
}

export function getRecentDeviceSnapshot(): RecentDeviceItem[] {
  const libraryStorage = getBrowserLibraryStorage();
  const historyStorage = getBrowserHistoryStorage();
  let libraryRaw: string | null = null;
  let historyRaw: string | null = null;
  try {
    libraryRaw = libraryStorage?.getItem(CHRONICLE_LIBRARY_STORAGE_KEY) ?? null;
  } catch {
    libraryRaw = null;
  }
  try {
    historyRaw = historyStorage?.getItem(HISTORY_STORAGE_KEY) ?? null;
  } catch {
    historyRaw = null;
  }

  if (
    libraryRaw === snapshotLibraryRaw &&
    historyRaw === snapshotHistoryRaw
  ) {
    return snapshotItems;
  }

  snapshotLibraryRaw = libraryRaw;
  snapshotHistoryRaw = historyRaw;
  snapshotItems = buildRecentDeviceItems(
    parseChronicleLibrary(libraryRaw).chronicles,
    parseHistory(historyRaw),
  );
  return snapshotItems;
}

export function getServerRecentDeviceSnapshot(): RecentDeviceItem[] {
  return EMPTY_RECENT;
}

export function resetRecentDeviceCache(): void {
  snapshotLibraryRaw = undefined;
  snapshotHistoryRaw = undefined;
  snapshotItems = EMPTY_RECENT;
}
