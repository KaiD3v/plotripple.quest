"use client";

import { Copy, RefreshCw } from "lucide-react";
import { useState, type Ref } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatResultAsText } from "@/lib/format-result";
import { trackEvent } from "@/lib/analytics";
import type { GenerationResult } from "@/types/generator";
import { ConsequenceCard } from "@/components/generator/consequence-card";
import { EmptyResult } from "@/components/generator/empty-result";
import { ResultTimeline } from "@/components/generator/result-timeline";
import { SectionHeading } from "@/components/ui/section-heading";

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
  const mixed =
    !!result && new Set(result.consequences.map((item) => item.timeframe)).size > 1;
  const folioState = result
    ? pending
      ? " folio-updating"
      : ""
    : " folio-idle";

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
    <div ref={resultRef} tabIndex={-1} className="result-focus-target">
      <section
        aria-labelledby="result-heading"
        aria-live="polite"
        aria-busy={pending || undefined}
      >
        <div className={`folio p-4 sm:p-5${result ? " folio-reveal" : ""}${folioState}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionHeading
              id="result-heading"
              index="II"
              stepLabel={dictionary.workshop.stepReview}
              tone="folio"
            >
              {dictionary.result.title}
            </SectionHeading>
            {result ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyAll(result)}
                  className="inline-flex min-h-11 items-center gap-2 border border-bronze/50 px-3 text-sm text-parchment-ink"
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
                  className="inline-flex min-h-11 items-center gap-2 border border-bronze/35 px-3 text-sm text-parchment-ink disabled:opacity-80"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  {dictionary.result.regenerate}
                </button>
              </div>
            ) : null}
          </div>
          {pending && result ? (
            <p className="mt-2 text-sm text-bronze" role="status">
              {dictionary.generator.generating}
            </p>
          ) : null}
          {copyState === "failed" ? (
            <p className="mt-2 text-sm text-oxblood" role="status">
              {dictionary.result.copyFailed}
            </p>
          ) : null}

          {result ? (
            <>
              <div className="folio-summary mt-4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bronze">
                  {dictionary.result.summaryLabel}
                </p>
                <p className="folio-prose mt-2 break-words font-reading text-[1.05rem] leading-relaxed">
                  {result.summary}
                </p>
              </div>

              <div className="mt-5">
                <ResultTimeline mixed={mixed}>
                  {result.consequences.map((consequence, index) => (
                    <ConsequenceCard
                      key={`${consequence.title}-${index}`}
                      consequence={consequence}
                      dictionary={dictionary}
                    />
                  ))}
                </ResultTimeline>
              </div>
            </>
          ) : (
            <div className="folio-idle-body">
              <EmptyResult dictionary={dictionary} pending={pending} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
