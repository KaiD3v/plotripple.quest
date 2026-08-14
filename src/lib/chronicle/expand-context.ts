import { canExpandChronicleNode } from "@/lib/chronicle/can-expand";
import {
  chronicleChildren,
  chroniclePathTo,
  chronicleRoot,
} from "@/lib/chronicle/graph-helpers";
import {
  EXPAND_EXISTING_TITLE_MAX,
  EXPAND_EXISTING_TITLES_MAX,
} from "@/lib/chronicle/limits";
import type { Locale } from "@/i18n/config";
import {
  expandRippleRequestSchema,
  type ExpandRippleRequestParsed,
} from "@/schemas/follow-up";
import type { ChronicleErrorCode, ChronicleGraph } from "@/types/chronicle";

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function normalizeExpandExistingTitles(titles: string[]): string[] {
  return titles
    .map((title) => clip(title, EXPAND_EXISTING_TITLE_MAX))
    .filter((title, index, all) => all.indexOf(title) === index)
    .slice(0, EXPAND_EXISTING_TITLES_MAX);
}

export type ExpandRippleRequestBuild =
  | { ok: true; request: ExpandRippleRequestParsed }
  | { ok: false; code: ChronicleErrorCode | "VALIDATION_ERROR" };

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
  const existingTitles = normalizeExpandExistingTitles([
    ...path.map((node) => node.title),
    ...siblingTitles,
  ]);

  const candidate = {
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
    existingTitles,
  };

  const parsed = expandRippleRequestSchema.safeParse(candidate);
  if (!parsed.success) {
    console.error("expand_request_invalid", {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
      })),
    });
    return { ok: false, code: "VALIDATION_ERROR" };
  }

  return {
    ok: true,
    request: parsed.data,
  };
}
