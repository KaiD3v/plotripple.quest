"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useExploreRipple } from "@/lib/chronicle/use-explore-ripple";
import { useNodeStatus } from "@/lib/chronicle/use-node-status";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { ChronicleEmptyState } from "@/components/canvas/chronicle-empty-state";
import { NarrativeCanvas } from "@/components/canvas/narrative-canvas";
import { canvasGraphFromChronicle } from "@/lib/chronicle/narrative-bridge";
import { resolveChronicleLibraryNotice } from "@/lib/chronicle/library-notice";
import {
  getBrowserLibraryStorage,
  getChronicleLibrarySnapshot,
  getServerChronicleLibrarySnapshot,
  subscribeChronicleLibrary,
} from "@/lib/chronicle/library-repository";
import { resolveChronicleGraphId } from "@/lib/chronicle/resolve-graph-id";
import {
  getClientHydrationSnapshot,
  getServerHydrationSnapshot,
  resolveChroniclePageState,
  subscribeHydration,
} from "@/lib/chronicle/page-state";
import {
  getChronicleSnapshot,
  getServerChronicleSnapshot,
  subscribeChronicle,
} from "@/lib/chronicle/session-repository";

export function ChronicleCanvasPage({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const stored = useSyncExternalStore(
    subscribeChronicle,
    getChronicleSnapshot,
    getServerChronicleSnapshot,
  );
  const library = useSyncExternalStore(
    subscribeChronicleLibrary,
    getChronicleLibrarySnapshot,
    getServerChronicleLibrarySnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );

  const state = resolveChroniclePageState(hydrated, stored);
  const graph = useMemo(
    () => (stored ? canvasGraphFromChronicle(stored, locale) : null),
    [locale, stored],
  );
  const explore = useExploreRipple(stored, locale, dictionary);
  const statusUi = useNodeStatus(stored, dictionary);
  const notice = stored
    ? resolveChronicleLibraryNotice(stored, library, getBrowserLibraryStorage())
    : "ok";
  const sessionOnlyNotice =
    statusUi.error === dictionary.canvas.statusSessionOnly
      ? dictionary.canvas.statusSessionOnly
      : undefined;
  const canvasKey = stored
    ? resolveChronicleGraphId(stored) ?? stored.title
    : "empty";

  if (state === "loading") {
    return (
      <div
        className="page-gutter mx-auto w-full max-w-3xl py-8 sm:py-10"
        aria-busy="true"
      >
        <p className="eyebrow">{dictionary.canvas.productionEyebrow}</p>
        <h1 className="mt-2 font-display text-3xl text-bone sm:text-4xl">
          {dictionary.canvas.productionTitle}
        </h1>
        <p className="mt-3 text-lichen">{dictionary.canvas.loading}</p>
      </div>
    );
  }

  if (state === "empty" || !stored) {
    return <ChronicleEmptyState locale={locale} dictionary={dictionary} />;
  }

  if (!graph) {
    return <ChronicleEmptyState locale={locale} dictionary={dictionary} />;
  }

  return (
    <NarrativeCanvas
      key={canvasKey}
      graph={graph}
      dictionary={dictionary}
      chrome={{
        eyebrow: dictionary.canvas.productionEyebrow,
        title: dictionary.canvas.productionTitle,
        helper: dictionary.canvas.productionHelper,
        status:
          sessionOnlyNotice ??
          (notice === "unavailable"
            ? dictionary.canvas.libraryUnavailable
            : notice === "full"
              ? dictionary.canvas.libraryFull
              : notice === "unsaved"
                ? dictionary.canvas.libraryUnsaved
                : undefined),
      }}
      explore={explore}
      statusUi={statusUi}
    />
  );
}
