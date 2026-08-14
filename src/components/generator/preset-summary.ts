import type { Dictionary } from "@/i18n/get-dictionary";
import type { GeneratorInputParsed } from "@/schemas/generator";

export const ADVANCED_OPTIONS_ID = "generator-advanced-options";
export const PRESET_SUMMARY_ID = "generator-preset-summary";
export const PRESET_SUMMARY_SEPARATOR = " · ";

export function formatPresetSummary(
  dictionary: Dictionary,
  values: Pick<
    GeneratorInputParsed,
    "tone" | "intensity" | "setting" | "timeframe" | "count"
  >,
): string {
  const countKey = String(values.count) as keyof typeof dictionary.generator.counts;
  return [
    dictionary.generator.tones[values.tone],
    dictionary.generator.intensities[values.intensity],
    dictionary.generator.settings[values.setting],
    dictionary.generator.timeframes[values.timeframe],
    dictionary.generator.counts[countKey],
  ].join(PRESET_SUMMARY_SEPARATOR);
}
