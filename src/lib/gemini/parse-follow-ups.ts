import { AppError } from "@/lib/errors";
import { extractJsonText } from "@/lib/gemini/parse-response";
import {
  followUpGenerationResultSchema,
  type FollowUpGenerationResultParsed,
} from "@/schemas/follow-up";

function hasHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(value);
}

export function parseFollowUpGenerationResult(
  raw: string,
): FollowUpGenerationResultParsed {
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

  const result = followUpGenerationResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new AppError("INVALID_AI_RESPONSE", 502, { step: "schema_validate" });
  }

  for (const followUp of result.data.followUps) {
    if (hasHtml(followUp.title) || hasHtml(followUp.description)) {
      throw new AppError("INVALID_AI_RESPONSE", 502, { step: "html_rejected" });
    }
  }

  return result.data;
}
