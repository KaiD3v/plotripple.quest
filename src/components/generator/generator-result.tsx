"use client";

import { Copy, Map, RefreshCw } from "lucide-react";
import { useState, type Ref } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { formatResultAsText } from "@/lib/format-result";
import { trackEvent } from "@/lib/analytics";
import type { GenerationResult } from "@/types/generator";
import { ConsequenceCard } from "@/components/generator/consequence-card";
import { EmptyResult } from "@/components/generator/empty-result";
import { ExampleResultPreview } from "@/components/generator/example-result-preview";
import { ResultTimeline } from "@/components/generator/result-timeline";
import { SectionHeading } from "@/components/ui/section-heading";

export function GeneratorResult({
  result,
  dictionary,
  pending,
  locale,
  resultRef,
  canvasReady = false,
  onExploreMap,
  onRegenerate,
  onUseExample,
}: {
  result: GenerationResult | null;
  dictionary: Dictionary;
  pending: boolean;
  locale: Locale;
  resultRef?: Ref<HTMLDivElement>;
  canvasReady?: boolean;
  onExploreMap?: () => void;
  onRegenerate: () => void;
  onUseExample: (decision: string) => void;
}) {
  const [copyFeedback, setCopyFeedback] = useState<{
    result: GenerationResult | null;
    status: "idle" | "copied" | "failed";
  }>({ result: null, status: "idle" });
  const copyState =
    result !== null && copyFeedback.result === result
      ? copyFeedback.status
      : "idle";
  const mixed =
    !!result && new Set(result.consequences.map((item) => item.timeframe)).size > 1;
  const folioState = result
    ? pending
      ? " folio-updating"
      : ""
    : " folio-idle";
  const statusAnnouncement = pending
    ? dictionary.generator.generating
    : copyState === "failed"
      ? dictionary.result.copyFailed
      : result
        ? dictionary.result.ready
        : "";
  const consequenceCount = result
    ? dictionary.result.consequenceCount.replace(
        "{count}",
        String(result.consequences.length),
      )
    : null;

  async function copyAll(currentResult: GenerationResult) {
    const text = formatResultAsText(currentResult, dictionary);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback({ result: currentResult, status: "copied" });
      trackEvent("result_copy", { locale });
    } catch {
      setCopyFeedback({ result: currentResult, status: "failed" });
    }
  }

  return (
    <div ref={resultRef} tabIndex={-1} className="result-focus-target">
      <section
        aria-labelledby="result-heading"
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
            ) : null}
          </div>
          <div id="result-status" className="sr-only" role="status">
            {statusAnnouncement}
          </div>
          {pending && result ? (
            <p className="mt-2 text-sm text-bronze">
              {dictionary.generator.generating}
            </p>
          ) : null}
          {copyState === "failed" ? (
            <p className="mt-2 text-sm text-oxblood">
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
                {consequenceCount ? (
                  <p className="mt-3 text-sm text-bronze">{consequenceCount}</p>
                ) : null}
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

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  disabled={pending || !canvasReady || !onExploreMap}
                  onClick={() => onExploreMap?.()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-gold/70 bg-gold/15 px-4 text-sm font-semibold text-parchment-ink disabled:opacity-60"
                >
                  <Map className="h-4 w-4" aria-hidden="true" />
                  {dictionary.result.exploreMap}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={onRegenerate}
                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-bronze/35 px-4 text-sm text-parchment-ink disabled:opacity-80"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  {dictionary.result.regenerate}
                </button>
              </div>
            </>
          ) : (
            <div className={pending ? "folio-idle-body" : "folio-example-body"}>
              {pending ? (
                <EmptyResult dictionary={dictionary} pending />
              ) : (
                <ExampleResultPreview
                  locale={locale}
                  dictionary={dictionary}
                  onUseExample={onUseExample}
                />
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
