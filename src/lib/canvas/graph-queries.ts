import type {
  NarrativeGraph,
  NarrativeNode,
} from "@/types/narrative-graph";

export function getNodeMap(
  graph: NarrativeGraph,
): Map<string, NarrativeNode> {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

export function getNode(
  graph: NarrativeGraph,
  nodeId: string,
): NarrativeNode | undefined {
  return graph.nodes.find((node) => node.id === nodeId);
}

export function childrenByParent(
  graph: NarrativeGraph,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const current = map.get(edge.source);
    if (current) {
      current.push(edge.target);
    } else {
      map.set(edge.source, [edge.target]);
    }
  }
  return map;
}

export function parentsByChild(
  graph: NarrativeGraph,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const current = map.get(edge.target);
    if (current) {
      current.push(edge.source);
    } else {
      map.set(edge.target, [edge.source]);
    }
  }
  return map;
}

export function nodeDepths(graph: NarrativeGraph): Map<string, number> {
  const depths = new Map<string, number>();
  const children = childrenByParent(graph);
  const queue = [graph.rootNodeId];
  depths.set(graph.rootNodeId, 0);

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      break;
    }
    const depth = depths.get(currentId) ?? 0;
    for (const childId of children.get(currentId) ?? []) {
      const existing = depths.get(childId);
      if (existing === undefined || depth + 1 > existing) {
        depths.set(childId, depth + 1);
        queue.push(childId);
      }
    }
  }

  for (const node of graph.nodes) {
    if (!depths.has(node.id)) {
      depths.set(node.id, 0);
    }
  }

  return depths;
}

export function relatedPathIds(
  graph: NarrativeGraph,
  selectedId: string,
): { nodes: Set<string>; edges: Set<string> } {
  const nodes = new Set<string>([selectedId]);
  const edges = new Set<string>();
  const parents = parentsByChild(graph);
  const children = childrenByParent(graph);

  const up = [selectedId];
  while (up.length > 0) {
    const currentId = up.pop();
    if (!currentId) {
      break;
    }
    for (const parentId of parents.get(currentId) ?? []) {
      if (!nodes.has(parentId)) {
        nodes.add(parentId);
        up.push(parentId);
      }
      const edge = graph.edges.find(
        (item) => item.source === parentId && item.target === currentId,
      );
      if (edge) {
        edges.add(edge.id);
      }
    }
  }

  const down = [selectedId];
  while (down.length > 0) {
    const currentId = down.shift();
    if (!currentId) {
      break;
    }
    for (const childId of children.get(currentId) ?? []) {
      if (!nodes.has(childId)) {
        nodes.add(childId);
        down.push(childId);
      }
      const edge = graph.edges.find(
        (item) => item.source === currentId && item.target === childId,
      );
      if (edge) {
        edges.add(edge.id);
      }
    }
  }

  return { nodes, edges };
}

export function nodeTitle(node: NarrativeNode): string {
  if (node.kind === "decision") {
    return node.label;
  }
  return node.title;
}

export function nodeExcerpt(node: NarrativeNode, maxLength = 90): string {
  const text = node.kind === "decision" ? node.label : node.title;
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
