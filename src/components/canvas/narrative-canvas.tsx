"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { ChronicleOutline } from "@/components/canvas/chronicle-outline";
import {
  DesktopChronicleMap,
  type ChronicleMapHandle,
} from "@/components/canvas/desktop-chronicle-map";
import { DesktopNodeDetails } from "@/components/canvas/node-details";
import { MobileChronicleTree } from "@/components/canvas/mobile-chronicle-tree";
import { MobileDetailsDialog } from "@/components/canvas/mobile-details-dialog";
import {
  createDialogFocusSession,
  restoreFocusAfterUnmount,
} from "@/lib/canvas/dialog-focus";
import { getNode, relatedPathIds } from "@/lib/canvas/graph-queries";
import {
  DETAILS_PANEL_ID,
  SELECTION_LIVE_ID,
  focusVisibleNode,
  handleCanvasEscape,
  scrollNodeIntoViewIfNeeded,
  selectionAnnouncement,
  type ChronicleSelectHandler,
} from "@/lib/canvas/selection";
import type { ExploreRippleUi } from "@/lib/chronicle/use-explore-ripple";
import type { NodeStatusUi } from "@/lib/chronicle/use-node-status";
import type { NarrativeGraph } from "@/types/narrative-graph";

export type CanvasChrome = {
  eyebrow: string;
  title: string;
  helper: string;
  status?: string;
};

export function NarrativeCanvas({
  graph,
  dictionary,
  chrome,
  headerExtra,
  initialSelectedId = null,
  explore,
  statusUi,
}: {
  graph: NarrativeGraph;
  dictionary: Dictionary;
  chrome: CanvasChrome;
  headerExtra?: ReactNode;
  initialSelectedId?: string | null;
  explore?: ExploreRippleUi;
  statusUi?: NodeStatusUi;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const mapRef = useRef<ChronicleMapHandle>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const focusSessionRef = useRef(createDialogFocusSession());
  const lastSelectedRef = useRef<string | null>(initialSelectedId);
  const previousNodeCount = useRef(graph.nodes.length);
  const selectedNode = selectedId ? getNode(graph, selectedId) : undefined;
  const related = useMemo(
    () =>
      selectedId
        ? relatedPathIds(graph, selectedId)
        : { nodes: new Set<string>(), edges: new Set<string>() },
    [graph, selectedId],
  );

  const registerNode = useCallback(
    (nodeId: string, element: HTMLButtonElement | null) => {
      if (element) {
        nodeRefs.current.set(nodeId, element);
      } else {
        nodeRefs.current.delete(nodeId);
      }
    },
    [],
  );

  const clearExploreAnnouncement = explore?.clearAnnouncement;
  const clearStatusAnnouncement = statusUi?.clearAnnouncement;

  const openDetails: ChronicleSelectHandler = useCallback(
    (nodeId, trigger) => {
      clearExploreAnnouncement?.();
      clearStatusAnnouncement?.();
      focusSessionRef.current.remember(trigger);
      lastSelectedRef.current = nodeId;
      setSelectedId(nodeId);
    },
    [clearExploreAnnouncement, clearStatusAnnouncement],
  );

  const closeDetails = useCallback(() => {
    clearExploreAnnouncement?.();
    clearStatusAnnouncement?.();
    setSelectedId(null);
  }, [clearExploreAnnouncement, clearStatusAnnouncement]);

  const selectFromOutline: ChronicleSelectHandler = useCallback(
    (nodeId, trigger) => {
      openDetails(nodeId, trigger);
      mapRef.current?.centerSelected(nodeId);
    },
    [openDetails],
  );

  useEffect(() => {
    if (selectedId !== null) {
      return;
    }

    const trigger = focusSessionRef.current.consume();
    if (trigger) {
      restoreFocusAfterUnmount(trigger);
      return;
    }

    const nodeId = lastSelectedRef.current;
    if (!nodeId) {
      return;
    }
    restoreFocusAfterUnmount({
      focus() {
        focusVisibleNode(nodeId);
        scrollNodeIntoViewIfNeeded(nodeId);
      },
    } as HTMLElement);
  }, [selectedId]);

  useEffect(() => {
    if (graph.nodes.length > previousNodeCount.current && selectedId) {
      mapRef.current?.centerSelected(selectedId);
      scrollNodeIntoViewIfNeeded(selectedId);
    }
    previousNodeCount.current = graph.nodes.length;
  }, [graph.nodes.length, selectedId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const result = handleCanvasEscape(event.key, selectedId);
      if (!result.close) {
        return;
      }
      event.preventDefault();
      closeDetails();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeDetails, selectedId]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main || typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(max-width: 1023px)");

    function syncInert() {
      const surface = mainRef.current;
      if (!surface) {
        return;
      }
      const lock = Boolean(selectedId) && media.matches;
      surface.toggleAttribute("inert", lock);
      if (lock) {
        surface.setAttribute("aria-hidden", "true");
      } else {
        surface.removeAttribute("aria-hidden");
      }
    }

    syncInert();
    media.addEventListener("change", syncInert);
    return () => {
      media.removeEventListener("change", syncInert);
      main.removeAttribute("inert");
      main.removeAttribute("aria-hidden");
    };
  }, [selectedId]);

  return (
    <div className="page-gutter mx-auto w-full max-w-7xl overflow-x-hidden py-5 sm:py-6">
      <div ref={mainRef}>
        {headerExtra}

        <p className="eyebrow mt-5">{chrome.eyebrow}</p>
        <h1 className="mt-2 break-words font-display text-3xl text-bone sm:text-4xl">
          {chrome.title}
        </h1>
        <p className="mt-2 max-w-2xl break-words text-lichen">{chrome.helper}</p>
        <p className="mt-2 font-display text-lg text-gold">{graph.title}</p>
        {chrome.status ? (
          <p className="mt-3 text-sm text-sage" role="status">
            {chrome.status}
          </p>
        ) : null}

        <p className="chronicle-hint mt-3 hidden max-w-2xl lg:block">
          {dictionary.canvas.hintDesktop}
        </p>
        <p className="chronicle-hint mt-3 max-w-2xl lg:hidden">
          {dictionary.canvas.hintMobile}
        </p>

        <div id={SELECTION_LIVE_ID} className="sr-only" aria-live="polite">
          {selectedNode ? selectionAnnouncement(selectedNode, dictionary) : ""}
        </div>
        <div id="chronicle-explore-live" className="sr-only" aria-live="polite">
          {explore?.announcement ?? ""}
        </div>
        <div id="chronicle-status-live" className="sr-only" aria-live="polite">
          {statusUi?.announcement ?? ""}
        </div>

        <div
          className={`mt-5 lg:grid lg:items-start lg:gap-4 ${
            selectedNode
              ? "lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]"
              : "lg:grid-cols-1"
          }`}
        >
          <div className="hidden lg:block">
            <DesktopChronicleMap
              ref={mapRef}
              graph={graph}
              dictionary={dictionary}
              selectedId={selectedId}
              relatedNodeIds={related.nodes}
              relatedEdgeIds={related.edges}
              onSelect={openDetails}
              registerNode={registerNode}
            />
          </div>

          <div className="lg:hidden">
            <MobileChronicleTree
              graph={graph}
              dictionary={dictionary}
              selectedId={selectedId}
              relatedNodeIds={related.nodes}
              onSelect={openDetails}
              registerNode={registerNode}
            />
          </div>

          {selectedNode ? (
            <div className="mt-4 hidden lg:block">
              <DesktopNodeDetails
                node={selectedNode}
                dictionary={dictionary}
                onClose={closeDetails}
                onCenterNode={() => mapRef.current?.centerSelected()}
                explore={explore}
                statusUi={statusUi}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-4 hidden lg:block">
          <ChronicleOutline
            graph={graph}
            dictionary={dictionary}
            selectedId={selectedId}
            onSelect={selectFromOutline}
          />
        </div>

        <p className="sr-only" id={`${DETAILS_PANEL_ID}-hint`}>
          {dictionary.canvas.detailsTitle}
        </p>
      </div>

      {selectedNode ? (
        <MobileDetailsDialog
          node={selectedNode}
          dictionary={dictionary}
          onClose={closeDetails}
          explore={explore}
          statusUi={statusUi}
        />
      ) : null}
    </div>
  );
}
