import {
  consequenceTimeframes,
  type ConsequenceTimeframe,
  type ResultCount,
  type Timeframe,
} from "@/types/generator";

export function allowedConsequenceTimeframes(
  requested: Timeframe,
): readonly ConsequenceTimeframe[] {
  if (requested === "mixed") {
    return consequenceTimeframes;
  }
  return [requested];
}

export function consequenceTimeframesSatisfyRequest(
  requested: Timeframe,
  consequences: Array<{ timeframe: ConsequenceTimeframe }>,
): boolean {
  if (consequences.length === 0) {
    return false;
  }

  if (requested !== "mixed") {
    return consequences.every((item) => item.timeframe === requested);
  }

  const present = new Set(consequences.map((item) => item.timeframe));
  return (
    present.has("immediate") &&
    present.has("next_session") &&
    present.has("long_term")
  );
}

export function buildTimeframeInstruction(
  timeframe: Timeframe,
  count: ResultCount,
): string {
  if (timeframe === "mixed") {
    if (count === 3) {
      return [
        "Timeframe filter: mixed.",
        "Return exactly 3 consequences with three distinct periods: one immediate, one next_session, and one long_term.",
        "Do not return three consequences of the same period.",
        "Order does not matter.",
      ].join(" ");
    }

    return [
      `Timeframe filter: mixed.`,
      `Return exactly ${count} consequences.`,
      "Include at least one immediate, one next_session, and one long_term.",
      "The remaining consequences may use any of those three periods, as the narrative requires.",
      "Order does not matter.",
    ].join(" ");
  }

  return [
    `Timeframe filter: ${timeframe}.`,
    `Every consequence.timeframe value must be exactly "${timeframe}".`,
    "Do not mix immediate, next_session, and long_term.",
    "A mixed spread across periods is not allowed for this request.",
  ].join(" ");
}
