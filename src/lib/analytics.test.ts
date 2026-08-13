import { describe, expect, it } from "vitest";
import { allowedParams, durationBucket } from "@/lib/analytics";

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
