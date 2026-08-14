"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { prepareChronicleNavigation } from "@/lib/chronicle/prepare-navigation";
import { hydrateLegacyHistoryIntoLibrary } from "@/lib/chronicle/migrate-history-entry";
import { openChronicleOnCanvas } from "@/lib/chronicle/open-chronicle";
import { resolveChronicleGraphId } from "@/lib/chronicle/resolve-graph-id";
import {
  CHRONICLE_LIBRARY_MAX_ITEMS,
} from "@/lib/chronicle/limits";
import {
  clearPlotRippleLocalStorage,
  deleteStoredChronicle,
  getBrowserLibraryStorage,
} from "@/lib/chronicle/library-repository";
import {
  getRecentDeviceSnapshot,
  getServerRecentDeviceSnapshot,
  subscribeRecentDevice,
  type RecentDeviceItem,
} from "@/lib/chronicle/recent-device";
import {
  getChronicleSnapshot,
} from "@/lib/chronicle/session-repository";
import { durationBucket, trackEvent } from "@/lib/analytics";
import {
  getBrowserHistoryStorage,
  readHistory,
  saveHistory,
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
  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasHref, setCanvasHref] = useState<string | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const recents = useSyncExternalStore(
    subscribeRecentDevice,
    getRecentDeviceSnapshot,
    getServerRecentDeviceSnapshot,
  );
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [requestError, setRequestError] = useState<string | undefined>();
  const resultRef = useRef<HTMLDivElement>(null);
  const [resultFocusToken, setResultFocusToken] = useState(0);
  const router = useRouter();
  const libraryCount = recents.filter((item) => item.kind === "chronicle" && item.persisted).length;
  const libraryFull = libraryCount >= CHRONICLE_LIBRARY_MAX_ITEMS;

  useEffect(() => {
    trackEvent("generator_view", { locale });
  }, [locale]);

  useEffect(() => {
    hydrateLegacyHistoryIntoLibrary(getBrowserLibraryStorage());
  }, []);

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

  async function generate() {
    if (pending || !validate()) {
      return;
    }

    setPending(true);
    setRequestError(undefined);
    const startedAt = Date.now();
    trackEvent("generator_submit", categoricalParams());

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
      trackEvent(
        "generator_success",
        categoricalParams({ duration_bucket: bucket }),
      );
      trackEvent(
        "generation_succeeded",
        categoricalParams({ duration_bucket: bucket }),
      );
      trackEvent(
        "generation_result_viewed",
        categoricalParams({ duration_bucket: bucket }),
      );

      const navigation = prepareChronicleNavigation(
        payload,
        locale,
        values.eventDescription,
        undefined,
        {
          tone: values.tone,
          intensity: values.intensity,
          setting: values.setting,
          locale,
        },
      );

      if (!navigation.ok) {
        setCanvasReady(false);
        setCanvasHref(null);
        setRequestError(
          dictionary.errors[navigation.code as keyof typeof dictionary.errors] ??
            dictionary.errors.INTERNAL_ERROR,
        );
        setResultFocusToken((token) => token + 1);
        return;
      }

      setActiveHistoryId(resolveChronicleGraphId(navigation.graph) ?? null);
      setCanvasHref(navigation.href);
      setCanvasReady(navigation.sessionSaved);
      if (!navigation.sessionSaved) {
        setRequestError(dictionary.errors.CHRONICLE_UNAVAILABLE);
      } else if (
        !navigation.librarySaved &&
        navigation.libraryCode === "CHRONICLE_LIBRARY_FULL"
      ) {
        setRequestError(dictionary.canvas.libraryFull);
      }
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

  function exploreMap() {
    if (!canvasReady || !canvasHref) {
      setRequestError(dictionary.errors.CHRONICLE_UNAVAILABLE);
      return;
    }
    const snapshot = getChronicleSnapshot();
    const snapshotId = snapshot ? resolveChronicleGraphId(snapshot) : null;
    if (!snapshot || snapshotId !== activeHistoryId) {
      setRequestError(dictionary.errors.CHRONICLE_UNAVAILABLE);
      return;
    }
    trackEvent("canvas_opened", {
      locale,
      result_count: result?.consequences.length ?? values.count,
    });
    router.push(canvasHref);
  }

  function generateAgain() {
    trackEvent("result_regenerate", categoricalParams());
    trackEvent("generator_regenerate", categoricalParams());
    setResult(null);
    setCanvasReady(false);
    setCanvasHref(null);
    setRequestError(undefined);
    const field = document.getElementById(
      "event-description",
    ) as HTMLTextAreaElement | null;
    field?.focus();
  }

  function openMap(item: Extract<RecentDeviceItem, { kind: "chronicle" }>) {
    trackEvent("history_opened", {
      locale,
      result_count: item.nodeCount,
    });
    trackEvent("canvas_opened", {
      locale,
      result_count: item.nodeCount,
    });
    const opened = openChronicleOnCanvas({
      id: item.id,
      locale,
      sourceHistoryId: item.sourceHistoryId,
    });
    if (!opened.ok) {
      setRequestError(
        dictionary.errors[opened.code as keyof typeof dictionary.errors] ??
          dictionary.errors.INTERNAL_ERROR,
      );
      return;
    }
    setActiveHistoryId(item.id);
    router.push(opened.href);
  }

  function deleteItem(item: RecentDeviceItem) {
    if (item.kind === "chronicle" && item.persisted) {
      deleteStoredChronicle(item.id);
      return;
    }
    if (item.kind === "chronicle" && item.sourceHistoryId) {
      const history = readHistory(getBrowserHistoryStorage());
      saveHistory(history.filter((entry) => entry.id !== item.sourceHistoryId));
      return;
    }
    if (item.kind === "legacy") {
      const history = readHistory(getBrowserHistoryStorage());
      saveHistory(history.filter((entry) => entry.id !== item.id));
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
          canvasReady={canvasReady}
          onExploreMap={exploreMap}
          onRegenerate={generateAgain}
        />
      }
      history={
        <GenerationHistory
          items={recents}
          locale={locale}
          dictionary={dictionary}
          activeId={activeHistoryId}
          libraryFull={libraryFull}
          onOpenMap={openMap}
          onReviewLegacy={(entry) => {
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
            setCanvasReady(false);
            setCanvasHref(null);
            setResultFocusToken((token) => token + 1);
          }}
          onDelete={deleteItem}
          onClear={() => {
            clearPlotRippleLocalStorage();
            setActiveHistoryId(null);
          }}
        />
      }
    />
  );
}
