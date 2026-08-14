"use client";

import { useCallback, useEffect, useRef } from "react";
import { nextFocusIndex } from "@/lib/canvas/viewport";
import { restoreFocusAfterUnmount } from "@/lib/canvas/dialog-focus";

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  trigger,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  trigger: HTMLElement | null;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const cancel = useCallback(() => {
    onCancel();
    restoreFocusAfterUnmount(trigger);
  }, [onCancel, trigger]);

  useEffect(() => {
    cancelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        cancel();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) => !element.hasAttribute("disabled") && element.tabIndex !== -1,
      );
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
  }, [cancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-deep/70 p-4 sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
        className="w-full max-w-md border border-bronze/45 bg-surface p-4 sm:p-5"
      >
        <h2
          id="confirm-dialog-title"
          className="font-display text-xl text-bone"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-body"
          className="mt-2 text-sm leading-relaxed text-lichen"
        >
          {body}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className="inline-flex min-h-11 items-center border border-bronze/45 px-3 text-sm text-parchment-ink"
            onClick={cancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center border border-oxblood/60 px-3 text-sm text-parchment-ink"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
