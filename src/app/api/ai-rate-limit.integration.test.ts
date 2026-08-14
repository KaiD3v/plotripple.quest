import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/gemini/generate-consequences", () => ({
  generateConsequences: vi.fn(),
}));

vi.mock("@/lib/gemini/generate-follow-ups", () => ({
  generateFollowUps: vi.fn(),
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileIfConfigured: vi.fn(async () => undefined),
}));

import { POST as postExpand } from "@/app/api/expand/route";
import { POST as postGenerate } from "@/app/api/generate/route";
import { generateConsequences } from "@/lib/gemini/generate-consequences";
import { generateFollowUps } from "@/lib/gemini/generate-follow-ups";
import { RATE_LIMIT_MAX } from "@/lib/env";
import {
  __resetRateLimitTestState,
  __setRateLimiterForTests,
  type RateLimitLimiter,
} from "@/lib/rate-limit";
import type { FollowUpGenerationResultParsed } from "@/schemas/follow-up";

const sharedIp = "198.51.100.88";
const rateLimitSecret = "integration-rate-limit-secret";

const generatePayload = {
  eventDescription:
    "The party spared a captured goblin scout, warned the tribe to leave the valley, and returned to the nearby village.",
  tone: "political",
  intensity: "moderate",
  setting: "fantasy",
  timeframe: "long_term",
  count: 3,
};

const generateResult = {
  summary: "Mercy leaves a trail of obligations.",
  consequences: [
    {
      title: "A whispered debt",
      description: "The scout's kin begin asking quiet favors of the party.",
      timeframe: "next_session" as const,
      category: "social" as const,
      trigger: "The scout reports who showed mercy.",
      affectedParties: ["the scout's kin"],
    },
    {
      title: "Valley watchers",
      description: "The tribe relocates but keeps scouts on the ridge.",
      timeframe: "immediate" as const,
      category: "political" as const,
      trigger: "Anyone travels the valley road.",
      affectedParties: ["the tribe", "the village"],
    },
    {
      title: "A quiet alliance",
      description: "Village elders ask the party to speak for them.",
      timeframe: "long_term" as const,
      category: "social" as const,
      trigger: "The next harvest council meets.",
      affectedParties: ["the village council"],
    },
  ],
};

const expandPayload = {
  locale: "en" as const,
  tone: "mysterious" as const,
  intensity: "moderate" as const,
  setting: "fantasy" as const,
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

const expandResult: FollowUpGenerationResultParsed = {
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

function createMemoryLimiter(max: number): RateLimitLimiter & { calls: number } {
  const counts = new Map<string, number>();
  return {
    calls: 0,
    async limit(identifier: string) {
      this.calls += 1;
      const used = counts.get(identifier) ?? 0;
      if (used >= max) {
        return { success: false };
      }
      counts.set(identifier, used + 1);
      return { success: true };
    },
  };
}

function generateRequest(): Request {
  return new Request("http://localhost:3000/api/generate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": sharedIp,
    },
    body: JSON.stringify(generatePayload),
  });
}

function expandRequest(): Request {
  return new Request("http://localhost:3000/api/expand", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": sharedIp,
    },
    body: JSON.stringify(expandPayload),
  });
}

describe("shared AI rate limit across generate and expand routes", () => {
  const previousSecret = process.env.RATE_LIMIT_SECRET;

  beforeEach(() => {
    __resetRateLimitTestState();
    process.env.RATE_LIMIT_SECRET = rateLimitSecret;
    vi.mocked(generateConsequences).mockReset();
    vi.mocked(generateFollowUps).mockReset();
    vi.mocked(generateConsequences).mockResolvedValue(generateResult);
    vi.mocked(generateFollowUps).mockResolvedValue(expandResult);
  });

  afterEach(() => {
    __resetRateLimitTestState();
    if (previousSecret === undefined) {
      delete process.env.RATE_LIMIT_SECRET;
    } else {
      process.env.RATE_LIMIT_SECRET = previousSecret;
    }
  });

  it("shares one bucket and blocks the 21st call with RATE_LIMITED", async () => {
    const limiter = createMemoryLimiter(RATE_LIMIT_MAX);
    __setRateLimiterForTests(limiter);

    const generateBudget = 12;
    const expandBudget = RATE_LIMIT_MAX - generateBudget;

    for (let i = 0; i < generateBudget; i += 1) {
      const response = await postGenerate(generateRequest());
      expect(response.status).toBe(200);
    }

    for (let i = 0; i < expandBudget; i += 1) {
      const response = await postExpand(expandRequest());
      expect(response.status).toBe(200);
    }

    expect(generateConsequences).toHaveBeenCalledTimes(generateBudget);
    expect(generateFollowUps).toHaveBeenCalledTimes(expandBudget);
    expect(limiter.calls).toBe(RATE_LIMIT_MAX);

    const blockedGenerate = await postGenerate(generateRequest());
    expect(blockedGenerate.status).toBe(429);
    await expect(blockedGenerate.json()).resolves.toMatchObject({
      error: { code: "RATE_LIMITED" },
    });
    expect(generateConsequences).toHaveBeenCalledTimes(generateBudget);

    const blockedExpand = await postExpand(expandRequest());
    expect(blockedExpand.status).toBe(429);
    await expect(blockedExpand.json()).resolves.toMatchObject({
      error: { code: "RATE_LIMITED" },
    });
    expect(generateFollowUps).toHaveBeenCalledTimes(expandBudget);
    expect(limiter.calls).toBe(RATE_LIMIT_MAX + 2);
  });
});
