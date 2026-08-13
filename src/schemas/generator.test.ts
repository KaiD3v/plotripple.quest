import { describe, expect, it } from "vitest";
import {
  generationResultForCountSchema,
  generationResultForRequestSchema,
  generationResultSchema,
  generatorInputSchema,
} from "@/schemas/generator";

const validInput = {
  eventDescription: "The party spared the captured scout and sent them home.",
  tone: "mysterious" as const,
  intensity: "moderate" as const,
  setting: "fantasy" as const,
  timeframe: "mixed" as const,
  count: 3 as const,
};

const validConsequence = {
  title: "A whispered debt",
  description: "The scout's kin begin asking quiet favors of the party.",
  timeframe: "next_session" as const,
  category: "social" as const,
  trigger: "The scout reports who showed mercy.",
  affectedParties: ["the scout's kin", "a rival patrol"],
};

describe("generatorInputSchema", () => {
  it("accepts a valid payload", () => {
    const result = generatorInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("en");
    }
  });

  it("accepts an explicit Portuguese locale", () => {
    const result = generatorInputSchema.safeParse({
      ...validInput,
      locale: "pt-br",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("pt-br");
    }
  });

  it("rejects descriptions shorter than 20 characters", () => {
    const result = generatorInputSchema.safeParse({
      ...validInput,
      eventDescription: "Too short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects descriptions longer than 1000 characters", () => {
    const result = generatorInputSchema.safeParse({
      ...validInput,
      eventDescription: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a count other than 3 or 5", () => {
    const result = generatorInputSchema.safeParse({
      ...validInput,
      count: 4,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid enum values", () => {
    const result = generatorInputSchema.safeParse({
      ...validInput,
      tone: "grimdark",
      count: 4,
    });
    expect(result.success).toBe(false);
  });
});

describe("generationResultSchema", () => {
  it("accepts a structured result", () => {
    const result = generationResultSchema.safeParse({
      summary: "Mercy leaves a trail of obligations.",
      consequences: [validConsequence, validConsequence, validConsequence],
    });
    expect(result.success).toBe(true);
  });

  it("rejects the wrong number of consequences", () => {
    const result = generationResultForCountSchema(5).safeParse({
      summary: "Mercy leaves a trail of obligations.",
      consequences: [validConsequence, validConsequence, validConsequence],
    });
    expect(result.success).toBe(false);
  });

  it("rejects mixed periods when long_term was requested", () => {
    const result = generationResultForRequestSchema(3, "long_term").safeParse({
      summary: "Mercy leaves a trail of obligations.",
      consequences: [
        validConsequence,
        { ...validConsequence, timeframe: "immediate" },
        { ...validConsequence, timeframe: "long_term" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts three long_term consequences when long_term was requested", () => {
    const longTerm = { ...validConsequence, timeframe: "long_term" as const };
    const result = generationResultForRequestSchema(3, "long_term").safeParse({
      summary: "Mercy leaves a trail of obligations.",
      consequences: [longTerm, longTerm, longTerm],
    });
    expect(result.success).toBe(true);
  });

  it("accepts mixed periods in any order", () => {
    const result = generationResultForRequestSchema(3, "mixed").safeParse({
      summary: "Mercy leaves a trail of obligations.",
      consequences: [
        { ...validConsequence, timeframe: "long_term" },
        { ...validConsequence, timeframe: "immediate" },
        { ...validConsequence, timeframe: "next_session" },
      ],
    });
    expect(result.success).toBe(true);
  });
});
