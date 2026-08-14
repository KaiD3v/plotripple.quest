import { afterEach, describe, expect, it, vi } from "vitest";
import * as analytics from "@/lib/analytics";
import {
  allowedParams,
  analyticsEvents,
  durationBucket,
  trackEvent,
} from "@/lib/analytics";

const legacyAliases = [
  "generation_succeeded",
  "generation_result_viewed",
  "generator_regenerate",
  "language_change",
  "related_tool_click",
] as const;

describe("allowedParams", () => {
  it("keeps only categorical analytics fields", () => {
    expect(
      allowedParams({
        locale: "pt-br",
        tone: "political",
        intensity: "moderate",
        setting: "fantasy",
        timeframe: "long_term",
        result_count: 3,
        error_code: "VALIDATION_ERROR",
        duration_bucket: "2-5s",
        language: "pt-br",
        source: "result",
      }),
    ).toEqual({
      locale: "pt-br",
      tone: "political",
      intensity: "moderate",
      setting: "fantasy",
      timeframe: "long_term",
      result_count: 3,
      error_code: "VALIDATION_ERROR",
      duration_bucket: "2-5s",
      language: "pt-br",
      source: "result",
    });
  });

  it("does not pass narrative text, chronicle ids, or unknown fields", () => {
    const leaked = allowedParams({
      tone: "dark",
      source: "history",
      eventDescription: "The party spared the scout",
      summary: "Generated story text",
      title: "Scout mercy",
      chronicle_id: "chr-mercy",
      tool_id: "rumor-generator",
    } as unknown as Parameters<typeof allowedParams>[0]);

    expect(leaked).toEqual({ tone: "dark", source: "history" });
    expect(JSON.stringify(leaked)).not.toContain("spared");
    expect(JSON.stringify(leaked)).not.toContain("Generated");
    expect(JSON.stringify(leaked)).not.toContain("Scout mercy");
    expect(JSON.stringify(leaked)).not.toContain("chr-mercy");
    expect(leaked).not.toHaveProperty("tool_id");
  });
});

describe("durationBucket", () => {
  it("buckets durations without exposing exact timing", () => {
    expect(durationBucket(900)).toBe("0-2s");
    expect(durationBucket(2500)).toBe("2-5s");
    expect(durationBucket(8000)).toBe("5-10s");
    expect(durationBucket(12000)).toBe("10s+");
  });
});

describe("trackEvent", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards canonical event names through gtag", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    trackEvent("generator_view", { locale: "en" });
    trackEvent("generator_submit", { tone: "dark" });
    trackEvent("language_changed", { language: "pt-br" });
    trackEvent("advanced_options_opened", { locale: "pt-br" });
    trackEvent("example_selected", { locale: "en" });
    trackEvent("canvas_opened", { locale: "en", source: "result" });

    expect(gtag).toHaveBeenCalledWith("event", "generator_view", { locale: "en" });
    expect(gtag).toHaveBeenCalledWith("event", "generator_submit", { tone: "dark" });
    expect(gtag).toHaveBeenCalledWith("event", "language_changed", {
      language: "pt-br",
    });
    expect(gtag).toHaveBeenCalledWith("event", "advanced_options_opened", {
      locale: "pt-br",
    });
    expect(gtag).toHaveBeenCalledWith("event", "example_selected", {
      locale: "en",
    });
    expect(gtag).toHaveBeenCalledWith("event", "canvas_opened", {
      locale: "en",
      source: "result",
    });
  });

  it("strips unknown keys before forwarding to gtag", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    trackEvent("result_copy", {
      locale: "en",
      summary: "Mercy leaves a trail of obligations.",
    } as unknown as Parameters<typeof trackEvent>[1]);

    expect(gtag).toHaveBeenCalledWith("event", "result_copy", { locale: "en" });
    expect(JSON.stringify(gtag.mock.calls)).not.toContain("Mercy");
  });

  it("keeps the canonical analytics event catalog without legacy aliases", () => {
    expect(analyticsEvents).toEqual([
      "generator_view",
      "example_selected",
      "advanced_options_opened",
      "generator_submit",
      "generator_success",
      "generator_validation_error",
      "generator_error",
      "generator_rate_limited",
      "result_copy",
      "result_regenerate",
      "canvas_opened",
      "history_opened",
      "language_changed",
    ]);

    for (const alias of legacyAliases) {
      expect(analyticsEvents).not.toContain(alias);
    }
  });
});

describe("consent helpers", () => {
  it("does not expose manual grant or deny helpers", () => {
    expect("grantAnalyticsConsent" in analytics).toBe(false);
    expect("denyAnalyticsConsent" in analytics).toBe(false);
  });
});
