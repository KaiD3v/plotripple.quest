import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { RATE_LIMIT_MAX } from "@/lib/env";
import {
  __resetRateLimitTestState,
  __setRateLimiterForTests,
  enforceRateLimit,
  extractClientIp,
  hashRateLimitId,
  type RateLimitLimiter,
} from "@/lib/rate-limit";

function createMemoryLimiter(max: number): RateLimitLimiter & {
  calls: string[];
} {
  const counts = new Map<string, number>();
  const calls: string[] = [];
  return {
    calls,
    async limit(identifier: string) {
      calls.push(identifier);
      const used = counts.get(identifier) ?? 0;
      if (used >= max) {
        return { success: false };
      }
      counts.set(identifier, used + 1);
      return { success: true };
    },
  };
}

function requestWithIp(ip: string, header = "x-real-ip"): Request {
  return new Request("https://plotripple.vercel.app/api/generate", {
    method: "POST",
    headers: { [header]: ip },
  });
}

describe("hashRateLimitId", () => {
  it("does not embed the raw IP in the hashed identifier", async () => {
    const ip = "203.0.113.55";
    const hash = await hashRateLimitId(ip, "test-secret");
    expect(hash).not.toContain(ip);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("extractClientIp", () => {
  it("prefers x-real-ip from Vercel", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-real-ip": "198.51.100.10",
        "x-forwarded-for": "203.0.113.1, 10.0.0.1",
      },
    });
    expect(extractClientIp(request)).toBe("198.51.100.10");
  });

  it("uses x-vercel-forwarded-for before generic x-forwarded-for", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-vercel-forwarded-for": "198.51.100.20, 10.0.0.1",
        "x-forwarded-for": "203.0.113.1, 10.0.0.1",
      },
    });
    expect(extractClientIp(request)).toBe("198.51.100.20");
  });

  it("falls back to the first x-forwarded-for hop", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.9, 10.0.0.1",
      },
    });
    expect(extractClientIp(request)).toBe("203.0.113.9");
  });
});

describe("enforceRateLimit", () => {
  const secret = "rate-limit-test-secret";
  const upstashEnv = {
    NODE_ENV: "production",
    RATE_LIMIT_SECRET: secret,
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "upstash-token-value",
  };

  beforeEach(() => {
    __resetRateLimitTestState();
  });

  afterEach(() => {
    __resetRateLimitTestState();
    vi.restoreAllMocks();
  });

  it(`allows up to ${RATE_LIMIT_MAX} operations`, async () => {
    const limiter = createMemoryLimiter(RATE_LIMIT_MAX);
    __setRateLimiterForTests(limiter);
    const request = requestWithIp("198.51.100.1");

    for (let i = 0; i < RATE_LIMIT_MAX; i += 1) {
      await expect(
        enforceRateLimit(request, upstashEnv),
      ).resolves.toBeUndefined();
    }
  });

  it("returns RATE_LIMITED on the operation after the max", async () => {
    const limiter = createMemoryLimiter(RATE_LIMIT_MAX);
    __setRateLimiterForTests(limiter);
    const request = requestWithIp("198.51.100.2");

    for (let i = 0; i < RATE_LIMIT_MAX; i += 1) {
      await enforceRateLimit(request, upstashEnv);
    }

    await expect(enforceRateLimit(request, upstashEnv)).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
    } satisfies Partial<AppError>);
  });

  it("reuses one hashed identifier for repeated calls from the same IP", async () => {
    const limiter = createMemoryLimiter(RATE_LIMIT_MAX);
    __setRateLimiterForTests(limiter);
    const ip = "198.51.100.3";

    for (let i = 0; i < RATE_LIMIT_MAX; i += 1) {
      await enforceRateLimit(requestWithIp(ip), upstashEnv);
    }

    await expect(
      enforceRateLimit(requestWithIp(ip), upstashEnv),
    ).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
    });

    const expectedId = await hashRateLimitId(ip, secret);
    expect(limiter.calls.every((id) => id === expectedId)).toBe(true);
    expect(new Set(limiter.calls).size).toBe(1);
  });

  it("never passes the raw IP to the limiter", async () => {
    const limiter = createMemoryLimiter(RATE_LIMIT_MAX);
    __setRateLimiterForTests(limiter);
    const ip = "203.0.113.77";

    await enforceRateLimit(requestWithIp(ip), upstashEnv);

    expect(limiter.calls).toHaveLength(1);
    expect(limiter.calls[0]).not.toBe(ip);
    expect(limiter.calls[0]).not.toContain(ip);
  });

  it("skips limiting in development when Upstash is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    __setRateLimiterForTests(null);

    await expect(
      enforceRateLimit(requestWithIp("198.51.100.4"), {
        NODE_ENV: "development",
        RATE_LIMIT_SECRET: secret,
      }),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
  });

  it("fails closed in production when Upstash is missing", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    __setRateLimiterForTests(null);

    await expect(
      enforceRateLimit(requestWithIp("198.51.100.5"), {
        NODE_ENV: "production",
        RATE_LIMIT_SECRET: secret,
      }),
    ).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      status: 503,
    });

    expect(error).toHaveBeenCalledWith("rate_limit_unconfigured");
  });

  it("does not leak Redis URL, token, or secret when the backend fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const token = "super-secret-upstash-token";
    const url = "https://leaky-redis.upstash.io";
    const rateSecret = "super-secret-rate-limit";

    __setRateLimiterForTests({
      async limit() {
        throw new Error(
          `Redis failed talking to ${url} with token ${token} and secret ${rateSecret}`,
        );
      },
    });

    let thrown: unknown;
    try {
      await enforceRateLimit(requestWithIp("198.51.100.6"), {
        NODE_ENV: "production",
        RATE_LIMIT_SECRET: rateSecret,
        UPSTASH_REDIS_REST_URL: url,
        UPSTASH_REDIS_REST_TOKEN: token,
      });
    } catch (candidate) {
      thrown = candidate;
    }

    expect(thrown).toMatchObject({
      code: "INTERNAL_ERROR",
      status: 503,
    });
    expect(String(thrown)).not.toContain(token);
    expect(String(thrown)).not.toContain(url);
    expect(String(thrown)).not.toContain(rateSecret);

    const logged = error.mock.calls.flat().map(String).join(" ");
    expect(logged).not.toContain(token);
    expect(logged).not.toContain(url);
    expect(logged).not.toContain(rateSecret);
    expect(error).toHaveBeenCalledWith("rate_limit_backend_error");
  });
});
