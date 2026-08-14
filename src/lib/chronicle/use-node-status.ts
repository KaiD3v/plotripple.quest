"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { applyChronicleNodeStatus } from "@/lib/chronicle/apply-node-status";
import { chronicleNodeById } from "@/lib/chronicle/graph-helpers";
import { resolveChronicleNodeStatus } from "@/lib/chronicle/node-status";
import { resolveChronicleGraphId } from "@/lib/chronicle/resolve-graph-id";
import { getChronicleSnapshot } from "@/lib/chronicle/session-repository";
import type {
  ChronicleGraph,
  ChronicleNodeStatus,
} from "@/types/chronicle";

export type NodeStatusUi = {
  pending: boolean;
  error: string | undefined;
  announcement: string;
  clearAnnouncement: () => void;
  currentStatus(nodeId: string): ChronicleNodeStatus | null;
  setStatus(nodeId: string, status: ChronicleNodeStatus): void;
};

export function useNodeStatus(
  graph: ChronicleGraph | null,
  dictionary: Dictionary,
): NodeStatusUi {
  const [error, setError] = useState<string | undefined>();
  const [announcement, setAnnouncement] = useState("");
  const [optimistic, setOptimistic] = useState<
    Record<string, ChronicleNodeStatus>
  >({});
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
    setOptimistic({});
  }, [graphId]);

  const currentStatus = useCallback(
    (nodeId: string): ChronicleNodeStatus | null => {
      if (!graph) {
        return null;
      }
      const node = chronicleNodeById(graph, nodeId);
      if (!node || (node.type !== "consequence" && node.type !== "follow_up")) {
        return null;
      }
      const resolved = resolveChronicleNodeStatus(node.status);
      const draft = optimistic[nodeId];
      // Prefer the optimistic value until the stored graph catches up.
      if (draft && draft !== resolved) {
        return draft;
      }
      return resolved;
    },
    [graph, optimistic],
  );

  const setStatus = useCallback(
    (nodeId: string, status: ChronicleNodeStatus) => {
      const activeGraph = getChronicleSnapshot() ?? graph;
      if (!activeGraph) {
        return;
      }
      const node = chronicleNodeById(activeGraph, nodeId);
      if (!node) {
        setError(dictionary.canvas.statusUpdateFailed);
        return;
      }
      const resolved = resolveChronicleNodeStatus(node.status);
      if (resolved === status) {
        return;
      }

      // Visual selection updates synchronously; persistence follows.
      setOptimistic((current) => ({ ...current, [nodeId]: status }));
      setError(undefined);
      setAnnouncement("");

      const result = applyChronicleNodeStatus({
        graph: activeGraph,
        nodeId,
        status,
      });
      if (!result.ok) {
        setOptimistic((current) => {
          const next = { ...current };
          delete next[nodeId];
          return next;
        });
        setError(
          result.code === "CHRONICLE_STATUS_UNEDITABLE"
            ? dictionary.canvas.statusUneditable
            : dictionary.canvas.statusUpdateFailed,
        );
        return;
      }
      if (!result.changed) {
        return;
      }
      const label = dictionary.canvas.statuses[status];
      setAnnouncement(
        dictionary.canvas.statusMarkedAs
          .replace("{title}", node.title)
          .replace("{status}", label),
      );
      if (!result.librarySaved) {
        setError(dictionary.canvas.statusSessionOnly);
      }
    },
    [dictionary, graph],
  );

  return {
    pending: false,
    error,
    announcement,
    clearAnnouncement,
    currentStatus,
    setStatus,
  };
}
