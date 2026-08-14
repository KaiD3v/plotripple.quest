import type { ChronicleGraph } from "@/types/chronicle";

export function resolveChronicleGraphId(graph: ChronicleGraph): string | undefined {
  const explicit = graph.id?.trim();
  if (explicit) {
    return explicit.slice(0, 80);
  }

  const root = graph.nodes.find((node) => node.parentId === null);
  if (!root) {
    return undefined;
  }

  const prefix = root.id.split(":")[0]?.trim();
  if (prefix && prefix !== root.id) {
    return prefix.slice(0, 80);
  }

  return undefined;
}
