"use client";

import { Copy, RefreshCw } from "lucide-react";
import { useState, type Ref } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatResultAsText } from "@/lib/format-result";
import { trackEvent } from "@/lib/analytics";
import type { GenerationResult } from "@/types/generator";
import { ConsequenceCard } from "@/components/generator/consequence-card";

export function GeneratorResult({
  result,
  dictionary,
  pending,
  resultRef,
  onRegenerate,
}: {
  result: GenerationResult | null;
  dictionary: Dictionary;
  pending: boolean;
  resultRef?: Ref<HTMLDivElement>;
  onRegenerate: () => void;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  async function copyAll(currentResult: GenerationResult) {
    const text = formatResultAsText(currentResult, dictionary);
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      trackEvent("result_copy");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div ref={resultRef} tabIndex={-1} className="outline-none">
    <section
      aria-labelledby="result-heading"
      aria-live="polite"
      aria-busy={pending || undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="result-heading" className="font-display text-2xl text-gold">
          {dictionary.result.title}
        </h2>
        {result ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyAll(result)}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-gold-dim px-3 text-sm text-gold"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copyState === "copied"
                ? dictionary.result.copied
                : dictionary.result.copy}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                trackEvent("result_regenerate");
                onRegenerate();
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-moss/60 px-3 text-sm text-mist disabled:opacity-70"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {dictionary.result.regenerate}
            </button>
          </div>
        ) : null}
      </div>
      {copyState === "failed" ? (
        <p className="mt-2 text-sm text-danger" role="status">
          {dictionary.result.copyFailed}
        </p>
      ) : null}

      {result ? (
        <>
          <div className="parchment-card mt-4 rounded-sm p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-gold-dim">
              {dictionary.result.summaryLabel}
            </p>
            <p className="mt-2 break-words leading-relaxed">{result.summary}</p>
          </div>

          <div className="mt-4 grid gap-4">
            {result.consequences.map((consequence, index) => (
              <ConsequenceCard
                key={`${consequence.title}-${index}`}
                consequence={consequence}
                dictionary={dictionary}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="mt-3 text-mist-dim">
          {pending ? dictionary.generator.generating : dictionary.result.empty}
        </p>
      )}
    </section>
    </div>
  );
}
