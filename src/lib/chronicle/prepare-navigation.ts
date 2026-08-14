import { localizedPath, type Locale } from "@/i18n/config";
import { mapGeneratedConsequencesToChronicleGraph } from "@/lib/chronicle/map-generated-consequences";
import { saveStoredChronicle } from "@/lib/chronicle/library-repository";
import { persistChronicle, writeChronicleGraph } from "@/lib/chronicle/session-repository";
import type { HistoryStorage } from "@/lib/local-history";
import type {
  ChronicleErrorCode,
  ChronicleGraph,
  ChronicleNarrativeContext,
} from "@/types/chronicle";

export type ChronicleNavigationResult =
  | {
      ok: true;
      href: string;
      graph: ChronicleGraph;
      librarySaved: boolean;
      libraryCode?: ChronicleErrorCode;
    }
  | { ok: false; code: ChronicleErrorCode };

export function prepareChronicleNavigation(
  result: unknown,
  locale: Locale,
  decision?: string,
  storage?: HistoryStorage | null,
  narrative?: ChronicleNarrativeContext,
): ChronicleNavigationResult {
  const mapped = mapGeneratedConsequencesToChronicleGraph(result, {
    decision,
    locale,
    tone: narrative?.tone,
    intensity: narrative?.intensity,
    setting: narrative?.setting,
  });
  if (!mapped.ok) {
    return mapped;
  }

  const saved =
    storage === undefined
      ? persistChronicle(mapped.graph)
      : writeChronicleGraph(storage, mapped.graph);

  if (!saved) {
    return { ok: false, code: "CHRONICLE_UNAVAILABLE" };
  }

  const library =
    storage === undefined
      ? saveStoredChronicle(mapped.graph)
      : saveStoredChronicle(mapped.graph, { storage });

  return {
    ok: true,
    href: localizedPath(locale, "/canvas"),
    graph: mapped.graph,
    librarySaved: library.ok,
    libraryCode: library.ok ? undefined : library.code,
  };
}
