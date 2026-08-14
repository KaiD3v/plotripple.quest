import { z } from "zod";
import { locales } from "@/i18n/config";
import {
  CHRONICLE_MAX_DEPTH,
  EXPAND_EXISTING_TITLE_MAX,
  EXPAND_EXISTING_TITLES_MAX,
} from "@/lib/chronicle/limits";
import {
  categories,
  consequenceTimeframes,
  intensities,
  settings,
  tones,
} from "@/types/generator";

const titleSchema = z.string().trim().min(1).max(120);
const descriptionSchema = z.string().trim().min(1).max(1200);

export const generatedFollowUpSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  timeframe: z.enum(consequenceTimeframes).optional(),
  category: z.enum(categories).optional(),
  trigger: z.string().trim().min(1).max(400).optional(),
  affectedParties: z.array(z.string().trim().min(1).max(80)).min(1).max(8).optional(),
});

export const followUpGenerationResultSchema = z.object({
  followUps: z.tuple([generatedFollowUpSchema, generatedFollowUpSchema]),
});

export const expandRipplePathItemSchema = z.object({
  title: z.string().trim().min(1).max(1000),
  excerpt: z.string().trim().max(400).optional(),
});

export const expandRippleRequestSchema = z.object({
  locale: z.enum(locales).default("en"),
  tone: z.enum(tones).optional(),
  intensity: z.enum(intensities).optional(),
  setting: z.enum(settings).optional(),
  chronicleTitle: z.string().trim().min(1).max(160),
  originTitle: z.string().trim().min(1).max(1000),
  originDescription: z.string().trim().max(4000).optional(),
  selected: z.object({
    title: z.string().trim().min(1).max(1000),
    description: z.string().trim().max(4000),
    timeframe: z.enum(consequenceTimeframes).optional(),
    category: z.enum(categories).optional(),
    trigger: z.string().trim().max(400).optional(),
    affectedParties: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
  }),
  path: z.array(expandRipplePathItemSchema).min(1).max(CHRONICLE_MAX_DEPTH + 1),
  existingTitles: z
    .array(z.string().trim().min(1).max(EXPAND_EXISTING_TITLE_MAX))
    .max(EXPAND_EXISTING_TITLES_MAX),
});

export type GeneratedFollowUpParsed = z.infer<typeof generatedFollowUpSchema>;
export type FollowUpGenerationResultParsed = z.infer<
  typeof followUpGenerationResultSchema
>;
export type ExpandRippleRequestParsed = z.infer<typeof expandRippleRequestSchema>;
