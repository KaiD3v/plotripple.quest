import { describe, expect, it } from "vitest";
import {
  DEFAULT_DEV_SITE_URL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_PROD_SITE_URL,
  getGeminiRuntimeEnv,
  getSiteUrl,
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
