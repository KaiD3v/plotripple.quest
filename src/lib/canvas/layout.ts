import { childrenByParent, nodeDepths } from "@/lib/canvas/graph-queries";
import type { NarrativeGraph, NarrativeNode } from "@/types/narrative-graph";

/**
 * Layout rule:
 * Causal levels always flow left to right.
 * Within a level, nodes stack top-to-bottom and stay top-aligned
 * (not vertically centered), so the origin stays near the top-left.
 * If a level exceeds MAX_SUBCOLUMN_NODES, it wraps into extra
 * sub-columns at the same depth. That keeps deep chronicles shorter
 * without overlapping nodes or introducing a second layout mode.
 */
export const MAP_PADDING_X = 48;
export const MAP_PADDING_Y = 36;
export const COLUMN_GAP = 72;
export const SUBCOLUMN_GAP = 28;
export const ROW_GAP = 24;
export const MAX_SUBCOLUMN_NODES = 6;

const NODE_SIZE = {
  decision: { width: 220, height: 176 },
  consequence: { width: 252, height: 138 },
  follow_up: { width: 236, height: 118 },
} as const;

export type LaidOutNode = {
  id: string;
  kind: NarrativeNode["kind"];
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
};

export type LaidOutEdge = {
  id: string;
  source: string;
  target: string;
  path: string;
};

export type ChronicleLayout = {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  width: number;
  height: number;
};

export function nodeSize(kind: NarrativeNode["kind"]): {
  width: number;
  height: number;
} {
  return NODE_SIZE[kind];
}

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length === 0) {
    return [];
  }
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

function bezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

export function layoutNarrativeGraph(graph: NarrativeGraph): ChronicleLayout {
  const depths = nodeDepths(graph);
  const children = childrenByParent(graph);
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const order: string[] = [];
  const visited = new Set<string>();
  const queue = [graph.rootNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);
    order.push(currentId);
    for (const childId of children.get(currentId) ?? []) {
      queue.push(childId);
    }
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      order.push(node.id);
    }
  }

  const columns = new Map<number, string[]>();
  for (const id of order) {
    const depth = depths.get(id) ?? 0;
    const column = columns.get(depth);
    if (column) {
      column.push(id);
    } else {
      columns.set(depth, [id]);
    }
  }

  const maxDepth = Math.max(0, ...depths.values());
  const positions = new Map<string, LaidOutNode>();
  let x = MAP_PADDING_X;

  for (let depth = 0; depth <= maxDepth; depth += 1) {
    const ids = columns.get(depth) ?? [];
    const subcolumns = chunk(ids, MAX_SUBCOLUMN_NODES);
    let groupWidth = 0;

    subcolumns.forEach((subcolumn, subIndex) => {
      let subWidth = 0;
      for (const id of subcolumn) {
        const node = nodeById.get(id);
        const size = nodeSize(node?.kind ?? "consequence");
        subWidth = Math.max(subWidth, size.width);
      }
      if (subIndex > 0) {
        groupWidth += SUBCOLUMN_GAP;
      }
      groupWidth += subWidth;
    });

    let subX = x;
    for (const subcolumn of subcolumns) {
      let subWidth = 0;
      for (const id of subcolumn) {
        const node = nodeById.get(id);
        const size = nodeSize(node?.kind ?? "consequence");
        subWidth = Math.max(subWidth, size.width);
      }

      let y = MAP_PADDING_Y;
      for (const id of subcolumn) {
        const node = nodeById.get(id);
        const size = nodeSize(node?.kind ?? "consequence");
        positions.set(id, {
          id,
          kind: node?.kind ?? "consequence",
          x: subX + (subWidth - size.width) / 2,
          y,
          width: size.width,
          height: size.height,
          depth,
        });
        y += size.height + ROW_GAP;
      }
      subX += subWidth + SUBCOLUMN_GAP;
    }

    x += groupWidth + COLUMN_GAP;
  }

  const laidNodes = [...positions.values()];
  const width =
    Math.max(
      ...laidNodes.map((node) => node.x + node.width),
      MAP_PADDING_X,
    ) + MAP_PADDING_X;
  const height =
    Math.max(
      ...laidNodes.map((node) => node.y + node.height),
      MAP_PADDING_Y,
    ) + MAP_PADDING_Y;

  const laidEdges: LaidOutEdge[] = graph.edges.flatMap((edge) => {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    if (!source || !target) {
      return [];
    }
    return [
      {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        path: bezierPath(
          source.x + source.width,
          source.y + source.height / 2,
          target.x,
          target.y + target.height / 2,
        ),
      },
    ];
  });

  return {
    nodes: laidNodes,
    edges: laidEdges,
    width,
    height,
  };
}
