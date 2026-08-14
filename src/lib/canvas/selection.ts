import type { Dictionary } from "@/i18n/get-dictionary";
import { nodeExcerpt, nodeTitle } from "@/lib/canvas/graph-queries";
import type { NarrativeNode } from "@/types/narrative-graph";

export type ChronicleSelectHandler = (
  nodeId: string,
  trigger?: HTMLElement | null,
) => void;

export const DETAILS_PANEL_ID = "chronicle-details";
export const DETAILS_DIALOG_ID = "chronicle-details-dialog";
export const DETAILS_DIALOG_TITLE_ID = "chronicle-details-dialog-title";
export const DETAILS_DIALOG_DESC_ID = "chronicle-details-dialog-desc";
export const SELECTION_LIVE_ID = "chronicle-selection-live";

export function nodeDomId(
  nodeId: string,
  surface?: "map" | "tree",
): string {
  const base = `chronicle-node-${nodeId.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
  return surface ? `${surface}-${base}` : base;
}

export function scrollNodeIntoViewIfNeeded(nodeId: string): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return false;
  }
  const element = document.getElementById(nodeDomId(nodeId, "tree"));
  if (!element) {
    return false;
  }
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  if (rect.bottom < 72 || rect.top > viewportHeight - 72) {
    if (typeof element.scrollIntoView !== "function") {
      return false;
    }
    element.scrollIntoView({ block: "nearest", inline: "nearest" });
    return true;
  }
  return false;
}

export function focusVisibleNode(nodeId: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(
      `[data-chronicle-node="${nodeId.replace(/"/g, "")}"]`,
    ),
  );
  const visible = nodes.find((element) => element.getClientRects().length > 0);
  const target = visible ?? nodes[0];
  target?.focus();
  return Boolean(target);
}

export function nodeKindLabel(
  node: NarrativeNode,
  dictionary: Dictionary,
): string {
  if (node.kind === "decision") {
    return dictionary.canvas.decisionLabel;
  }
  if (node.kind === "follow_up") {
    return dictionary.canvas.followUpLabel;
  }
  return dictionary.canvas.consequenceLabel;
}

export function nodeAccessibleName(
  node: NarrativeNode,
  dictionary: Dictionary,
): string {
  const base = `${nodeKindLabel(node, dictionary)}: ${nodeExcerpt(node, 120)}`;
  if (node.kind === "decision") {
    return base;
  }
  return `${base}. ${dictionary.canvas.narrativeStatusLabel}: ${dictionary.canvas.statuses[node.status]}`;
}

export function selectionAnnouncement(
  node: NarrativeNode | null,
  dictionary: Dictionary,
): string {
  if (!node) {
    return "";
  }
  return dictionary.canvas.selectedAnnouncement.replace(
    "{label}",
    `${nodeKindLabel(node, dictionary)} — ${nodeTitle(node)}`,
  );
}

export function handleCanvasEscape(
  key: string,
  selectedId: string | null,
): { close: boolean; focusNodeId: string | null } {
  if (key !== "Escape" || !selectedId) {
    return { close: false, focusNodeId: null };
  }
  return { close: true, focusNodeId: selectedId };
}

export { clampZoom } from "@/lib/canvas/viewport";
