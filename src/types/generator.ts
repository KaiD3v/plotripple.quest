import type { Locale } from "@/i18n/config";

export const tones = [
  "dark",
  "heroic",
  "political",
  "mysterious",
  "comedic",
] as const;

export const intensities = ["light", "moderate", "severe"] as const;

export const settings = [
  "fantasy",
  "horror",
  "science_fiction",
  "contemporary",
  "generic",
] as const;

export const timeframes = [
  "immediate",
  "next_session",
  "long_term",
  "mixed",
] as const;

export const consequenceTimeframes = [
  "immediate",
  "next_session",
  "long_term",
] as const;

export const categories = [
  "social",
  "political",
  "economic",
  "personal",
  "supernatural",
  "environmental",
] as const;

export const resultCounts = [3, 5] as const;

export type Tone = (typeof tones)[number];
export type Intensity = (typeof intensities)[number];
export type Setting = (typeof settings)[number];
export type Timeframe = (typeof timeframes)[number];
export type ConsequenceTimeframe = (typeof consequenceTimeframes)[number];
export type Category = (typeof categories)[number];
export type ResultCount = (typeof resultCounts)[number];

export type GeneratorInput = {
  eventDescription: string;
  tone: Tone;
  intensity: Intensity;
  setting: Setting;
  timeframe: Timeframe;
  count: ResultCount;
  locale?: Locale;
  turnstileToken?: string;
};

export type Consequence = {
  title: string;
  description: string;
  timeframe: ConsequenceTimeframe;
  category: Category;
  trigger: string;
  affectedParties: string[];
};

export type GenerationResult = {
  summary: string;
  consequences: Consequence[];
};

export const apiErrorCodes = [
  "VALIDATION_ERROR",
  "BOT_VERIFICATION_FAILED",
  "RATE_LIMITED",
  "AI_UNAVAILABLE",
  "INVALID_AI_RESPONSE",
  "INTERNAL_ERROR",
] as const;

export type ApiErrorCode = (typeof apiErrorCodes)[number];

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};
