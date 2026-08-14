import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/gemini/generate-follow-ups", () => ({
  generateFollowUps: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(async () => undefined),
}));

import { generateFollowUps } from "@/lib/gemini/generate-follow-ups";
import { POST } from "@/app/api/expand/route";
import type { FollowUpGenerationResultParsed } from "@/schemas/follow-up";

const validPayload = {
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

const validResult: FollowUpGenerationResultParsed = {
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

function requestWith(body: unknown) {
  return new Request("http://localhost:3000/api/expand", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/expand", () => {
  beforeEach(() => {
    vi.mocked(generateFollowUps).mockReset();
    vi.mocked(generateFollowUps).mockResolvedValue(validResult);
  });

  it("accepts a valid expand context", async () => {
    const response = await POST(requestWith(validPayload));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(validResult);
    expect(generateFollowUps).toHaveBeenCalledTimes(1);
  });

  it("rejects a payload that includes graph internals without narrative fields", async () => {
    const response = await POST(
      requestWith({
        parentId: "chr:c:0",
        depth: 1,
        nodes: [],
      }),
    );
    expect(response.status).toBe(400);
    expect(generateFollowUps).not.toHaveBeenCalled();
  });
});
