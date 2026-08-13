import { GoogleGenAI } from "@google/genai";
import { GEMINI_TIMEOUT_MS } from "@/lib/env";

export function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: GEMINI_TIMEOUT_MS,
    },
  });
}
