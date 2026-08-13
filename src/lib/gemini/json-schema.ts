import { allowedConsequenceTimeframes } from "@/lib/consequence-timeframes";
import {
  categories,
  consequenceTimeframes,
  type ResultCount,
  type Timeframe,
} from "@/types/generator";

export const generationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "consequences"],
  properties: {
    summary: {
      type: "string",
      description: "A short GM-facing framing of how the event ripples outward.",
    },
    consequences: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "description",
          "timeframe",
          "category",
          "trigger",
          "affectedParties",
        ],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          timeframe: {
            type: "string",
            enum: [...consequenceTimeframes],
          },
          category: {
            type: "string",
            enum: [...categories],
          },
          trigger: {
            type: "string",
            description: "What causes this consequence to become visible in play.",
          },
          affectedParties: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: { type: "string" },
          },
        },
      },
    },
  },
} as const;

function timeframeSchemaDescription(timeframe: Timeframe, count: ResultCount): string {
  if (timeframe === "mixed") {
    return count === 3
      ? "Use three distinct values: one immediate, one next_session, and one long_term. Order may vary."
      : "Include at least one immediate, one next_session, and one long_term. Remaining items may use any of those periods. Order may vary.";
  }

  return `Every consequence timeframe must be exactly "${timeframe}". Do not use other periods.`;
}

export function generationJsonSchemaForCount(count: ResultCount) {
  return generationJsonSchemaForRequest(count, "mixed");
}

export function generationJsonSchemaForRequest(
  count: ResultCount,
  timeframe: Timeframe,
) {
  const allowed = allowedConsequenceTimeframes(timeframe);

  return {
    ...generationJsonSchema,
    properties: {
      ...generationJsonSchema.properties,
      consequences: {
        ...generationJsonSchema.properties.consequences,
        minItems: count,
        maxItems: count,
        items: {
          ...generationJsonSchema.properties.consequences.items,
          properties: {
            ...generationJsonSchema.properties.consequences.items.properties,
            timeframe: {
              type: "string",
              enum: [...allowed],
              description: timeframeSchemaDescription(timeframe, count),
            },
          },
        },
      },
    },
  };
}
