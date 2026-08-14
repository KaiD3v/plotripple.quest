import { CHRONICLE_LIBRARY_MAX_ITEMS } from "@/lib/chronicle/limits";
import { resolveChronicleGraphId } from "@/lib/chronicle/resolve-graph-id";
import { safeParseChronicleGraph } from "@/schemas/chronicle";
import {
  CHRONICLE_LIBRARY_FILE_VERSION,
  chronicleLibrarySchema,
  storedChronicleSchema,
  type ChronicleLibraryParsed,
  type StoredChronicle,
} from "@/schemas/chronicle-library";
import type { ChronicleErrorCode, ChronicleGraph } from "@/types/chronicle";
import {
  HISTORY_STORAGE_KEY,
  notifyHistoryListeners,
  type HistoryStorage,
} from "@/lib/local-history";

export const CHRONICLE_LIBRARY_STORAGE_KEY = "plotripple.chronicles.v1";

export const PLOTRIPPLE_LOCAL_STORAGE_KEYS = [
  HISTORY_STORAGE_KEY,
  CHRONICLE_LIBRARY_STORAGE_KEY,
] as const;

const EMPTY_LIBRARY: ChronicleLibraryParsed = {
  version: CHRONICLE_LIBRARY_FILE_VERSION,
  chronicles: [],
};
const EMPTY_LIST: StoredChronicle[] = [];

const libraryListeners = new Set<() => void>();
let snapshotRaw: string | null | undefined;
let snapshotList: StoredChronicle[] = EMPTY_LIST;

export type SaveStoredChronicleResult =
  | { ok: true; chronicle: StoredChronicle; created: boolean }
  | {
      ok: false;
      code: Extract<
        ChronicleErrorCode,
        | "CHRONICLE_INVALID"
        | "CHRONICLE_LIBRARY_UNAVAILABLE"
        | "CHRONICLE_LIBRARY_FULL"
      >;
    };

export function getBrowserLibraryStorage(): HistoryStorage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const storage = window.localStorage;
    const probe = "__plotripple_library_probe";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function parseChronicleLibrary(raw: string | null): ChronicleLibraryParsed {
  if (!raw) {
    return EMPTY_LIBRARY;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const strict = chronicleLibrarySchema.safeParse(parsed);
    if (strict.success) {
      return strict.data;
    }

    if (!parsed || typeof parsed !== "object" || !("chronicles" in parsed)) {
      return EMPTY_LIBRARY;
    }

    const chroniclesValue = (parsed as { chronicles?: unknown }).chronicles;
    if (!Array.isArray(chroniclesValue)) {
      return EMPTY_LIBRARY;
    }

    const chronicles = chroniclesValue.flatMap((item) => {
      const result = storedChronicleSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });

    return {
      version: CHRONICLE_LIBRARY_FILE_VERSION,
      chronicles,
    };
  } catch {
    return EMPTY_LIBRARY;
  }
}

export function serializeChronicleLibrary(
  chronicles: StoredChronicle[],
): string {
  return JSON.stringify({
    version: CHRONICLE_LIBRARY_FILE_VERSION,
    chronicles,
  } satisfies ChronicleLibraryParsed);
}

function readLibrary(storage: HistoryStorage | null): ChronicleLibraryParsed {
  if (!storage) {
    return EMPTY_LIBRARY;
  }
  try {
    return parseChronicleLibrary(storage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY));
  } catch {
    return EMPTY_LIBRARY;
  }
}

function writeLibrary(
  storage: HistoryStorage | null,
  chronicles: StoredChronicle[],
): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(
      CHRONICLE_LIBRARY_STORAGE_KEY,
      serializeChronicleLibrary(chronicles),
    );
    return true;
  } catch {
    return false;
  }
}

function sortByUpdatedAt(chronicles: StoredChronicle[]): StoredChronicle[] {
  return [...chronicles].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

function graphWithId(graph: ChronicleGraph): ChronicleGraph | null {
  const id = resolveChronicleGraphId(graph);
  if (!id) {
    return null;
  }
  if (graph.id === id) {
    const validated = safeParseChronicleGraph(graph);
    return validated.success ? validated.data : null;
  }
  const validated = safeParseChronicleGraph({ ...graph, id });
  return validated.success ? validated.data : null;
}

export function listStoredChronicles(
  storage: HistoryStorage | null = getBrowserLibraryStorage(),
): StoredChronicle[] {
  return sortByUpdatedAt(readLibrary(storage).chronicles);
}

export function getStoredChronicle(
  id: string,
  storage: HistoryStorage | null = getBrowserLibraryStorage(),
): StoredChronicle | null {
  return (
    readLibrary(storage).chronicles.find((chronicle) => chronicle.id === id) ??
    null
  );
}

export function saveStoredChronicle(
  graph: ChronicleGraph,
  options?: { storage?: HistoryStorage | null; now?: Date },
): SaveStoredChronicleResult {
  const storage =
    options?.storage === undefined
      ? getBrowserLibraryStorage()
      : options.storage;
  if (!storage) {
    return { ok: false, code: "CHRONICLE_LIBRARY_UNAVAILABLE" };
  }

  const resolved = graphWithId(graph);
  if (!resolved?.id) {
    return { ok: false, code: "CHRONICLE_INVALID" };
  }

  const now = (options?.now ?? new Date()).toISOString();
  const current = readLibrary(storage).chronicles;
  const existingIndex = current.findIndex(
    (chronicle) => chronicle.id === resolved.id,
  );

  if (existingIndex === -1 && current.length >= CHRONICLE_LIBRARY_MAX_ITEMS) {
    return { ok: false, code: "CHRONICLE_LIBRARY_FULL" };
  }

  const nextChronicle: StoredChronicle = {
    version: CHRONICLE_LIBRARY_FILE_VERSION,
    id: resolved.id,
    title: resolved.title,
    graph: resolved,
    createdAt:
      existingIndex === -1 ? now : current[existingIndex]?.createdAt ?? now,
    updatedAt: now,
  };

  const next =
    existingIndex === -1
      ? [nextChronicle, ...current]
      : current.map((chronicle, index) =>
          index === existingIndex ? nextChronicle : chronicle,
        );

  if (!writeLibrary(storage, next)) {
    return { ok: false, code: "CHRONICLE_LIBRARY_UNAVAILABLE" };
  }

  emitLibraryChange();
  return {
    ok: true,
    chronicle: nextChronicle,
    created: existingIndex === -1,
  };
}

export function deleteStoredChronicle(
  id: string,
  storage: HistoryStorage | null = getBrowserLibraryStorage(),
): boolean {
  if (!storage) {
    return false;
  }
  const current = readLibrary(storage).chronicles;
  const next = current.filter((chronicle) => chronicle.id !== id);
  if (next.length === current.length) {
    return true;
  }
  if (!writeLibrary(storage, next)) {
    return false;
  }
  emitLibraryChange();
  return true;
}

export function clearChronicleLibrary(
  storage: HistoryStorage | null = getBrowserLibraryStorage(),
): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.removeItem(CHRONICLE_LIBRARY_STORAGE_KEY);
  } catch {
    return false;
  }
  emitLibraryChange();
  return true;
}

export function clearPlotRippleLocalStorage(
  storage: HistoryStorage | null = getBrowserLibraryStorage(),
): boolean {
  if (!storage) {
    return false;
  }
  try {
    for (const key of PLOTRIPPLE_LOCAL_STORAGE_KEYS) {
      storage.removeItem(key);
    }
  } catch {
    return false;
  }
  notifyHistoryListeners();
  emitLibraryChange();
  return true;
}

export function subscribeChronicleLibrary(listener: () => void): () => void {
  libraryListeners.add(listener);
  return () => {
    libraryListeners.delete(listener);
  };
}

export function getCachedChronicleLibrarySnapshot(
  storage: HistoryStorage | null,
): StoredChronicle[] {
  let raw: string | null = null;
  try {
    raw = storage?.getItem(CHRONICLE_LIBRARY_STORAGE_KEY) ?? null;
  } catch {
    raw = null;
  }
  if (raw === snapshotRaw) {
    return snapshotList;
  }
  snapshotRaw = raw;
  snapshotList = sortByUpdatedAt(parseChronicleLibrary(raw).chronicles);
  return snapshotList;
}

export function getChronicleLibrarySnapshot(): StoredChronicle[] {
  return getCachedChronicleLibrarySnapshot(getBrowserLibraryStorage());
}

export function getServerChronicleLibrarySnapshot(): StoredChronicle[] {
  return EMPTY_LIST;
}

export function resetChronicleLibraryCache(): void {
  snapshotRaw = undefined;
  snapshotList = EMPTY_LIST;
}

function emitLibraryChange(): void {
  snapshotRaw = undefined;
  for (const listener of libraryListeners) {
    listener();
  }
}
