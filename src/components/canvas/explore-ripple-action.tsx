"use client";

import { useEffect, useRef } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ExploreRippleUi } from "@/lib/chronicle/use-explore-ripple";

export function ExploreRippleAction({
  nodeId,
  dictionary,
  explore,
}: {
  nodeId: string;
  dictionary: Dictionary;
  explore: ExploreRippleUi;
}) {
  const exploredRef = useRef<HTMLParagraphElement>(null);
  const state = explore.getState(nodeId);

  useEffect(() => {
    if (state.mode === "explored") {
      exploredRef.current?.focus();
    }
  }, [state.mode]);

  if (state.mode === "hidden") {
    return null;
  }

  if (state.mode === "explored") {
    return (
      <p
        ref={exploredRef}
        tabIndex={-1}
        role="status"
        className="mt-4 text-sm text-bronze"
      >
        {dictionary.canvas.branchExplored}
      </p>
    );
  }

  if (state.mode === "disabled" && state.reason) {
    return (
      <p className="mt-4 text-sm text-bronze" role="status">
        {state.reason}
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-2">
      {explore.error && state.mode !== "loading" ? (
        <p className="text-sm text-oxblood" role="alert">
          {explore.error}
        </p>
      ) : null}
      <button
        type="button"
        className="inline-flex min-h-11 items-center border border-bronze/45 px-3 text-sm text-parchment-ink disabled:opacity-60"
        disabled={state.mode !== "available"}
        aria-busy={state.mode === "loading" || undefined}
        onClick={() => {
          void explore.explore(nodeId);
        }}
      >
        {state.mode === "loading"
          ? dictionary.canvas.exploringRipple
          : explore.error
            ? dictionary.canvas.tryAgain
            : dictionary.canvas.exploreRipple}
      </button>
    </div>
  );
}
