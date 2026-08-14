import {
  CHRONICLE_EXPAND_FOLLOW_UP_COUNT,
  CHRONICLE_MAX_DEPTH,
  CHRONICLE_MAX_NODES,
} from "@/lib/chronicle/limits";
import {
  chronicleChildren,
  chronicleNodeById,
} from "@/lib/chronicle/graph-helpers";
import type { ChronicleGraph, ChronicleMapResult } from "@/types/chronicle";

export function canExpandChronicleNode(
  graph: ChronicleGraph,
  parentNodeId: string,
): ChronicleMapResult {
  const parent = chronicleNodeById(graph, parentNodeId);
  if (!parent) {
    return { ok: false, code: "CHRONICLE_NODE_MISSING" };
  }
  if (parent.type !== "consequence" && parent.type !== "follow_up") {
    return { ok: false, code: "CHRONICLE_CANNOT_EXPAND" };
  }
  if (parent.depth >= CHRONICLE_MAX_DEPTH) {
    return { ok: false, code: "CHRONICLE_MAX_DEPTH" };
  }
  if (parent.depth + 1 > CHRONICLE_MAX_DEPTH) {
    return { ok: false, code: "CHRONICLE_MAX_DEPTH" };
  }
  if (chronicleChildren(graph, parent.id).length > 0) {
    return { ok: false, code: "CHRONICLE_ALREADY_EXPANDED" };
  }
  if (graph.nodes.length + CHRONICLE_EXPAND_FOLLOW_UP_COUNT > CHRONICLE_MAX_NODES) {
    return { ok: false, code: "CHRONICLE_NODE_LIMIT" };
  }
  return { ok: true, graph };
}
