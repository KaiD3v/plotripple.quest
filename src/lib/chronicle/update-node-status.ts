import { chronicleNodeById } from "@/lib/chronicle/graph-helpers";
import {
  isChronicleNodeStatus,
  resolveChronicleNodeStatus,
} from "@/lib/chronicle/node-status";
import { safeParseChronicleGraph } from "@/schemas/chronicle";
import type {
  ChronicleGraph,
  ChronicleMapResult,
  ChronicleNodeStatus,
} from "@/types/chronicle";

export type UpdateChronicleNodeStatusInput = {
  graph: ChronicleGraph;
  nodeId: string;
  status: ChronicleNodeStatus;
};

export type UpdateChronicleNodeStatusResult =
  | { ok: true; graph: ChronicleGraph; changed: boolean }
  | Extract<ChronicleMapResult, { ok: false }>;

export function updateChronicleNodeStatus(
  input: UpdateChronicleNodeStatusInput,
): UpdateChronicleNodeStatusResult {
  if (!isChronicleNodeStatus(input.status)) {
    return { ok: false, code: "CHRONICLE_INVALID" };
  }

  const node = chronicleNodeById(input.graph, input.nodeId);
  if (!node) {
    return { ok: false, code: "CHRONICLE_NODE_MISSING" };
  }
  if (node.type !== "consequence" && node.type !== "follow_up") {
    return { ok: false, code: "CHRONICLE_STATUS_UNEDITABLE" };
  }

  const current = resolveChronicleNodeStatus(node.status);
  if (current === input.status) {
    return { ok: true, graph: input.graph, changed: false };
  }

  const nextGraph: ChronicleGraph = {
    ...input.graph,
    id: input.graph.id,
    nodes: input.graph.nodes.map((item) =>
      item.id === node.id
        ? {
            ...item,
            status: input.status,
          }
        : item,
    ),
    context: input.graph.context ? { ...input.graph.context } : undefined,
  };

  const validated = safeParseChronicleGraph(nextGraph);
  if (!validated.success) {
    return { ok: false, code: "CHRONICLE_INVALID" };
  }

  return { ok: true, graph: validated.data, changed: true };
}
