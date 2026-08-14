import { describe, expect, it } from "vitest";
import { exploreRippleMessage } from "@/lib/chronicle/explore-message";
import { getDictionary } from "@/i18n/get-dictionary";

describe("exploreRippleMessage", () => {
  it("uses a localized prepare-failed message for VALIDATION_ERROR", () => {
    const en = getDictionary("en");
    const pt = getDictionary("pt-br");

    expect(exploreRippleMessage("VALIDATION_ERROR", en)).toBe(
      "This branch could not be prepared for expansion.",
    );
    expect(exploreRippleMessage("VALIDATION_ERROR", pt)).toBe(
      "Esta ramificação não pôde ser preparada para expansão.",
    );
    expect(exploreRippleMessage("VALIDATION_ERROR", en)).not.toBe(
      en.errors.INTERNAL_ERROR,
    );
    expect(exploreRippleMessage("VALIDATION_ERROR", en)).toBe(
      en.canvas.expandPrepareFailed,
    );
  });

  it("preserves specific messages for rate limit and provider failures", () => {
    const dictionary = getDictionary("en");
    expect(exploreRippleMessage("RATE_LIMITED", dictionary)).toBe(
      dictionary.errors.RATE_LIMITED,
    );
    expect(exploreRippleMessage("AI_UNAVAILABLE", dictionary)).toBe(
      dictionary.canvas.expandUnavailable,
    );
    expect(exploreRippleMessage("INVALID_AI_RESPONSE", dictionary)).toBe(
      dictionary.canvas.expandInvalidResponse,
    );
    expect(exploreRippleMessage("CHRONICLE_MAX_DEPTH", dictionary)).toBe(
      dictionary.canvas.maxDepthReached,
    );
  });
});
