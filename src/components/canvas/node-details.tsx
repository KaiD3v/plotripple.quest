import type { Ref } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { TimeframeMark } from "@/components/generator/timeframe-mark";
import {
  DETAILS_PANEL_ID,
  nodeKindLabel,
} from "@/lib/canvas/selection";
import { ExploreRippleAction } from "@/components/canvas/explore-ripple-action";
import { NarrativeStatusControl } from "@/components/canvas/narrative-status-control";
import type { ExploreRippleUi } from "@/lib/chronicle/use-explore-ripple";
import type { NodeStatusUi } from "@/lib/chronicle/use-node-status";
import type { NarrativeNode } from "@/types/narrative-graph";

export function NodeDetailsBody({
  node,
  dictionary,
  onClose,
  onCenterNode,
  closeRef,
  titleId,
  explore,
  statusUi,
  statusSurface,
}: {
  node: NarrativeNode;
  dictionary: Dictionary;
  onClose: () => void;
  onCenterNode?: () => void;
  closeRef?: Ref<HTMLButtonElement>;
  titleId: string;
  explore?: ExploreRippleUi;
  statusUi?: NodeStatusUi;
  statusSurface: "desktop" | "mobile";
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-bronze">
            {dictionary.canvas.detailsTitle}
          </p>
          <h2
            id={titleId}
            className="mt-1 break-words font-display text-xl leading-snug text-parchment-ink"
          >
            {node.kind === "decision" ? node.label : node.title}
          </h2>
        </div>
        <button
          ref={closeRef}
          type="button"
          className="inline-flex min-h-11 shrink-0 items-center border border-bronze/45 px-3 text-sm text-parchment-ink"
          onClick={onClose}
        >
          {dictionary.canvas.closeDetails}
        </button>
      </div>

      <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-bronze">
        {nodeKindLabel(node, dictionary)}
        {node.kind === "decision" ? ` · ${dictionary.canvas.originHint}` : ""}
      </p>

      {onCenterNode ? (
        <button
          type="button"
          className="mt-3 inline-flex min-h-11 items-center border border-bronze/45 px-3 text-sm text-parchment-ink"
          onClick={onCenterNode}
        >
          {dictionary.canvas.centerOnNode}
        </button>
      ) : null}

      {node.kind === "decision" ? (
        <p className="folio-prose mt-3 break-words font-reading text-[1.02rem] leading-relaxed">
          {node.summary ?? node.label}
        </p>
      ) : null}

      {node.kind === "consequence" ? (
        <ConsequenceDetails node={node} dictionary={dictionary} />
      ) : null}

      {node.kind === "follow_up" ? (
        <FollowUpDetails node={node} dictionary={dictionary} />
      ) : null}

      <NarrativeStatusControl
        node={node}
        dictionary={dictionary}
        statusUi={statusUi}
        surface={statusSurface}
      />

      {explore ? (
        <ExploreRippleAction
          nodeId={node.id}
          dictionary={dictionary}
          explore={explore}
        />
      ) : null}
    </>
  );
}

export function DesktopNodeDetails({
  node,
  dictionary,
  onClose,
  onCenterNode,
  explore,
  statusUi,
}: {
  node: NarrativeNode;
  dictionary: Dictionary;
  onClose: () => void;
  onCenterNode: () => void;
  explore?: ExploreRippleUi;
  statusUi?: NodeStatusUi;
}) {
  return (
    <section
      id={DETAILS_PANEL_ID}
      className="chronicle-details chronicle-details-desktop p-4 sm:p-5"
      aria-labelledby={`${DETAILS_PANEL_ID}-title`}
      data-details-panel="desktop"
    >
      <NodeDetailsBody
        node={node}
        dictionary={dictionary}
        onClose={onClose}
        onCenterNode={onCenterNode}
        titleId={`${DETAILS_PANEL_ID}-title`}
        explore={explore}
        statusUi={statusUi}
        statusSurface="desktop"
      />
    </section>
  );
}

function ConsequenceDetails({
  node,
  dictionary,
}: {
  node: Extract<NarrativeNode, { kind: "consequence" }>;
  dictionary: Dictionary;
}) {
  return (
    <div className="mt-4 grid gap-3">
      <p className="folio-prose break-words font-reading text-[1.02rem] leading-relaxed">
        {node.description}
      </p>
      <p className="break-words text-[0.9375rem] leading-relaxed">
        <span className="font-semibold">{dictionary.result.triggerLabel}: </span>
        {node.trigger}
      </p>
      <p className="break-words text-[0.9375rem] leading-relaxed">
        <span className="font-semibold">{dictionary.result.affectedLabel}: </span>
        {node.affectedParties.join(", ")}
      </p>
      <p className="flex flex-wrap items-center gap-2 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-bronze">
        <TimeframeMark timeframe={node.timeframe} />
        {dictionary.result.timeframes[node.timeframe]} ·{" "}
        {dictionary.result.categories[node.category]}
      </p>
    </div>
  );
}

function FollowUpDetails({
  node,
  dictionary,
}: {
  node: Extract<NarrativeNode, { kind: "follow_up" }>;
  dictionary: Dictionary;
}) {
  return (
    <div className="mt-4 grid gap-3">
      <p className="folio-prose break-words font-reading text-[1.02rem] leading-relaxed">
        {node.note}
      </p>
      {node.timeframe ? (
        <p className="flex flex-wrap items-center gap-2 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-bronze">
          <TimeframeMark timeframe={node.timeframe} />
          {dictionary.result.timeframes[node.timeframe]}
        </p>
      ) : null}
    </div>
  );
}
