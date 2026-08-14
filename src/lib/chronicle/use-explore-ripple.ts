"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { canExpandChronicleNode } from "@/lib/chronicle/can-expand";
import { chronicleNodeById } from "@/lib/chronicle/graph-helpers";
import { exploreRippleMessage } from "@/lib/chronicle/explore-message";
import { exploreRippleOnChronicle } from "@/lib/chronicle/explore-ripple";
import { CHRONICLE_EXPAND_FOLLOW_UP_COUNT } from "@/lib/chronicle/limits";
import { resolveChronicleGraphId } from "@/lib/chronicle/resolve-graph-id";
import type { ChronicleGraph } from "@/types/chronicle";

export type ExploreRippleMode =
  | "hidden"
  | "available"
  | "loading"
  | "explored"
  | "disabled";

export type ExploreRippleUi = {
  pending: boolean;
  pendingNodeId: string | null;
  error: string | undefined;
  announcement: string;
  clearAnnouncement: () => void;
  getState(nodeId: string): { mode: ExploreRippleMode; reason?: string };
  explore(nodeId: string): Promise<void>;
};

export function useExploreRipple(
  graph: ChronicleGraph | null,
  locale: Locale,
  dictionary: Dictionary,
): ExploreRippleUi {
  const [pendingNodeId, setPendingNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [announcement, setAnnouncement] = useState("");
  const inflight = useRef(false);
  const graphId = graph ? resolveChronicleGraphId(graph) : null;
  const previousGraphId = useRef(graphId);

  const clearAnnouncement = useCallback(() => {
    setAnnouncement("");
  }, []);

  useEffect(() => {
    if (previousGraphId.current === graphId) {
      return;
    }
    previousGraphId.current = graphId;
    setAnnouncement("");
    setError(undefined);
  }, [graphId]);

  const getState = useCallback(
    (nodeId: string) => {
      if (!graph) {
        return { mode: "hidden" as const };
      }
      const node = chronicleNodeById(graph, nodeId);
      if (!node || (node.type !== "consequence" && node.type !== "follow_up")) {
        return { mode: "hidden" as const };
      }
      const gate = canExpandChronicleNode(graph, nodeId);
      if (!gate.ok && gate.code === "CHRONICLE_ALREADY_EXPANDED") {
        return { mode: "explored" as const };
      }
      if (pendingNodeId) {
        return pendingNodeId === nodeId
          ? { mode: "loading" as const }
          : { mode: "disabled" as const };
      }
      if (gate.ok) {
        return { mode: "available" as const };
      }
      return {
        mode: "disabled" as const,
        reason: exploreRippleMessage(gate.code, dictionary),
      };
    },
    [dictionary, graph, pendingNodeId],
  );

  const explore = useCallback(
    async (nodeId: string) => {
      if (!graph || inflight.current) {
        return;
      }
      const gate = canExpandChronicleNode(graph, nodeId);
      if (!gate.ok) {
        setError(exploreRippleMessage(gate.code, dictionary));
        return;
      }

      inflight.current = true;
      setPendingNodeId(nodeId);
      setError(undefined);
      setAnnouncement("");

      try {
        const result = await exploreRippleOnChronicle({
          graph,
          parentNodeId: nodeId,
          locale,
        });
        if (!result.ok) {
          setError(exploreRippleMessage(result.code, dictionary));
          return;
        }
        const node = chronicleNodeById(graph, nodeId);
        setAnnouncement(
          dictionary.canvas.followUpsAdded
            .replace("{count}", String(CHRONICLE_EXPAND_FOLLOW_UP_COUNT))
            .replace("{title}", node?.title ?? ""),
        );
      } finally {
        inflight.current = false;
        setPendingNodeId(null);
      }
    },
    [dictionary, graph, locale],
  );

  return {
    pending: Boolean(pendingNodeId),
    pendingNodeId,
    error,
    announcement,
    clearAnnouncement,
    getState,
    explore,
  };
}
