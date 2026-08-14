import { categories, consequenceTimeframes } from "@/types/generator";

export const followUpGenerationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["followUps"],
  properties: {
    followUps: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description"],
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
            description: "What makes this follow-up visible in play.",
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
