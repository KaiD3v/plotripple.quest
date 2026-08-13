import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { generateConsequences } from "@/lib/gemini/generate-consequences";
import type { GeneratorInputParsed } from "@/schemas/generator";

const validInput: GeneratorInputParsed = {
  eventDescription:
    "The party spared a captured goblin scout, warned the tribe to leave the valley, and returned to the nearby village.",
  tone: "political",
  intensity: "moderate",
  setting: "fantasy",
  timeframe: "long_term",
  count: 3,
  locale: "en",
};

const validConsequence = {
  title: "A whispered debt",
  description: "The scout's kin begin asking quiet favors of the party.",
  timeframe: "long_term" as const,
  category: "social" as const,
  trigger: "The scout reports who showed mercy.",
  affectedParties: ["the scout's kin", "a rival patrol"],
};

function consequence(
  timeframe: "immediate" | "next_session" | "long_term" = "long_term",
) {
  return { ...validConsequence, timeframe };
}

function validResult(
  count: 3 | 5,
  summary = "Mercy leaves a trail of obligations.",
  timeframe: "immediate" | "next_session" | "long_term" = "long_term",
) {
  return {
    summary,
    consequences: Array.from({ length: count }, () => consequence(timeframe)),
  };
}

function mixedResult(count: 3 | 5, summary = "Mercy leaves a trail of obligations.") {
  const periods =
    count === 3
      ? (["immediate", "next_session", "long_term"] as const)
      : ([
          "immediate",
          "next_session",
          "long_term",
          "long_term",
          "immediate",
        ] as const);
  return {
    summary,
    consequences: periods.map((timeframe) => consequence(timeframe)),
  };
}

describe("generateConsequences", () => {
  it("returns a validated result on success", async () => {
    const result = await generateConsequences(validInput, {
      getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
      generateContent: async () => ({ text: JSON.stringify(validResult(3)) }),
    });
    expect(result.consequences).toHaveLength(3);
    expect(result.summary).toContain("Mercy");
  });

  it("fails when GEMINI_API_KEY is missing", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await generateConsequences(validInput, { getEnv: () => null });
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("AI_UNAVAILABLE");
      expect((error as AppError).status).toBe(503);
      expect((error as AppError).step).toBe("config");
      expect(spy.mock.calls.flat().join(" ")).toContain("GEMINI_API_KEY");
    } finally {
      spy.mockRestore();
    }
  });

  it("maps provider rate limits", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await generateConsequences(validInput, {
        getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
        generateContent: async () => {
          const error = Object.assign(new Error("RESOURCE_EXHAUSTED"), {
            status: 429,
          });
          throw error;
        },
      });
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("RATE_LIMITED");
      expect((error as AppError).status).toBe(429);
    } finally {
      spy.mockRestore();
    }
  });

  it("maps provider timeouts", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await generateConsequences(validInput, {
        getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
        generateContent: async () => {
          const error = Object.assign(new Error("The operation timed out"), {
            name: "AbortError",
          });
          throw error;
        },
      });
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("AI_UNAVAILABLE");
      expect((error as AppError).status).toBe(504);
      expect((error as AppError).step).toBe("timeout");
    } finally {
      spy.mockRestore();
    }
  });

  it("rejects an empty provider response", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await generateConsequences(validInput, {
        getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
        generateContent: async () => ({ text: "" }),
      });
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("INVALID_AI_RESPONSE");
      expect((error as AppError).step).toBe("empty_response");
    } finally {
      spy.mockRestore();
    }
  });

  it("rejects invalid JSON from the provider", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await generateConsequences(validInput, {
        getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
        generateContent: async () => ({ text: "not-json" }),
      });
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).step).toBe("json_parse");
    } finally {
      spy.mockRestore();
    }
  });

  it("rejects a response incompatible with the schema", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await generateConsequences(validInput, {
        getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
        generateContent: async () => ({
          text: JSON.stringify({ summary: "Broken", consequences: [] }),
        }),
      });
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).step).toBe("schema_validate");
    } finally {
      spy.mockRestore();
    }
  });

  it("rejects a count that does not match the request", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await generateConsequences(validInput, {
        getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
        generateContent: async () => ({ text: JSON.stringify(validResult(5)) }),
      });
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).step).toBe("schema_validate");
    } finally {
      spy.mockRestore();
    }
  });

  it("requests English output for locale en", async () => {
    let systemInstruction = "";
    await generateConsequences(
      { ...validInput, locale: "en" },
      {
        getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
        generateContent: async ({ config }) => {
          systemInstruction = String(config.systemInstruction ?? "");
          return { text: JSON.stringify(validResult(3)) };
        },
      },
    );
    expect(systemInstruction).toContain("English");
  });

  it("requests Brazilian Portuguese output for locale pt-br", async () => {
    let systemInstruction = "";
    const result = await generateConsequences(
      { ...validInput, locale: "pt-br" },
      {
        getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
        generateContent: async ({ config }) => {
          systemInstruction = String(config.systemInstruction ?? "");
          return {
            text: JSON.stringify(
              validResult(3, "A misericórdia deixa um rastro de dívidas."),
            ),
          };
        },
      },
    );
    expect(systemInstruction).toContain("Brazilian Portuguese");
    expect(result.summary).toContain("misericórdia");
  });

  it("rejects mixed periods when long_term was requested", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await generateConsequences(validInput, {
        getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
        generateContent: async () => ({ text: JSON.stringify(mixedResult(3)) }),
      });
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("INVALID_AI_RESPONSE");
      expect((error as AppError).step).toBe("schema_validate");
    } finally {
      spy.mockRestore();
    }
  });

  it("constrains the Gemini schema and prompt to long_term", async () => {
    let systemInstruction = "";
    let schema: { properties?: { consequences?: { items?: { properties?: { timeframe?: { enum?: string[] } } } } } } =
      {};
    const result = await generateConsequences(validInput, {
      getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
      generateContent: async ({ config }) => {
        systemInstruction = String(config.systemInstruction ?? "");
        schema = config.responseJsonSchema as typeof schema;
        return { text: JSON.stringify(validResult(3)) };
      },
    });
    expect(result.consequences.every((item) => item.timeframe === "long_term")).toBe(
      true,
    );
    expect(systemInstruction).toContain('exactly "long_term"');
    expect(schema.properties?.consequences?.items?.properties?.timeframe?.enum).toEqual(
      ["long_term"],
    );
  });

  it("accepts mixed periods in any order when mixed is requested", async () => {
    const result = await generateConsequences(
      { ...validInput, timeframe: "mixed" },
      {
        getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
        generateContent: async () => ({
          text: JSON.stringify({
            summary: "Ripples arrive on different clocks.",
            consequences: [
              consequence("long_term"),
              consequence("immediate"),
              consequence("next_session"),
            ],
          }),
        }),
      },
    );
    expect(new Set(result.consequences.map((item) => item.timeframe))).toEqual(
      new Set(["immediate", "next_session", "long_term"]),
    );
  });

  it("maps a missing model 404 to a controlled AI unavailable error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await generateConsequences(validInput, {
        getEnv: () => ({ apiKey: "test-key", model: "gemini-2.5-flash" }),
        generateContent: async () => {
          throw Object.assign(new Error("NOT_FOUND"), { status: 404 });
        },
      });
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("AI_UNAVAILABLE");
      expect((error as AppError).status).toBe(503);
      expect((error as AppError).code).not.toBe("INTERNAL_ERROR");
    } finally {
      spy.mockRestore();
    }
  });
});
