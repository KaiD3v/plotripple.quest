import { AppError } from "@/lib/errors";
import {
  getRateLimitSecret,
  isProductionRuntime,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/env";

export type RateLimitStore = {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
};

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
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
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

export async function getRateLimitStore(): Promise<RateLimitStore | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    const kv = (
      context.env as { RATE_LIMIT_KV?: RateLimitStore | undefined }
    ).RATE_LIMIT_KV;
    return kv ?? null;
  } catch {
    return null;
  }
}

export async function enforceRateLimit(request: Request): Promise<void> {
  const store = await getRateLimitStore();
  const secret = getRateLimitSecret();

  if (!store || !secret) {
    if (isProductionRuntime()) {
      console.error("rate_limit_unconfigured");
      throw new AppError("INTERNAL_ERROR", 503);
    }
    console.warn(
      "Rate limiting skipped: RATE_LIMIT_KV or RATE_LIMIT_SECRET is not configured.",
    );
    return;
  }

  const ip = extractClientIp(request);
  const id = await hashRateLimitId(ip, secret);
  const key = `generate:${id}`;
  const currentRaw = await store.get(key);
  const current = Number.parseInt(currentRaw ?? "0", 10);
  const used = Number.isFinite(current) ? current : 0;

  if (used >= RATE_LIMIT_MAX) {
    throw new AppError("RATE_LIMITED", 429);
  }

  await store.put(key, String(used + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
  });
}
