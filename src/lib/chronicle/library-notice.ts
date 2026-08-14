import { CHRONICLE_LIBRARY_MAX_ITEMS } from "@/lib/chronicle/limits";
import {
  getBrowserLibraryStorage,
  listStoredChronicles,
} from "@/lib/chronicle/library-repository";
import { resolveChronicleGraphId } from "@/lib/chronicle/resolve-graph-id";
import type { StoredChronicle } from "@/schemas/chronicle-library";
import type { ChronicleGraph } from "@/types/chronicle";
import type { HistoryStorage } from "@/lib/local-history";

export type ChronicleLibraryNotice = "ok" | "unavailable" | "full" | "unsaved";

export function resolveChronicleLibraryNotice(
  graph: ChronicleGraph,
  chronicles?: StoredChronicle[],
  storage?: HistoryStorage | null,
): ChronicleLibraryNotice {
  const resolvedStorage =
    storage === undefined ? getBrowserLibraryStorage() : storage;
  if (!resolvedStorage) {
    return "unavailable";
  }

  const id = resolveChronicleGraphId(graph);
  if (!id) {
    return "unsaved";
  }

  const list = chronicles ?? listStoredChronicles(resolvedStorage);
  if (list.some((chronicle) => chronicle.id === id)) {
    return "ok";
  }
  if (list.length >= CHRONICLE_LIBRARY_MAX_ITEMS) {
    return "full";
  }
  return "unsaved";
}
