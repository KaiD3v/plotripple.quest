import type { Dictionary } from "@/i18n/get-dictionary";
import type { GenerationResult } from "@/types/generator";

export function formatResultAsText(
  result: GenerationResult,
  dictionary: Dictionary,
): string {
  const lines = [dictionary.result.summaryLabel, result.summary, ""];

  for (const item of result.consequences) {
    lines.push(item.title);
    lines.push(
      `${dictionary.result.timeframes[item.timeframe]} · ${dictionary.result.categories[item.category]}`,
    );
    lines.push(item.description);
    lines.push(`${dictionary.result.triggerLabel}: ${item.trigger}`);
    lines.push(
      `${dictionary.result.affectedLabel}: ${item.affectedParties.join(", ")}`,
    );
    lines.push("");
  }

  return lines.join("\n").trim();
}
