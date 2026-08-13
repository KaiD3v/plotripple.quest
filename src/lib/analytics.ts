export const analyticsEvents = [
  "generator_view",
  "generator_submit",
  "generator_success",
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
] as const;

export type AnalyticsEvent = (typeof analyticsEvents)[number];

export type AnalyticsParams = {
  locale?: string;
  tone?: string;
  intensity?: string;
  setting?: string;
  timeframe?: string;
  result_count?: number;
  error_code?: string;
  duration_bucket?: string;
  tool_id?: string;
  language?: string;
};

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "consent" | "js",
      target: string | Date,
      params?: Record<string, unknown>,
    ) => void;
    dataLayer?: unknown[];
  }
}

const allowedKeys = [
  "locale",
  "tone",
  "intensity",
  "setting",
  "timeframe",
  "result_count",
  "error_code",
  "duration_bucket",
  "tool_id",
  "language",
] as const;

export function durationBucket(ms: number): string {
  if (ms < 2_000) return "0-2s";
  if (ms < 5_000) return "2-5s";
  if (ms < 10_000) return "5-10s";
  return "10s+";
}

export function allowedParams(params?: AnalyticsParams): Record<string, unknown> {
  if (!params) {
    return {};
  }

  const next: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    const value = params[key];
    if (value === undefined || value === "") {
      continue;
    }
    next[key] = value;
  }
  return next;
}

export function trackEvent(
  event: AnalyticsEvent,
  params?: AnalyticsParams,
): void {
  if (typeof window === "undefined") {
    return;
  }
  if (typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", event, allowedParams(params));
}

export function grantAnalyticsConsent(): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("consent", "update", {
    analytics_storage: "granted",
  });
}

export function denyAnalyticsConsent(): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}
