import { AppError, logOperationalError, toAppError } from "@/lib/errors";
import {
  getGeminiRuntimeEnv,
  GEMINI_TIMEOUT_MS,
  type GeminiRuntimeEnv,
} from "@/lib/env";
import { createGeminiClient } from "@/lib/gemini/client";
import { generationJsonSchemaForRequest } from "@/lib/gemini/json-schema";
import { parseGenerationResult } from "@/lib/gemini/parse-response";
import { buildPrompt } from "@/lib/gemini/prompt";
import type { GeneratorInputParsed } from "@/schemas/generator";
import type { GenerationResult } from "@/types/generator";

const MAX_OUTPUT_TOKENS = 8192;

export type GeminiContentResponse = {
  text?: string;
  promptFeedback?: { blockReason?: string };
  candidates?: Array<{ finishReason?: string }>;
};

export type GeminiGenerateContent = (input: {
  model: string;
  contents: string;
  config: Record<string, unknown>;
  abortSignal: AbortSignal;
}) => Promise<GeminiContentResponse>;

export type GenerateConsequencesDeps = {
  getEnv?: () => GeminiRuntimeEnv | null;
  generateContent?: GeminiGenerateContent;
  now?: () => number;
};

export async function generateConsequences(
  input: GeneratorInputParsed,
  deps: GenerateConsequencesDeps = {},
): Promise<GenerationResult> {
  const now = deps.now ?? Date.now;
  const startedAt = now();
  const env = (deps.getEnv ?? getGeminiRuntimeEnv)();

  if (!env) {
    console.error(
      "gemini_unconfigured: GEMINI_API_KEY is missing. Set GEMINI_API_KEY in the server environment (.env, .env.local, or the hosting secret store). Optional: GEMINI_MODEL.",
    );
    throw new AppError("AI_UNAVAILABLE", 503, { step: "config" });
  }

  const prompt = buildPrompt(input);
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), GEMINI_TIMEOUT_MS);
  const generateContent = deps.generateContent ?? defaultGenerateContent(env.apiKey);

  try {
    const response = await generateContent({
      model: env.model,
      contents: prompt.userContent,
      abortSignal: abortController.signal,
      config: {
        systemInstruction: prompt.systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: generationJsonSchemaForRequest(
          input.count,
          input.timeframe,
        ),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        abortSignal: abortController.signal,
        httpOptions: { timeout: GEMINI_TIMEOUT_MS },
      },
    });

    if (isBlockedOrEmpty(response)) {
      throw new AppError("INVALID_AI_RESPONSE", 502, { step: "empty_response" });
    }

    const text = typeof response.text === "string" ? response.text : "";
    return parseGenerationResult(text, input.count, input.timeframe);
  } catch (error) {
    const durationMs = now() - startedAt;
    const appError = error instanceof AppError ? error : toAppError(error);
    logOperationalError("gemini_failed", {
      code: appError.code,
      step: appError.step ?? "provider_request",
      status: appError.providerStatus ?? readSafeStatus(error),
      model: env.model,
      durationMs,
    });
    throw appError;
  } finally {
    clearTimeout(timeout);
  }
}

function defaultGenerateContent(apiKey: string): GeminiGenerateContent {
  const client = createGeminiClient(apiKey);
  return async ({ model, contents, config, abortSignal }) => {
    const response = await client.models.generateContent({
      model,
      contents,
      config: {
        ...config,
        abortSignal,
      },
    });
    return {
      text: response.text,
      promptFeedback: response.promptFeedback,
      candidates: response.candidates?.map((candidate) => ({
        finishReason:
          typeof candidate.finishReason === "string"
            ? candidate.finishReason
            : undefined,
      })),
    };
  };
}

function isBlockedOrEmpty(response: GeminiContentResponse): boolean {
  if (response.promptFeedback?.blockReason) {
    return true;
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (
    finishReason === "SAFETY" ||
    finishReason === "BLOCKLIST" ||
    finishReason === "PROHIBITED_CONTENT"
  ) {
    return true;
  }

  return !response.text?.trim();
}

function readSafeStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}
