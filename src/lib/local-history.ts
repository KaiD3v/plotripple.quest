import {
  historyEntrySchema,
  historyFileSchema,
  type GeneratorInputParsed,
  type HistoryEntryParsed,
} from "@/schemas/generator";
import type { GenerationResult } from "@/types/generator";

export const HISTORY_STORAGE_KEY = "plotripple.history.v1";
export const HISTORY_VERSION = 1;
export const HISTORY_LIMIT = 5;

const EMPTY_HISTORY: HistoryEntryParsed[] = [];

export type HistoryStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function parseHistory(raw: string | null): HistoryEntryParsed[] {
  if (!raw) {
    return EMPTY_HISTORY;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const result = historyFileSchema.safeParse(parsed);
    if (result.success) {
      return result.data.entries.slice(0, HISTORY_LIMIT);
    }

    if (!parsed || typeof parsed !== "object" || !("entries" in parsed)) {
      return EMPTY_HISTORY;
    }

    const entriesValue = (parsed as { entries?: unknown }).entries;
    if (!Array.isArray(entriesValue)) {
      return EMPTY_HISTORY;
    }

    return entriesValue
      .flatMap((item) => {
        const entry = historyEntrySchema.safeParse(item);
        return entry.success ? [entry.data] : [];
      })
      .slice(0, HISTORY_LIMIT);
  } catch {
    return EMPTY_HISTORY;
  }
}

export function serializeHistory(entries: HistoryEntryParsed[]): string {
  return JSON.stringify({
    v: HISTORY_VERSION,
    entries: entries.slice(0, HISTORY_LIMIT),
  });
}

export function readHistory(
  storage: HistoryStorage | null,
): HistoryEntryParsed[] {
  if (!storage) {
    return [];
  }

  try {
    return parseHistory(storage.getItem(HISTORY_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeHistory(
  storage: HistoryStorage | null,
  entries: HistoryEntryParsed[],
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(HISTORY_STORAGE_KEY, serializeHistory(entries));
    return true;
  } catch {
    return false;
  }
}

export function prependHistoryEntry(
  entries: HistoryEntryParsed[],
  entry: HistoryEntryParsed,
): HistoryEntryParsed[] {
  return [entry, ...entries.filter((item) => item.id !== entry.id)].slice(
    0,
    HISTORY_LIMIT,
  );
}

export function createHistoryEntry(
  input: GeneratorInputParsed,
  result: GenerationResult,
  now = new Date(),
): HistoryEntryParsed {
  return {
    v: HISTORY_VERSION,
    id: createLocalId(),
    createdAt: now.toISOString(),
    input,
    result,
  };
}

export function getBrowserHistoryStorage(): HistoryStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storage = window.localStorage;
    const probe = "__plotripple_history_probe";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function createLocalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const historyListeners = new Set<() => void>();
let snapshotRaw: string | null | undefined;
let snapshotEntries: HistoryEntryParsed[] = EMPTY_HISTORY;

export function subscribeHistory(onStoreChange: () => void): () => void {
  historyListeners.add(onStoreChange);
  return () => {
    historyListeners.delete(onStoreChange);
  };
}

export function getHistorySnapshot(): HistoryEntryParsed[] {
  const storage = getBrowserHistoryStorage();
  let raw: string | null = null;
  try {
    raw = storage?.getItem(HISTORY_STORAGE_KEY) ?? null;
  } catch {
    raw = null;
  }
  if (raw === snapshotRaw) {
    return snapshotEntries;
  }
  snapshotRaw = raw;
  snapshotEntries = parseHistory(raw);
  return snapshotEntries;
}

export function getServerHistorySnapshot(): HistoryEntryParsed[] {
  return EMPTY_HISTORY;
}

export function notifyHistoryListeners(): void {
  snapshotRaw = undefined;
  for (const listener of historyListeners) {
    listener();
  }
}

export function resetHistorySnapshotCache(): void {
  snapshotRaw = undefined;
  snapshotEntries = EMPTY_HISTORY;
}

export function saveHistory(
  entries: HistoryEntryParsed[],
  storage: HistoryStorage | null = getBrowserHistoryStorage(),
): boolean {
  const saved = writeHistory(storage, entries);
  notifyHistoryListeners();
  return saved;
}
