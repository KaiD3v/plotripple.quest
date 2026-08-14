import { z } from "zod";
import { locales } from "@/i18n/config";
import { consequenceTimeframesSatisfyRequest } from "@/lib/consequence-timeframes";
import {
  categories,
  consequenceTimeframes,
  intensities,
  resultCounts,
  settings,
  timeframes,
  tones,
  type Timeframe,
} from "@/types/generator";

export const EVENT_DESCRIPTION_MIN = 20;
export const EVENT_DESCRIPTION_MAX = 1000;

export const generatorInputSchema = z.object({
  eventDescription: z
    .string()
    .trim()
    .min(EVENT_DESCRIPTION_MIN)
    .max(EVENT_DESCRIPTION_MAX),
  tone: z.enum(tones),
  intensity: z.enum(intensities),
  setting: z.enum(settings),
  timeframe: z.enum(timeframes),
  count: z.union([z.literal(3), z.literal(5)]),
  locale: z.enum(locales).default("en"),
});

export const generateRequestSchema = generatorInputSchema;

export const consequenceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1200),
  timeframe: z.enum(consequenceTimeframes),
  category: z.enum(categories),
  trigger: z.string().trim().min(1).max(400),
  affectedParties: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
});

export const generationResultSchema = z.object({
  summary: z.string().trim().min(1).max(800),
  consequences: z.array(consequenceSchema).min(3).max(5),
});

export function generationResultForCountSchema(count: (typeof resultCounts)[number]) {
  return generationResultSchema.superRefine((value, ctx) => {
    if (value.consequences.length !== count) {
      ctx.addIssue({
        code: "custom",
        message: `Expected exactly ${count} consequences`,
        path: ["consequences"],
      });
    }
  });
}

export function generationResultForRequestSchema(
  count: (typeof resultCounts)[number],
  timeframe: Timeframe,
) {
  return generationResultSchema.superRefine((value, ctx) => {
    if (value.consequences.length !== count) {
      ctx.addIssue({
        code: "custom",
        message: `Expected exactly ${count} consequences`,
        path: ["consequences"],
      });
    }

    if (!consequenceTimeframesSatisfyRequest(timeframe, value.consequences)) {
      ctx.addIssue({
        code: "custom",
        message: `Consequence timeframes must match requested timeframe ${timeframe}`,
        path: ["consequences"],
      });
    }
  });
}

export const historyEntrySchema = z.object({
  v: z.literal(1),
  id: z.string().min(1).max(80),
  createdAt: z.string().min(1).max(40),
  input: generatorInputSchema,
  result: generationResultSchema,
});

export const historyFileSchema = z.object({
  v: z.literal(1),
  entries: z.array(historyEntrySchema).max(5),
});

export type GeneratorInputParsed = z.infer<typeof generatorInputSchema>;
export type GenerationResultParsed = z.infer<typeof generationResultSchema>;
export type HistoryEntryParsed = z.infer<typeof historyEntrySchema>;
