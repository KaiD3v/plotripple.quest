"use client";

import { useEffect, useRef } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { NodeDetailsBody } from "@/components/canvas/node-details";
import {
  DETAILS_DIALOG_DESC_ID,
  DETAILS_DIALOG_ID,
  DETAILS_DIALOG_TITLE_ID,
} from "@/lib/canvas/selection";
import { nextFocusIndex } from "@/lib/canvas/viewport";
import type { ExploreRippleUi } from "@/lib/chronicle/use-explore-ripple";
import type { NodeStatusUi } from "@/lib/chronicle/use-node-status";
import type { NarrativeNode } from "@/types/narrative-graph";

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) => !element.hasAttribute("disabled") && element.tabIndex !== -1,
  );
}

export function MobileDetailsDialog({
  node,
  dictionary,
  onClose,
  explore,
  statusUi,
}: {
  node: NarrativeNode;
  dictionary: Dictionary;
  onClose: () => void;
  explore?: ExploreRippleUi;
  statusUi?: NodeStatusUi;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    if (!media.matches) {
      return;
    }

    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (!media.matches) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }
      const focusable = getFocusable(dialogRef.current);
      if (focusable.length === 0) {
        return;
      }
      const currentIndex = Math.max(
        0,
        focusable.indexOf(document.activeElement as HTMLElement),
      );
      event.preventDefault();
      focusable[
        nextFocusIndex(currentIndex, focusable.length, event.shiftKey)
      ]?.focus();
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [node.id, onClose]);

  return (
    <div className="lg:hidden" data-details-panel="mobile">
      <div className="chronicle-dialog-backdrop" aria-hidden="true" />
      <div
        ref={dialogRef}
        id={DETAILS_DIALOG_ID}
        className="chronicle-dialog chronicle-details"
        role="dialog"
        aria-modal="true"
        aria-labelledby={DETAILS_DIALOG_TITLE_ID}
        aria-describedby={DETAILS_DIALOG_DESC_ID}
        tabIndex={-1}
      >
        <p id={DETAILS_DIALOG_DESC_ID} className="sr-only">
          {dictionary.canvas.detailsDescription}
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <NodeDetailsBody
            node={node}
            dictionary={dictionary}
            onClose={onClose}
            closeRef={closeRef}
            titleId={DETAILS_DIALOG_TITLE_ID}
            explore={explore}
            statusUi={statusUi}
            statusSurface="mobile"
          />
        </div>
      </div>
    </div>
  );
}
