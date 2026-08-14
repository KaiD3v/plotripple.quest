import { describe, expect, it } from "vitest";
import {
  DEFAULT_DEV_SITE_URL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_PROD_SITE_URL,
  getAdSenseClientId,
  getGeminiRuntimeEnv,
  getSiteUrl,
  getUnregulatedConsentDefault,
  getUpstashRedisConfig,
} from "@/lib/env";

describe("getSiteUrl", () => {
  it("uses localhost in development when unset", () => {
    expect(getSiteUrl({ NODE_ENV: "development" })).toBe(DEFAULT_DEV_SITE_URL);
  });

  it("uses the production domain when unset in production", () => {
    expect(getSiteUrl({ NODE_ENV: "production" })).toBe(DEFAULT_PROD_SITE_URL);
  });

  it("normalizes trailing slashes", () => {
    expect(
      getSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://plotripple.quest/" }),
    ).toBe("https://plotripple.quest");
  });
});

describe("getGeminiRuntimeEnv", () => {
  it("returns null when GEMINI_API_KEY is missing", () => {
    expect(getGeminiRuntimeEnv({})).toBeNull();
    expect(getGeminiRuntimeEnv({ GEMINI_API_KEY: "   " })).toBeNull();
  });

  it("uses the default model when GEMINI_MODEL is empty", () => {
    expect(
      getGeminiRuntimeEnv({ GEMINI_API_KEY: "test-key" }),
    ).toEqual({
      apiKey: "test-key",
      model: DEFAULT_GEMINI_MODEL,
    });
  });

  it("honors GEMINI_MODEL when provided", () => {
    expect(
      getGeminiRuntimeEnv({
        GEMINI_API_KEY: "test-key",
        GEMINI_MODEL: "gemini-3.6-flash",
      }),
    ).toEqual({
      apiKey: "test-key",
      model: "gemini-3.6-flash",
    });
  });
});

describe("getAdSenseClientId", () => {
  it("returns a trimmed valid Publisher ID", () => {
    expect(
      getAdSenseClientId({
        NEXT_PUBLIC_ADSENSE_CLIENT_ID: "  ca-pub-1234567890123456  ",
      }),
    ).toBe("ca-pub-1234567890123456");
  });

  it("returns undefined when the variable is absent", () => {
    expect(getAdSenseClientId({})).toBeUndefined();
  });

  it("returns undefined when the value is empty or whitespace", () => {
    expect(getAdSenseClientId({ NEXT_PUBLIC_ADSENSE_CLIENT_ID: "" })).toBeUndefined();
    expect(
      getAdSenseClientId({ NEXT_PUBLIC_ADSENSE_CLIENT_ID: "   " }),
    ).toBeUndefined();
  });

  it("returns undefined for invalid Publisher IDs", () => {
    expect(
      getAdSenseClientId({ NEXT_PUBLIC_ADSENSE_CLIENT_ID: "ca-pub-" }),
    ).toBeUndefined();
    expect(
      getAdSenseClientId({ NEXT_PUBLIC_ADSENSE_CLIENT_ID: "ca-pub-abc" }),
    ).toBeUndefined();
    expect(
      getAdSenseClientId({ NEXT_PUBLIC_ADSENSE_CLIENT_ID: "pub-1234567890" }),
    ).toBeUndefined();
    expect(
      getAdSenseClientId({
        NEXT_PUBLIC_ADSENSE_CLIENT_ID: "ca-pub-123456789012345",
      }),
    ).toBeUndefined();
    expect(
      getAdSenseClientId({
        NEXT_PUBLIC_ADSENSE_CLIENT_ID: "ca-pub-12345678901234567",
      }),
    ).toBeUndefined();
  });
});

describe("getUnregulatedConsentDefault", () => {
  it("defaults to denied and only accepts granted or denied", () => {
    expect(getUnregulatedConsentDefault({})).toBe("denied");
    expect(
      getUnregulatedConsentDefault({
        NEXT_PUBLIC_CONSENT_DEFAULT_UNREGULATED: "granted",
      }),
    ).toBe("granted");
    expect(
      getUnregulatedConsentDefault({
        NEXT_PUBLIC_CONSENT_DEFAULT_UNREGULATED: "nope",
      }),
    ).toBe("denied");
  });
});

describe("getUpstashRedisConfig", () => {
  it("returns null when either REST credential is missing", () => {
    expect(getUpstashRedisConfig({})).toBeNull();
    expect(
      getUpstashRedisConfig({ UPSTASH_REDIS_REST_URL: "https://example.upstash.io" }),
    ).toBeNull();
    expect(
      getUpstashRedisConfig({ UPSTASH_REDIS_REST_TOKEN: "token" }),
    ).toBeNull();
  });

  it("returns trimmed URL and token when both are set", () => {
    expect(
      getUpstashRedisConfig({
        UPSTASH_REDIS_REST_URL: " https://example.upstash.io ",
        UPSTASH_REDIS_REST_TOKEN: " token ",
      }),
    ).toEqual({
      url: "https://example.upstash.io",
      token: "token",
    });
  });
});
