import { localizedPath, type Locale } from "@/i18n/config";
import { migrateHistoryEntryToStoredChronicle } from "@/lib/chronicle/migrate-history-entry";
import {
  getBrowserLibraryStorage,
  getStoredChronicle,
  saveStoredChronicle,
} from "@/lib/chronicle/library-repository";
import {
  persistChronicle,
  writeChronicleGraph,
} from "@/lib/chronicle/session-repository";
import type { ChronicleErrorCode, ChronicleGraph } from "@/types/chronicle";
import {
  getBrowserHistoryStorage,
  readHistory,
  saveHistory,
  type HistoryStorage,
} from "@/lib/local-history";

export type OpenChronicleResult =
  | { ok: true; href: string; graph: ChronicleGraph }
  | { ok: false; code: ChronicleErrorCode };

function persistActiveChronicle(
  graph: ChronicleGraph,
  sessionStorage?: HistoryStorage | null,
): boolean {
  if (sessionStorage === undefined) {
    return persistChronicle(graph);
  }
  return writeChronicleGraph(sessionStorage, graph);
}

export function openChronicleOnCanvas(options: {
  id: string;
  locale: Locale;
  sourceHistoryId?: string;
  libraryStorage?: HistoryStorage | null;
  historyStorage?: HistoryStorage | null;
  sessionStorage?: HistoryStorage | null;
}): OpenChronicleResult {
  const libraryStorage =
    options.libraryStorage === undefined
      ? getBrowserLibraryStorage()
      : options.libraryStorage;
  const historyStorage =
    options.historyStorage === undefined
      ? getBrowserHistoryStorage()
      : options.historyStorage;

  let graph: ChronicleGraph | undefined = getStoredChronicle(
    options.id,
    libraryStorage,
  )?.graph;

  if (!graph) {
    const history = readHistory(historyStorage);
    const entry = history.find(
      (item) =>
        item.id === options.sourceHistoryId ||
        migrateHistoryEntryToStoredChronicle(item)?.id === options.id,
    );
    const migrated = entry ? migrateHistoryEntryToStoredChronicle(entry) : null;
    if (!migrated) {
      return { ok: false, code: "CHRONICLE_NOT_FOUND" };
    }
    graph = migrated.graph;
    const saved = saveStoredChronicle(graph, { storage: libraryStorage });
    if (saved.ok && entry) {
      saveHistory(
        history.filter((item) => item.id !== entry.id),
        historyStorage,
      );
    }
  }

  if (!persistActiveChronicle(graph, options.sessionStorage)) {
    return { ok: false, code: "CHRONICLE_UNAVAILABLE" };
  }

  return {
    ok: true,
    href: localizedPath(options.locale, "/canvas"),
    graph,
  };
}
