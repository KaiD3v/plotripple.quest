import { AppError } from "@/lib/errors";
import {
  generationResultForRequestSchema,
  type GenerationResultParsed,
} from "@/schemas/generator";
import type { ResultCount, Timeframe } from "@/types/generator";

export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

export function parseGenerationResult(
  raw: string,
  count: ResultCount,
  timeframe: Timeframe,
): GenerationResultParsed {
  const text = extractJsonText(raw);
  if (!text) {
    throw new AppError("INVALID_AI_RESPONSE", 502, { step: "empty_response" });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AppError("INVALID_AI_RESPONSE", 502, { step: "json_parse" });
  }

  const result = generationResultForRequestSchema(count, timeframe).safeParse(parsed);
  if (!result.success) {
    throw new AppError("INVALID_AI_RESPONSE", 502, { step: "schema_validate" });
  }

  return result.data;
}
