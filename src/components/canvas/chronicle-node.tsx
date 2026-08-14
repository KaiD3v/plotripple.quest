import type { Ref } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { TimeframeMark } from "@/components/generator/timeframe-mark";
import { StatusMark } from "@/components/canvas/status-mark";
import {
  DETAILS_DIALOG_ID,
  DETAILS_PANEL_ID,
  nodeAccessibleName,
  nodeDomId,
  nodeKindLabel,
  type ChronicleSelectHandler,
} from "@/lib/canvas/selection";
import { nodeExcerpt } from "@/lib/canvas/graph-queries";
import type { NarrativeNode } from "@/types/narrative-graph";

export function ChronicleNodeButton({
  node,
  dictionary,
  selected,
  related,
  dimmed,
  variant,
  style,
  onSelect,
  buttonRef,
}: {
  node: NarrativeNode;
  dictionary: Dictionary;
  selected: boolean;
  related: boolean;
  dimmed: boolean;
  variant: "map" | "tree";
  style?: { left: number; top: number; width: number; height: number };
  onSelect: ChronicleSelectHandler;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  const kindClass =
    node.kind === "decision"
      ? "chronicle-seal"
      : node.kind === "follow_up"
        ? "chronicle-slip is-follow-up"
        : "chronicle-slip";
  const stateClass = [
    selected ? "is-selected" : "",
    related && !selected ? "is-related" : "",
    dimmed ? "is-dimmed" : "",
    node.kind !== "decision" ? `is-status-${node.status}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={buttonRef}
      type="button"
      id={nodeDomId(node.id, variant === "map" ? "map" : "tree")}
      data-chronicle-node={node.id}
      data-kind={node.kind}
      data-narrative-status={node.kind === "decision" ? undefined : node.status}
      className={`chronicle-node ${variant === "map" ? "is-map" : ""} ${kindClass} ${stateClass}`.trim()}
      style={
        variant === "map" && style
          ? {
              left: style.left,
              top: style.top,
              width: style.width,
              minHeight: style.height,
            }
          : undefined
      }
      aria-pressed={selected}
      aria-expanded={selected}
      aria-controls={`${DETAILS_PANEL_ID} ${DETAILS_DIALOG_ID}`}
      aria-label={nodeAccessibleName(node, dictionary)}
      onClick={(event) => onSelect(node.id, event.currentTarget)}
    >
      {node.kind === "decision" ? (
        <DecisionBody node={node} dictionary={dictionary} />
      ) : node.kind === "consequence" ? (
        <ConsequenceBody node={node} dictionary={dictionary} />
      ) : (
        <FollowUpBody node={node} dictionary={dictionary} />
      )}
    </button>
  );
}

function DecisionBody({
  node,
  dictionary,
}: {
  node: Extract<NarrativeNode, { kind: "decision" }>;
  dictionary: Dictionary;
}) {
  return (
    <>
      <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold">
        <SealRings />
        {dictionary.canvas.originHint}
      </span>
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-sage">
        {nodeKindLabel(node, dictionary)}
      </span>
      <span className="font-display text-base leading-snug text-bone">
        {nodeExcerpt(node, 110)}
      </span>
    </>
  );
}

function ConsequenceBody({
  node,
  dictionary,
}: {
  node: Extract<NarrativeNode, { kind: "consequence" }>;
  dictionary: Dictionary;
}) {
  return (
    <>
      <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-bronze">
        <TimeframeMark timeframe={node.timeframe} />
        {dictionary.result.timeframes[node.timeframe]} ·{" "}
        {dictionary.result.categories[node.category]}
      </span>
      <span className="font-display text-[1.02rem] leading-snug text-parchment-ink">
        {nodeExcerpt(node, 88)}
      </span>
      <span className="mt-1 inline-flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-bronze">
        <StatusMark status={node.status} />
        {dictionary.canvas.statuses[node.status]}
      </span>
    </>
  );
}

function FollowUpBody({
  node,
  dictionary,
}: {
  node: Extract<NarrativeNode, { kind: "follow_up" }>;
  dictionary: Dictionary;
}) {
  return (
    <>
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-bronze">
        {nodeKindLabel(node, dictionary)}
        {node.timeframe
          ? ` · ${dictionary.result.timeframes[node.timeframe]}`
          : ""}
      </span>
      <span className="font-display text-[1.02rem] leading-snug text-parchment-ink">
        {nodeExcerpt(node, 88)}
      </span>
      <span className="mt-1 inline-flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-bronze">
        <StatusMark status={node.status} />
        {dictionary.canvas.statuses[node.status]}
      </span>
    </>
  );
}

function SealRings() {
  return (
    <svg
      className="chronicle-seal-rings"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="3" fill="currentColor" />
      <circle
        cx="16"
        cy="16"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.85"
      />
      <circle
        cx="16"
        cy="16"
        r="11.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.45"
      />
    </svg>
  );
}
