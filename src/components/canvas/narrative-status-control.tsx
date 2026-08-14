"use client";

import type { KeyboardEvent } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { StatusMark } from "@/components/canvas/status-mark";
import { chronicleNodeStatuses } from "@/types/chronicle";
import type { NodeStatusUi } from "@/lib/chronicle/use-node-status";
import type { NarrativeNode } from "@/types/narrative-graph";

function safeToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function isStatusArrowKey(key: string): boolean {
  return (
    key === "ArrowRight" ||
    key === "ArrowDown" ||
    key === "ArrowLeft" ||
    key === "ArrowUp"
  );
}

export function NarrativeStatusControl({
  node,
  dictionary,
  statusUi,
  surface,
}: {
  node: NarrativeNode;
  dictionary: Dictionary;
  statusUi?: NodeStatusUi;
  surface: "desktop" | "mobile";
}) {
  if (!statusUi || (node.kind !== "consequence" && node.kind !== "follow_up")) {
    return null;
  }

  const currentStatus = statusUi.currentStatus(node.id) ?? node.status;
  const nodeToken = safeToken(node.id);
  const groupName = `${nodeToken}-narrative-status-${surface}`;
  const legendId = `${groupName}-legend`;
  const applyStatus = statusUi.setStatus;

  function focusStatusInput(status: (typeof chronicleNodeStatuses)[number]) {
    const inputId = `${nodeToken}-status-${status}-${surface}`;
    document.getElementById(inputId)?.focus();
  }

  function onRadioKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    status: (typeof chronicleNodeStatuses)[number],
  ) {
    if (!isStatusArrowKey(event.key)) {
      return;
    }
    // Keep native Space; handle arrows so focus + checked stay aligned even when
    // an ancestor or controlled update would interrupt the browser default.
    event.preventDefault();
    event.stopPropagation();
    const index = chronicleNodeStatuses.indexOf(status);
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextStatus =
      chronicleNodeStatuses[
        (index + delta + chronicleNodeStatuses.length) %
          chronicleNodeStatuses.length
      ];
    if (!nextStatus) {
      return;
    }
    focusStatusInput(nextStatus);
    applyStatus(node.id, nextStatus);
  }

  return (
    <fieldset
      className="mt-4 grid gap-2 border-0 p-0"
      data-status-control={node.id}
      data-status-surface={surface}
    >
      <legend
        id={legendId}
        className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-bronze"
      >
        {dictionary.canvas.narrativeStatusLabel}
      </legend>
      {statusUi.error ? (
        <p className="text-sm text-oxblood" role="alert">
          {statusUi.error}
        </p>
      ) : null}
      <div className="grid gap-2" role="presentation">
        {chronicleNodeStatuses.map((status) => {
          const inputId = `${nodeToken}-status-${status}-${surface}`;
          const selected = currentStatus === status;
          const localizedLabel = dictionary.canvas.statuses[status];
          return (
            <div
              key={status}
              className={`inline-flex min-h-11 items-center gap-2 border px-3 text-sm ${
                selected
                  ? "border-gold/70 text-parchment-ink"
                  : "border-bronze/45 text-parchment-ink"
              }`}
            >
              <input
                id={inputId}
                type="radio"
                name={groupName}
                value={status}
                checked={selected}
                className="sr-only"
                onChange={() => {
                  applyStatus(node.id, status);
                }}
                onKeyDown={(event) => {
                  onRadioKeyDown(event, status);
                }}
              />
              <label
                htmlFor={inputId}
                className="inline-flex min-h-11 flex-1 cursor-pointer items-center gap-2"
              >
                <StatusMark status={status} />
                <span>{localizedLabel}</span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
