import { safeParseChronicleGraph } from "@/schemas/chronicle";
import type { ChronicleGraph } from "@/types/chronicle";
import type { HistoryStorage } from "@/lib/local-history";

export const CHRONICLE_STORAGE_KEY = "plotripple.chronicle.v1";

type ChronicleFile = {
  v: 1;
  graph: ChronicleGraph;
};

const listeners = new Set<() => void>();
let snapshotRaw: string | null | undefined;
let snapshotGraph: ChronicleGraph | null = null;

function getSessionStorage(): HistoryStorage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function serializeChronicleGraph(graph: ChronicleGraph): string {
  const file: ChronicleFile = { v: 1, graph };
  return JSON.stringify(file);
}

export function parseChronicleGraphFile(raw: string | null): ChronicleGraph | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("graph" in parsed)) {
      const direct = safeParseChronicleGraph(parsed);
      return direct.success ? direct.data : null;
    }
    const file = parsed as { v?: unknown; graph?: unknown };
    const result = safeParseChronicleGraph(file.graph);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function writeChronicleGraph(
  storage: HistoryStorage | null,
  graph: ChronicleGraph,
): boolean {
  if (!storage) {
    return false;
  }
  const validated = safeParseChronicleGraph(graph);
  if (!validated.success) {
    return false;
  }
  try {
    storage.setItem(CHRONICLE_STORAGE_KEY, serializeChronicleGraph(validated.data));
    return true;
  } catch {
    return false;
  }
}

export function readChronicleGraph(
  storage: HistoryStorage | null,
): ChronicleGraph | null {
  if (!storage) {
    return null;
  }
  try {
    return parseChronicleGraphFile(storage.getItem(CHRONICLE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearChronicleGraph(storage: HistoryStorage | null): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.removeItem(CHRONICLE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function resetChronicleSnapshotCache(): void {
  snapshotRaw = undefined;
  snapshotGraph = null;
}

export function getCachedChronicleSnapshot(
  storage: HistoryStorage | null,
): ChronicleGraph | null {
  let raw: string | null = null;
  try {
    raw = storage?.getItem(CHRONICLE_STORAGE_KEY) ?? null;
  } catch {
    raw = null;
  }
  if (raw === snapshotRaw) {
    return snapshotGraph;
  }
  snapshotRaw = raw;
  snapshotGraph = parseChronicleGraphFile(raw);
  return snapshotGraph;
}

function emitChronicleChange(): void {
  snapshotRaw = undefined;
  for (const listener of listeners) {
    listener();
  }
}

function readStoredRaw(storage: HistoryStorage | null): string | null {
  try {
    return storage?.getItem(CHRONICLE_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function subscribeChronicle(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getChronicleSnapshot(): ChronicleGraph | null {
  return getCachedChronicleSnapshot(getSessionStorage());
}

export function getServerChronicleSnapshot(): ChronicleGraph | null {
  return null;
}

export function persistChronicle(
  graph: ChronicleGraph,
  storage: HistoryStorage | null = getSessionStorage(),
): boolean {
  const validated = safeParseChronicleGraph(graph);
  if (!validated.success || !storage) {
    return false;
  }
  const serialized = serializeChronicleGraph(validated.data);
  if (readStoredRaw(storage) === serialized) {
    return true;
  }
  try {
    storage.setItem(CHRONICLE_STORAGE_KEY, serialized);
  } catch {
    return false;
  }
  emitChronicleChange();
  return true;
}

export function discardCurrentChronicle(
  storage: HistoryStorage | null = getSessionStorage(),
): boolean {
  const previous = readStoredRaw(storage);
  const cleared = clearChronicleGraph(storage);
  if (!cleared) {
    return false;
  }
  if (previous !== null) {
    emitChronicleChange();
  }
  return true;
}

export function saveCurrentChronicle(graph: ChronicleGraph): boolean {
  return persistChronicle(graph);
}

export function loadCurrentChronicle(): ChronicleGraph | null {
  return getChronicleSnapshot();
}
