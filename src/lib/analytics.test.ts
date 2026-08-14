import { afterEach, describe, expect, it, vi } from "vitest";
import * as analytics from "@/lib/analytics";
import {
  allowedParams,
  analyticsEvents,
  durationBucket,
  trackEvent,
} from "@/lib/analytics";

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
    });
  });

  it("does not pass narrative text or personal data", () => {
    const leaked = allowedParams({
      tone: "dark",
      eventDescription: "The party spared the scout",
      summary: "Generated story text",
    } as unknown as Parameters<typeof allowedParams>[0]);
    expect(leaked).toEqual({ tone: "dark" });
    expect(JSON.stringify(leaked)).not.toContain("spared");
    expect(JSON.stringify(leaked)).not.toContain("Generated");
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

  it("forwards existing event names through gtag", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    trackEvent("generator_view", { locale: "en" });
    trackEvent("generator_submit", { tone: "dark" });
    trackEvent("language_changed", { language: "pt-br" });
    trackEvent("advanced_options_opened", { locale: "pt-br" });
    trackEvent("example_selected", { locale: "en" });

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
  });

  it("keeps the existing analytics event catalog", () => {
    expect(analyticsEvents).toEqual([
      "generator_view",
      "generator_submit",
      "generator_success",
      "generation_succeeded",
      "generation_result_viewed",
      "canvas_opened",
      "generator_error",
      "generator_rate_limited",
      "generator_validation_error",
      "generator_regenerate",
      "history_opened",
      "result_copy",
      "result_regenerate",
      "language_change",
      "language_changed",
      "related_tool_click",
      "advanced_options_opened",
      "example_selected",
    ]);
  });
});

describe("consent helpers", () => {
  it("does not expose manual grant or deny helpers", () => {
    expect("grantAnalyticsConsent" in analytics).toBe(false);
    expect("denyAnalyticsConsent" in analytics).toBe(false);
  });
});
