import { describe, expect, it } from "vitest";
import {
  expandRippleRequestSchema,
  followUpGenerationResultSchema,
} from "@/schemas/follow-up";

const validFollowUps = {
  followUps: [
    {
      title: "A quiet ledger opens",
      description: "Kin start recording favors.",
      timeframe: "next_session",
      category: "economic",
      trigger: "Anyone asks who spared the scout.",
      affectedParties: ["the kin"],
    },
    {
      title: "A rival offers shelter",
      description: "A border house invites the party as witnesses.",
      timeframe: "long_term",
      category: "political",
    },
  ],
};

describe("followUpGenerationResultSchema", () => {
  it("accepts exactly two follow-ups and strips canvas internals", () => {
    const result = followUpGenerationResultSchema.safeParse({
      followUps: [
        { ...validFollowUps.followUps[0], id: "evil", parentId: "nope", depth: 9 },
        validFollowUps.followUps[1],
      ],
    });
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.followUps).toHaveLength(2);
    expect(result.data.followUps[0]).not.toHaveProperty("id");
    expect(result.data.followUps[0]).not.toHaveProperty("parentId");
    expect(result.data.followUps[0]).not.toHaveProperty("depth");
  });

  it("rejects an incomplete or empty Gemini payload", () => {
    expect(followUpGenerationResultSchema.safeParse({ followUps: [] }).success).toBe(
      false,
    );
    expect(
      followUpGenerationResultSchema.safeParse({
        followUps: [validFollowUps.followUps[0]],
      }).success,
    ).toBe(false);
    expect(
      followUpGenerationResultSchema.safeParse({
        followUps: [
          { title: "", description: "Missing title" },
          validFollowUps.followUps[1],
        ],
      }).success,
    ).toBe(false);
  });
});

describe("expandRippleRequestSchema", () => {
  it("accepts a minimal expand context without graph internals", () => {
    const result = expandRippleRequestSchema.safeParse({
      locale: "pt-br",
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
        { title: "A whispered debt", excerpt: "Kin ask quiet favors." },
      ],
      existingTitles: ["A whispered debt", "Standing orders change"],
    });
    expect(result.success).toBe(true);
  });
});
