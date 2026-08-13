import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { extractJsonText, parseGenerationResult } from "@/lib/gemini/parse-response";

const validConsequence = {
  title: "A whispered debt",
  description: "The scout's kin begin asking quiet favors of the party.",
  timeframe: "next_session",
  category: "social",
  trigger: "The scout reports who showed mercy.",
  affectedParties: ["the scout's kin", "a rival patrol"],
};

const validResult = {
  summary: "Mercy leaves a trail of obligations.",
  consequences: [validConsequence, validConsequence, validConsequence],
};

function consequence(timeframe: "immediate" | "next_session" | "long_term") {
  return { ...validConsequence, timeframe };
}

describe("extractJsonText", () => {
  it("strips markdown code fences before parsing", () => {
    expect(extractJsonText("```json\n{\"ok\":true}\n```")).toBe('{"ok":true}');
    expect(extractJsonText("```\n{\"ok\":true}\n```")).toBe('{"ok":true}');
  });
});

describe("parseGenerationResult", () => {
  it("accepts a valid result", () => {
    expect(
      parseGenerationResult(JSON.stringify(validResult), 3, "next_session"),
    ).toEqual(validResult);
  });

  it("parses fenced JSON", () => {
    const fenced = `\`\`\`json\n${JSON.stringify(validResult)}\n\`\`\``;
    expect(
      parseGenerationResult(fenced, 3, "next_session").consequences,
    ).toHaveLength(3);
  });

  it("rejects an empty response", () => {
    try {
      parseGenerationResult("   ", 3, "mixed");
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("INVALID_AI_RESPONSE");
      expect((error as AppError).step).toBe("empty_response");
    }
  });

  it("rejects invalid JSON", () => {
    try {
      parseGenerationResult("{not json", 3, "mixed");
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).step).toBe("json_parse");
    }
  });

  it("rejects a schema mismatch", () => {
    try {
      parseGenerationResult(JSON.stringify({ summary: "Only a summary" }), 3, "mixed");
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).step).toBe("schema_validate");
    }
  });

  it("rejects the wrong number of consequences", () => {
    try {
      parseGenerationResult(JSON.stringify(validResult), 5, "next_session");
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).step).toBe("schema_validate");
    }
  });

  it("rejects mixed periods when long_term was requested", () => {
    try {
      parseGenerationResult(
        JSON.stringify({
          summary: "The valley remembers.",
          consequences: [
            consequence("immediate"),
            consequence("next_session"),
            consequence("long_term"),
          ],
        }),
        3,
        "long_term",
      );
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).step).toBe("schema_validate");
    }
  });

  it("accepts only long_term consequences when long_term was requested", () => {
    const result = parseGenerationResult(
      JSON.stringify({
        summary: "The valley remembers.",
        consequences: [
          consequence("long_term"),
          consequence("long_term"),
          consequence("long_term"),
        ],
      }),
      3,
      "long_term",
    );
    expect(result.consequences.every((item) => item.timeframe === "long_term")).toBe(
      true,
    );
  });

  it("accepts mixed consequences in any order", () => {
    const result = parseGenerationResult(
      JSON.stringify({
        summary: "Ripples arrive on different clocks.",
        consequences: [
          consequence("long_term"),
          consequence("immediate"),
          consequence("next_session"),
        ],
      }),
      3,
      "mixed",
    );
    expect(new Set(result.consequences.map((item) => item.timeframe))).toEqual(
      new Set(["immediate", "next_session", "long_term"]),
    );
  });
});
