import { describe, expect, it } from "vitest";
import { formatPresetSummary } from "@/components/generator/preset-summary";
import { getDictionary } from "@/i18n/get-dictionary";

const defaults = {
  tone: "mysterious" as const,
  intensity: "moderate" as const,
  setting: "fantasy" as const,
  timeframe: "mixed" as const,
  count: 3 as const,
};

describe("formatPresetSummary", () => {
  it("joins localized default labels with a compact separator", () => {
    expect(formatPresetSummary(getDictionary("en"), defaults)).toBe(
      "Mysterious · Moderate · Fantasy · Mixed · 3 consequences",
    );
    expect(formatPresetSummary(getDictionary("pt-br"), defaults)).toBe(
      "Misterioso · Moderada · Fantasia · Misto · 3 consequências",
    );
  });

  it("reflects changed options immediately", () => {
    expect(
      formatPresetSummary(getDictionary("en"), {
        tone: "dark",
        intensity: "severe",
        setting: "horror",
        timeframe: "immediate",
        count: 5,
      }),
    ).toBe("Dark · Severe · Horror · Immediate · 5 consequences");
  });
});
