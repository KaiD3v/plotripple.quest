import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { AppError } from "@/lib/errors";
import {
  getRateLimitSecret,
  getUpstashRedisConfig,
  isProductionRuntime,
  RATE_LIMIT_MAX,
  type EnvSource,
} from "@/lib/env";

export type RateLimitLimiter = {
  limit(identifier: string): Promise<{ success: boolean }>;
};

const RATE_LIMIT_PREFIX = "plotripple:ai";

let testLimiter: RateLimitLimiter | null | undefined;
let cachedLimiter: RateLimitLimiter | null | undefined;
let cachedConfigKey: string | null = null;

export function __setRateLimiterForTests(
  limiter: RateLimitLimiter | null | undefined,
): void {
  testLimiter = limiter;
}

export function __resetRateLimitTestState(): void {
  testLimiter = undefined;
  cachedLimiter = undefined;
  cachedConfigKey = null;
}

export async function hashRateLimitId(
  ip: string,
  secret: string,
): Promise<string> {
  const payload = new TextEncoder().encode(`${secret}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function extractClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    const first = vercelForwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return "unknown";
}

export function createAiRateLimiter(redis: Redis): RateLimitLimiter {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(RATE_LIMIT_MAX, "24 h"),
    prefix: RATE_LIMIT_PREFIX,
    analytics: false,
  });
}

function resolveRateLimiter(env: EnvSource): RateLimitLimiter | null {
  if (testLimiter !== undefined) {
    return testLimiter;
  }

  const config = getUpstashRedisConfig(env);
  if (!config) {
    return null;
  }

  const configKey = `${config.url}\0${config.token}`;
  if (cachedLimiter && cachedConfigKey === configKey) {
    return cachedLimiter;
  }

  const redis = new Redis({
    url: config.url,
    token: config.token,
  });
  cachedLimiter = createAiRateLimiter(redis);
  cachedConfigKey = configKey;
  return cachedLimiter;
}

export async function enforceRateLimit(
  request: Request,
  env: EnvSource = process.env,
): Promise<void> {
  const secret = getRateLimitSecret(env);
  const limiter = resolveRateLimiter(env);

  if (!limiter || !secret) {
    if (isProductionRuntime(env)) {
      console.error("rate_limit_unconfigured");
      throw new AppError("INTERNAL_ERROR", 503);
    }
    console.warn(
      "Rate limiting skipped: Upstash Redis or RATE_LIMIT_SECRET is not configured.",
    );
    return;
  }

  const ip = extractClientIp(request);
  const id = await hashRateLimitId(ip, secret);

  let result: { success: boolean };
  try {
    result = await limiter.limit(id);
  } catch {
    console.error("rate_limit_backend_error");
    throw new AppError("INTERNAL_ERROR", 503);
  }

  if (!result.success) {
    throw new AppError("RATE_LIMITED", 429);
  }
}
