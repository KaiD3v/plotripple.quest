import { canExpandChronicleNode } from "@/lib/chronicle/can-expand";
import {
  chronicleChildren,
  chroniclePathTo,
  chronicleRoot,
} from "@/lib/chronicle/graph-helpers";
import type { Locale } from "@/i18n/config";
import type { ExpandRippleRequestParsed } from "@/schemas/follow-up";
import type { ChronicleErrorCode, ChronicleGraph } from "@/types/chronicle";

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export type ExpandRippleRequestBuild =
  | { ok: true; request: ExpandRippleRequestParsed }
  | { ok: false; code: ChronicleErrorCode };

export function buildExpandRippleRequest(
  graph: ChronicleGraph,
  parentNodeId: string,
  locale: Locale,
): ExpandRippleRequestBuild {
  const gate = canExpandChronicleNode(graph, parentNodeId);
  if (!gate.ok) {
    return gate;
  }

  const root = chronicleRoot(graph);
  const path = chroniclePathTo(graph, parentNodeId);
  const selected = path[path.length - 1];
  if (!root || !selected) {
    return { ok: false, code: "CHRONICLE_NODE_MISSING" };
  }

  const siblingTitles = selected.parentId
    ? chronicleChildren(graph, selected.parentId).map((node) => node.title)
    : [];
  const existingTitles = [
    ...path.map((node) => node.title),
    ...siblingTitles,
  ].filter((title, index, all) => all.indexOf(title) === index);

  return {
    ok: true,
    request: {
      locale: graph.context?.locale ?? locale,
      tone: graph.context?.tone,
      intensity: graph.context?.intensity,
      setting: graph.context?.setting,
      chronicleTitle: graph.title,
      originTitle: root.title,
      originDescription: root.description || undefined,
      selected: {
        title: selected.title,
        description: selected.description,
        timeframe: selected.timeframe,
        category: selected.category,
        trigger: selected.trigger,
        affectedParties: selected.affectedParties,
      },
      path: path.map((node) => ({
        title: node.title,
        excerpt: node.description ? clip(node.description, 400) : undefined,
      })),
      existingTitles: existingTitles.slice(0, 24),
    },
  };
}
