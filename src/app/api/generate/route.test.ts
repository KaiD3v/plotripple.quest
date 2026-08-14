import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/gemini/generate-consequences", () => ({
  generateConsequences: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(async () => undefined),
}));

import { AppError } from "@/lib/errors";
import { generateConsequences } from "@/lib/gemini/generate-consequences";
import { enforceRateLimit } from "@/lib/rate-limit";
import { POST } from "@/app/api/generate/route";

const validPayload = {
  eventDescription:
    "The party spared a captured goblin scout, warned the tribe to leave the valley, and returned to the nearby village.",
  tone: "political",
  intensity: "moderate",
  setting: "fantasy",
  timeframe: "long_term",
  count: 3,
};

const validResult = {
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

function requestWith(body: unknown, extra?: RequestInit) {
  return new Request("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    ...extra,
  });
}

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.mocked(generateConsequences).mockReset();
    vi.mocked(enforceRateLimit).mockReset();
    vi.mocked(generateConsequences).mockResolvedValue(validResult);
    vi.mocked(enforceRateLimit).mockResolvedValue(undefined);
  });

  it("accepts a valid payload without a captcha token field", async () => {
    const response = await POST(requestWith(validPayload));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(validResult);
    expect(enforceRateLimit).toHaveBeenCalledTimes(1);
    expect(generateConsequences).toHaveBeenCalledTimes(1);
    const captchaTokenField = ["turn", "stile", "Token"].join("");
    expect(generateConsequences).toHaveBeenCalledWith(
      expect.not.objectContaining({ [captchaTokenField]: expect.anything() }),
    );
  });

  it("does not call Gemini when rate limiting blocks the request", async () => {
    vi.mocked(enforceRateLimit).mockRejectedValue(
      new AppError("RATE_LIMITED", 429),
    );
    const response = await POST(requestWith(validPayload));
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "RATE_LIMITED" },
    });
    expect(generateConsequences).not.toHaveBeenCalled();
  });

  it("rejects a description shorter than 20 characters", async () => {
    const response = await POST(
      requestWith({ ...validPayload, eventDescription: "Too short" }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
    expect(enforceRateLimit).not.toHaveBeenCalled();
    expect(generateConsequences).not.toHaveBeenCalled();
  });

  it("rejects a description longer than 1000 characters", async () => {
    const response = await POST(
      requestWith({ ...validPayload, eventDescription: "a".repeat(1001) }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("rejects a count other than 3 or 5", async () => {
    const response = await POST(requestWith({ ...validPayload, count: 4 }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("rejects an invalid enum value", async () => {
    const response = await POST(
      requestWith({ ...validPayload, tone: "grimdark" }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("accepts Portuguese locale", async () => {
    const response = await POST(
      requestWith({ ...validPayload, locale: "pt-br" }),
    );
    expect(response.status).toBe(200);
    expect(generateConsequences).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "pt-br" }),
    );
  });

  it("accepts English locale", async () => {
    const response = await POST(requestWith({ ...validPayload, locale: "en" }));
    expect(response.status).toBe(200);
    expect(generateConsequences).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "en" }),
    );
  });

  it("defaults locale to English when omitted", async () => {
    const response = await POST(requestWith(validPayload));
    expect(response.status).toBe(200);
    expect(generateConsequences).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "en" }),
    );
  });

  it("does not expose stack traces or internal details", async () => {
    vi.mocked(generateConsequences).mockRejectedValue(
      new Error("secret stack GEMINI_API_KEY=abc"),
    );
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(requestWith(validPayload));
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("GEMINI_API_KEY");
    expect(JSON.stringify(body)).not.toContain("secret stack");
    expect(body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
      },
    });
    spy.mockRestore();
  });
});
