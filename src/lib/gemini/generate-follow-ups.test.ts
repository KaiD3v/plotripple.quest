import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { generateFollowUps } from "@/lib/gemini/generate-follow-ups";
import type { ExpandRippleRequestParsed } from "@/schemas/follow-up";

const input: ExpandRippleRequestParsed = {
  locale: "en",
  tone: "mysterious",
  intensity: "moderate",
  setting: "fantasy",
  chronicleTitle: "Scout mercy",
  originTitle: "The party spared the scout.",
  originDescription: "Mercy leaves a trail.",
  selected: {
    title: "A whispered debt",
    description: "Kin ask quiet favors.",
  },
  path: [
    { title: "The party spared the scout." },
    { title: "A whispered debt" },
  ],
  existingTitles: ["A whispered debt"],
};

const validResult = {
  followUps: [
    {
      title: "A quiet ledger opens",
      description: "Kin start recording favors.",
    },
    {
      title: "A rival offers shelter",
      description: "A border house invites the party as witnesses.",
    },
  ],
};

describe("generateFollowUps", () => {
  it("returns two validated follow-ups", async () => {
    const result = await generateFollowUps(input, {
      getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
      generateContent: async () => ({ text: JSON.stringify(validResult) }),
    });
    expect(result.followUps).toHaveLength(2);
    expect(result.followUps[0]?.title).toBe("A quiet ledger opens");
  });

  it("fails when GEMINI_API_KEY is missing", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await generateFollowUps(input, { getEnv: () => null });
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("AI_UNAVAILABLE");
    } finally {
      spy.mockRestore();
    }
  });

  it("fails on an invalid provider payload", async () => {
    await expect(
      generateFollowUps(input, {
        getEnv: () => ({ apiKey: "test-key", model: "gemini-3.5-flash" }),
        generateContent: async () => ({ text: JSON.stringify({ followUps: [] }) }),
      }),
    ).rejects.toMatchObject({ code: "INVALID_AI_RESPONSE" });
  });
});
