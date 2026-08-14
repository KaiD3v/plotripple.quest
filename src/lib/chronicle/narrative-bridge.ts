import type { Locale } from "@/i18n/config";
import { NARRATIVE_GRAPH_VERSION } from "@/schemas/narrative-graph";
import { safeParseChronicleGraph } from "@/schemas/chronicle";
import type { ChronicleGraph, ChronicleNode } from "@/types/chronicle";
import type {
  ConsequenceNode,
  DecisionNode,
  FollowUpNode,
  NarrativeEdge,
  NarrativeGraph,
  NarrativeNode,
} from "@/types/narrative-graph";
import { resolveChronicleNodeStatus } from "@/lib/chronicle/node-status";
import { nodeDepths } from "@/lib/canvas/graph-queries";

const DEFAULT_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export function narrativeGraphToChronicleGraph(
  graph: NarrativeGraph,
): ChronicleGraph {
  const depths = nodeDepths(graph);
  const parents = new Map<string, string>();
  for (const edge of graph.edges) {
    if (!parents.has(edge.target)) {
      parents.set(edge.target, edge.source);
    }
  }

  const nodes: ChronicleNode[] = graph.nodes.map((node) => {
    const depth = depths.get(node.id) ?? 0;
    const parentId = parents.get(node.id) ?? null;

    if (node.kind === "decision") {
      return {
        id: node.id,
        type: depth === 0 ? "origin" : "decision",
        title: node.label,
        description: node.summary ?? "",
        parentId,
        depth,
      };
    }

    if (node.kind === "follow_up") {
      return {
        id: node.id,
        type: "follow_up",
        title: node.title,
        description: node.note,
        parentId,
        depth,
        timeframe: node.timeframe,
        status: node.status,
      };
    }

    return {
      id: node.id,
      type: "consequence",
      title: node.title,
      description: node.description,
      parentId,
      depth,
      timeframe: node.timeframe,
      category: node.category,
      trigger: node.trigger,
      affectedParties: [...node.affectedParties],
      status: node.status,
    };
  });

  return {
    version: 1,
    title: graph.title,
    nodes,
  };
}

export function chronicleGraphToNarrativeGraph(
  chronicle: ChronicleGraph,
  locale: Locale,
): NarrativeGraph {
  const validated = safeParseChronicleGraph(chronicle);
  if (!validated.success) {
    throw new Error("Invalid chronicle graph");
  }

  const graph = validated.data;
  const root =
    graph.nodes.find((node) => node.type === "origin" && node.parentId === null) ??
    graph.nodes.find((node) => node.type === "decision" && node.parentId === null) ??
    graph.nodes.find((node) => node.parentId === null);

  if (!root) {
    throw new Error("Chronicle graph is missing a root node");
  }

  const nodes: NarrativeNode[] = graph.nodes.map((node) => {
    if (node.type === "origin" || node.type === "decision") {
      const decision: DecisionNode = {
        id: node.id,
        kind: "decision",
        label: node.title,
        summary: node.description || undefined,
      };
      return decision;
    }

    if (node.type === "follow_up") {
      const followUp: FollowUpNode = {
        id: node.id,
        kind: "follow_up",
        title: node.title,
        note: node.description || node.title,
        status: resolveChronicleNodeStatus(node.status),
        timeframe: node.timeframe,
      };
      return followUp;
    }

    const consequence: ConsequenceNode = {
      id: node.id,
      kind: "consequence",
      title: node.title,
      description: node.description || node.title,
      timeframe: node.timeframe ?? "immediate",
      category: node.category ?? "social",
      trigger: node.trigger ?? (node.description || node.title),
      affectedParties:
        node.affectedParties && node.affectedParties.length > 0
          ? node.affectedParties
          : ["the table"],
      status: resolveChronicleNodeStatus(node.status),
    };
    return consequence;
  });

  const edges: NarrativeEdge[] = graph.nodes.flatMap((node) => {
    if (!node.parentId) {
      return [];
    }
    return [
      {
        id: `${node.parentId}->${node.id}`,
        source: node.parentId,
        target: node.id,
      },
    ];
  });

  return {
    id: graph.id || root.id.split(":")[0] || root.id,
    version: NARRATIVE_GRAPH_VERSION,
    locale,
    title: graph.title,
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    rootNodeId: root.id,
    nodes,
    edges,
  };
}

export function canvasGraphFromChronicle(
  chronicle: ChronicleGraph,
  locale: Locale,
): NarrativeGraph | null {
  try {
    return chronicleGraphToNarrativeGraph(chronicle, locale);
  } catch {
    return null;
  }
}

export function narrativeGraphThroughChronicle(
  graph: NarrativeGraph,
): NarrativeGraph {
  const chronicle = narrativeGraphToChronicleGraph(graph);
  const validated = safeParseChronicleGraph(chronicle);
  if (!validated.success) {
    throw new Error("Chronicle graph is invalid");
  }
  const next = chronicleGraphToNarrativeGraph(validated.data, graph.locale);
  return {
    ...next,
    id: graph.id,
    createdAt: graph.createdAt,
    updatedAt: graph.updatedAt,
    locale: graph.locale,
    rootNodeId: graph.rootNodeId,
  };
}
