import {
  saveStoredChronicle,
  type SaveStoredChronicleResult,
} from "@/lib/chronicle/library-repository";
import { updateChronicleNodeStatus } from "@/lib/chronicle/update-node-status";
import { persistChronicle } from "@/lib/chronicle/session-repository";
import type {
  ChronicleErrorCode,
  ChronicleGraph,
  ChronicleNodeStatus,
} from "@/types/chronicle";

export type ApplyNodeStatusResult =
  | {
      ok: true;
      graph: ChronicleGraph;
      changed: boolean;
      librarySaved: boolean;
      libraryCode?: ChronicleErrorCode;
    }
  | { ok: false; code: ChronicleErrorCode };

export function applyChronicleNodeStatus(options: {
  graph: ChronicleGraph;
  nodeId: string;
  status: ChronicleNodeStatus;
  persist?: typeof persistChronicle;
  saveLibrary?: (graph: ChronicleGraph) => SaveStoredChronicleResult;
}): ApplyNodeStatusResult {
  const updated = updateChronicleNodeStatus({
    graph: options.graph,
    nodeId: options.nodeId,
    status: options.status,
  });
  if (!updated.ok) {
    return updated;
  }
  if (!updated.changed) {
    return {
      ok: true,
      graph: updated.graph,
      changed: false,
      librarySaved: true,
    };
  }

  const persist = options.persist ?? persistChronicle;
  if (!persist(updated.graph)) {
    return { ok: false, code: "CHRONICLE_UNAVAILABLE" };
  }

  const saveLibrary = options.saveLibrary ?? saveStoredChronicle;
  const library = saveLibrary(updated.graph);

  return {
    ok: true,
    graph: updated.graph,
    changed: true,
    librarySaved: library.ok,
    libraryCode: library.ok ? undefined : library.code,
  };
}
