import { canExpandChronicleNode } from "@/lib/chronicle/can-expand";
import {
  chronicleChildren,
  chronicleNodeById,
  normalizeChronicleTitle,
} from "@/lib/chronicle/graph-helpers";
import { CHRONICLE_EXPAND_FOLLOW_UP_COUNT } from "@/lib/chronicle/limits";
import { safeParseChronicleGraph } from "@/schemas/chronicle";
import type { GeneratedFollowUpParsed } from "@/schemas/follow-up";
import type {
  ChronicleGraph,
  ChronicleMapResult,
  ChronicleNode,
} from "@/types/chronicle";

export type AppendFollowUpsInput = {
  graph: ChronicleGraph;
  parentNodeId: string;
  generatedFollowUps: GeneratedFollowUpParsed[];
};

function djb2(input: string): string {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) + hash + input.charCodeAt(index);
    hash |= 0;
  }
  return (hash >>> 0).toString(36);
}

function followUpNodeId(parentId: string, title: string, index: number): string {
  return `${parentId}:fu:${index}-${djb2(title)}`.slice(0, 160);
}

function hasHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(value);
}

export function appendFollowUpsToChronicleGraph(
  input: AppendFollowUpsInput,
): ChronicleMapResult {
  const gate = canExpandChronicleNode(input.graph, input.parentNodeId);
  if (!gate.ok) {
    return gate;
  }

  const parent = chronicleNodeById(input.graph, input.parentNodeId);
  if (!parent) {
    return { ok: false, code: "CHRONICLE_NODE_MISSING" };
  }

  if (input.generatedFollowUps.length !== CHRONICLE_EXPAND_FOLLOW_UP_COUNT) {
    return { ok: false, code: "CHRONICLE_INVALID" };
  }

  const existingTitles = new Set(
    chronicleChildren(input.graph, parent.id).map((node) =>
      normalizeChronicleTitle(node.title),
    ),
  );
  const seenIncoming = new Set<string>();

  for (const followUp of input.generatedFollowUps) {
    if (hasHtml(followUp.title) || hasHtml(followUp.description)) {
      return { ok: false, code: "CHRONICLE_INVALID" };
    }
    const key = normalizeChronicleTitle(followUp.title);
    if (!key || existingTitles.has(key) || seenIncoming.has(key)) {
      return { ok: false, code: "CHRONICLE_DUPLICATE" };
    }
    seenIncoming.add(key);
  }

  const newNodes: ChronicleNode[] = input.generatedFollowUps.map(
    (followUp, index) => ({
      id: followUpNodeId(parent.id, followUp.title, index),
      type: "follow_up",
      title: followUp.title.trim(),
      description: followUp.description.trim(),
      parentId: parent.id,
      depth: parent.depth + 1,
      timeframe: followUp.timeframe,
      category: followUp.category,
      trigger: followUp.trigger?.trim() || undefined,
      affectedParties: followUp.affectedParties
        ? [...followUp.affectedParties]
        : undefined,
      status: "pending",
    }),
  );

  if (new Set(newNodes.map((node) => node.id)).size !== newNodes.length) {
    return { ok: false, code: "CHRONICLE_DUPLICATE" };
  }
  if (newNodes.some((node) => input.graph.nodes.some((existing) => existing.id === node.id))) {
    return { ok: false, code: "CHRONICLE_DUPLICATE" };
  }

  const nextGraph: ChronicleGraph = {
    ...input.graph,
    nodes: [...input.graph.nodes, ...newNodes],
    context: input.graph.context ? { ...input.graph.context } : undefined,
  };

  const validated = safeParseChronicleGraph(nextGraph);
  if (!validated.success) {
    return { ok: false, code: "CHRONICLE_INVALID" };
  }

  return { ok: true, graph: validated.data };
}
