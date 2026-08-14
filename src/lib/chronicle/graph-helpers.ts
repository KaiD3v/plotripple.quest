import type { ChronicleGraph, ChronicleNode } from "@/types/chronicle";

export function chronicleNodeById(
  graph: ChronicleGraph,
  nodeId: string,
): ChronicleNode | undefined {
  return graph.nodes.find((node) => node.id === nodeId);
}

export function chronicleChildren(
  graph: ChronicleGraph,
  parentId: string,
): ChronicleNode[] {
  return graph.nodes.filter((node) => node.parentId === parentId);
}

export function chronicleRoot(graph: ChronicleGraph): ChronicleNode | undefined {
  return (
    graph.nodes.find((node) => node.type === "origin" && node.parentId === null) ??
    graph.nodes.find((node) => node.type === "decision" && node.parentId === null) ??
    graph.nodes.find((node) => node.parentId === null)
  );
}

export function chroniclePathTo(
  graph: ChronicleGraph,
  nodeId: string,
): ChronicleNode[] {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const path: ChronicleNode[] = [];
  const seen = new Set<string>();
  let current = byId.get(nodeId);

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path;
}

export function normalizeChronicleTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
