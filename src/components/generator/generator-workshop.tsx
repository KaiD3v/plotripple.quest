"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { durationBucket, trackEvent } from "@/lib/analytics";
import {
  createHistoryEntry,
  getHistorySnapshot,
  getServerHistorySnapshot,
  prependHistoryEntry,
  saveHistory,
  subscribeHistory,
} from "@/lib/local-history";
import { bringResultIntoView } from "@/lib/scroll-to-result";
import {
  EVENT_DESCRIPTION_MAX,
  EVENT_DESCRIPTION_MIN,
  generatorInputSchema,
  type GeneratorInputParsed,
} from "@/schemas/generator";
import type { ApiErrorBody, GenerationResult } from "@/types/generator";
import { GeneratorForm } from "@/components/generator/generator-form";
import { GeneratorResult } from "@/components/generator/generator-result";
import { GenerationHistory } from "@/components/generator/generation-history";
import { GeneratorWorkshopLayout } from "@/components/generator/generator-workshop-layout";

const defaultValues: Omit<GeneratorInputParsed, "turnstileToken" | "locale"> = {
  eventDescription: "",
  tone: "mysterious",
  intensity: "moderate",
  setting: "fantasy",
  timeframe: "mixed",
  count: 3,
};

export function GeneratorWorkshop({
  locale,
  dictionary,
  turnstileSiteKey,
}: {
  locale: Locale;
  dictionary: Dictionary;
  turnstileSiteKey?: string;
}) {
  const [values, setValues] = useState({ ...defaultValues, locale });
  const [turnstileToken, setTurnstileToken] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const history = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getServerHistorySnapshot,
  );
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [requestError, setRequestError] = useState<string | undefined>();
  const resultRef = useRef<HTMLDivElement>(null);
  const [resultFocusToken, setResultFocusToken] = useState(0);

  useEffect(() => {
    trackEvent("generator_view", { locale });
  }, [locale]);

  useEffect(() => {
    if (resultFocusToken === 0) {
      return;
    }
    bringResultIntoView(resultRef.current);
  }, [resultFocusToken]);

  function categoricalParams(extra?: {
    error_code?: string;
    duration_bucket?: string;
  }) {
    return {
      locale,
      tone: values.tone,
      intensity: values.intensity,
      setting: values.setting,
      timeframe: values.timeframe,
      result_count: values.count,
      ...extra,
    };
  }

  function validate(): boolean {
    const parsed = generatorInputSchema.safeParse({
      ...values,
      locale,
      turnstileToken: turnstileToken || undefined,
    });
    if (parsed.success) {
      setFormError(undefined);
      return true;
    }

    const descriptionIssue = parsed.error.issues.find((issue) =>
      issue.path.includes("eventDescription"),
    );
    if (values.eventDescription.trim().length < EVENT_DESCRIPTION_MIN) {
      setFormError(dictionary.generator.validation.tooShort);
    } else if (values.eventDescription.length > EVENT_DESCRIPTION_MAX) {
      setFormError(dictionary.generator.validation.tooLong);
    } else {
      setFormError(
        descriptionIssue
          ? dictionary.generator.validation.required
          : dictionary.errors.VALIDATION_ERROR,
      );
    }
    trackEvent("generator_validation_error", categoricalParams());
    return false;
  }

  async function generate(options?: { regenerate?: boolean }) {
    if (pending || !validate()) {
      return;
    }

    setPending(true);
    setRequestError(undefined);
    const startedAt = Date.now();
    trackEvent("generator_submit", categoricalParams());
    if (options?.regenerate) {
      trackEvent("generator_regenerate", categoricalParams());
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          locale,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const payload = (await response.json()) as
        | GenerationResult
        | ApiErrorBody;
      const bucket = durationBucket(Date.now() - startedAt);

      if (!response.ok || "error" in payload) {
        const code =
          "error" in payload ? payload.error.code : "INTERNAL_ERROR";
        if (code === "RATE_LIMITED") {
          trackEvent(
            "generator_rate_limited",
            categoricalParams({ error_code: code, duration_bucket: bucket }),
          );
        } else {
          trackEvent(
            "generator_error",
            categoricalParams({ error_code: code, duration_bucket: bucket }),
          );
        }
        setRequestError(
          dictionary.errors[code as keyof typeof dictionary.errors] ??
            dictionary.errors.INTERNAL_ERROR,
        );
        return;
      }

      setResult(payload);
      const entry = createHistoryEntry({ ...values, locale }, payload);
      setActiveHistoryId(entry.id);
      saveHistory(prependHistoryEntry(history, entry));
      trackEvent(
        "generator_success",
        categoricalParams({ duration_bucket: bucket }),
      );
      setResultFocusToken((token) => token + 1);
    } catch {
      setRequestError(dictionary.errors.network);
      trackEvent(
        "generator_error",
        categoricalParams({
          error_code: "network",
          duration_bucket: durationBucket(Date.now() - startedAt),
        }),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <GeneratorWorkshopLayout
      form={
        <>
          <GeneratorForm
            dictionary={dictionary}
            values={values}
            errors={{ eventDescription: formError }}
            pending={pending}
            turnstileSiteKey={turnstileSiteKey}
            onChange={setValues}
            onTurnstileToken={setTurnstileToken}
            onSubmit={() => void generate()}
          />
          {requestError ? (
            <p className="workshop-alert mt-3 px-3 py-2 text-sm" role="alert">
              {requestError}
            </p>
          ) : null}
        </>
      }
      result={
        <GeneratorResult
          result={result}
          dictionary={dictionary}
          pending={pending}
          resultRef={resultRef}
          onRegenerate={() => void generate({ regenerate: true })}
        />
      }
      history={
        <GenerationHistory
          entries={history}
          dictionary={dictionary}
          activeId={activeHistoryId}
          onOpen={(entry) => {
            trackEvent("history_opened", {
              locale,
              tone: entry.input.tone,
              intensity: entry.input.intensity,
              setting: entry.input.setting,
              timeframe: entry.input.timeframe,
              result_count: entry.input.count,
            });
            setValues({ ...entry.input, locale: entry.input.locale ?? locale });
            setResult(entry.result);
            setActiveHistoryId(entry.id);
            setResultFocusToken((token) => token + 1);
          }}
          onClear={() => {
            saveHistory([]);
            setActiveHistoryId(null);
          }}
        />
      }
    />
  );
}
